import Docker from 'dockerode';
import { Readable } from 'stream';

export interface DockerNodeConfig {
  image: string;
  command?: string[];
  timeout?: number;
  memoryLimit?: string;
  cpuLimit?: number;
  env?: Record<string, string>;
  networkDisabled?: boolean;
  workDir?: string;
}

export interface DockerRunResult {
  success: boolean;
  outputs: Record<string, unknown>;
  logs: string[];
  duration: number;
  containerId?: string;
  exitCode?: number;
}

export interface DockerNodeRunner {
  run(
    nodeId: string,
    config: DockerNodeConfig,
    inputs: Record<string, unknown>
  ): Promise<DockerRunResult>;

  cleanup(containerId: string): Promise<void>;

  isAvailable(): Promise<boolean>;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MEMORY_LIMIT = '128m';
const DEFAULT_CPU_LIMIT = 0.5;

function parseMemoryLimit(limit: string): number {
  const match = limit.match(/^(\d+)([kmg]?)$/i);
  if (!match) return 128 * 1024 * 1024;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'k':
      return value * 1024;
    case 'm':
      return value * 1024 * 1024;
    case 'g':
      return value * 1024 * 1024 * 1024;
    default:
      return value;
  }
}

async function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

function demuxDockerOutput(buffer: Buffer): string[] {
  const lines: string[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;

    const size = buffer.readUInt32BE(offset + 4);
    offset += 8;

    if (offset + size > buffer.length) break;

    const content = buffer.subarray(offset, offset + size).toString('utf8');
    lines.push(...content.split('\n').filter((l) => l.trim()));
    offset += size;
  }

  return lines.length > 0
    ? lines
    : buffer
        .toString('utf8')
        .split('\n')
        .filter((l) => l.trim());
}

export class DockerNodeRunnerImpl implements DockerNodeRunner {
  private docker: Docker;

  constructor(options?: Docker.DockerOptions) {
    this.docker = new Docker(options);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }

  async run(
    nodeId: string,
    config: DockerNodeConfig,
    inputs: Record<string, unknown>
  ): Promise<DockerRunResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    let container: Docker.Container | null = null;

    try {
      logs.push(`[Docker] Starting execution for node ${nodeId}`);
      logs.push(`[Docker] Image: ${config.image}`);

      const images = await this.docker.listImages({
        filters: { reference: [config.image] },
      });

      if (images.length === 0) {
        logs.push(`[Docker] Pulling image ${config.image}...`);
        await new Promise<void>((resolve, reject) => {
          this.docker.pull(
            config.image,
            (err: Error | null, stream: NodeJS.ReadableStream) => {
              if (err) return reject(err);
              this.docker.modem.followProgress(
                stream,
                (pullErr: Error | null) => {
                  if (pullErr) reject(pullErr);
                  else resolve();
                }
              );
            }
          );
        });
        logs.push(`[Docker] Image pulled successfully`);
      }

      const inputJson = JSON.stringify(inputs);
      const envVars: string[] = [
        `YNODE_INPUTS=${inputJson}`,
        `YNODE_NODE_ID=${nodeId}`,
      ];

      if (config.env) {
        for (const [key, value] of Object.entries(config.env)) {
          envVars.push(`${key}=${value}`);
        }
      }

      const createOptions: Docker.ContainerCreateOptions = {
        Image: config.image,
        Cmd: config.command || [
          'node',
          '-e',
          `
                    const inputs = JSON.parse(process.env.YNODE_INPUTS || '{}');
                    console.log(JSON.stringify({ success: true, outputs: inputs }));
                `,
        ],
        Env: envVars,
        WorkingDir: config.workDir || '/app',
        HostConfig: {
          Memory: parseMemoryLimit(config.memoryLimit || DEFAULT_MEMORY_LIMIT),
          NanoCpus: Math.floor((config.cpuLimit || DEFAULT_CPU_LIMIT) * 1e9),
          NetworkMode: config.networkDisabled ? 'none' : 'bridge',
          AutoRemove: false,
        },
        AttachStdout: true,
        AttachStderr: true,
        Tty: false,
      };

      container = await this.docker.createContainer(createOptions);
      logs.push(`[Docker] Container created: ${container.id.substring(0, 12)}`);

      const timeout = config.timeout || DEFAULT_TIMEOUT;
      let timedOut = false;

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          timedOut = true;
          reject(new Error(`Execution timed out after ${timeout}ms`));
        }, timeout);
      });

      const executionPromise = (async () => {
        await container!.start();
        logs.push(`[Docker] Container started`);

        const result = await container!.wait();
        logs.push(`[Docker] Container exited with code ${result.StatusCode}`);

        const logStream = await container!.logs({
          stdout: true,
          stderr: true,
          follow: false,
        });

        // Handle both Buffer and Readable stream from Docker
        let rawLogs: string;
        if (Buffer.isBuffer(logStream)) {
          rawLogs = logStream.toString('utf8');
        } else {
          rawLogs = await streamToString(logStream as Readable);
        }
        const outputLines = demuxDockerOutput(Buffer.from(rawLogs));

        return { exitCode: result.StatusCode, outputLines };
      })();

      const { exitCode, outputLines } = await Promise.race([
        executionPromise,
        timeoutPromise,
      ]);

      logs.push(...outputLines.map((line) => `[Container] ${line}`));

      let outputs: Record<string, unknown> = {};
      const lastLine = outputLines[outputLines.length - 1];

      if (lastLine) {
        try {
          const parsed = JSON.parse(lastLine);
          if (parsed && typeof parsed === 'object') {
            outputs = parsed.outputs || parsed;
          }
        } catch {
          outputs = { raw: lastLine };
        }
      }

      const duration = Date.now() - startTime;
      logs.push(`[Docker] Execution completed in ${duration}ms`);

      return {
        success: exitCode === 0,
        outputs,
        logs,
        duration,
        containerId: container.id,
        exitCode,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logs.push(`[Docker] Error: ${errorMessage}`);

      return {
        success: false,
        outputs: { error: errorMessage },
        logs,
        duration,
        containerId: container?.id,
      };
    } finally {
      if (container) {
        try {
          await container.remove({ force: true });
          logs.push(`[Docker] Container removed`);
        } catch {
          // Container may already be removed
        }
      }
    }
  }

  async cleanup(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop({ t: 5 });
      await container.remove({ force: true });
    } catch {
      // Container may not exist or already be removed
    }
  }

  async pullImage(imageName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.docker.pull(
        imageName,
        (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) return reject(err);
          this.docker.modem.followProgress(stream, (pullErr: Error | null) => {
            if (pullErr) reject(pullErr);
            else resolve();
          });
        }
      );
    });
  }

  async listRunningContainers(): Promise<Docker.ContainerInfo[]> {
    return this.docker.listContainers({ all: false });
  }
}

export class DockerNodeRunnerStub implements DockerNodeRunner {
  async run(
    nodeId: string,
    config: DockerNodeConfig,
    inputs: Record<string, unknown>
  ): Promise<DockerRunResult> {
    console.log(`[DockerNodeRunner] Would execute node ${nodeId} in container`);
    console.log(`[DockerNodeRunner] Image: ${config.image}`);
    console.log(`[DockerNodeRunner] Inputs: ${JSON.stringify(inputs)}`);

    return {
      success: true,
      outputs: { message: 'Docker execution stub - Docker not available' },
      logs: ['Docker execution stub - Docker daemon not detected'],
      duration: 0,
    };
  }

  async cleanup(_containerId: string): Promise<void> {
    // No-op for stub
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }
}

let cachedRunner: DockerNodeRunner | null = null;

export async function createDockerRunner(): Promise<DockerNodeRunner> {
  if (cachedRunner) return cachedRunner;

  const realRunner = new DockerNodeRunnerImpl();
  const isAvailable = await realRunner.isAvailable();

  if (isAvailable) {
    console.log('[Docker] Docker daemon detected, using real Docker runner');
    cachedRunner = realRunner;
  } else {
    console.log('[Docker] Docker daemon not available, using stub runner');
    cachedRunner = new DockerNodeRunnerStub();
  }

  return cachedRunner;
}

export function getDockerRunner(): DockerNodeRunner {
  return cachedRunner || new DockerNodeRunnerStub();
}
