import type { DockerNodeConfig } from './runner.js';
import { nodeRegistry } from '@ynode/core';

export interface SandboxConfig {
  name: string;
  description: string;
  baseImage: string;
  defaultTimeout: number;
  memoryLimit: string;
  cpuLimit: number;
  networkDisabled: boolean;
}

export const SANDBOX_PRESETS: Record<string, SandboxConfig> = {
  'node-isolated': {
    name: 'Node.js Isolated',
    description: 'Node.js container without network access',
    baseImage: 'node:20-alpine',
    defaultTimeout: 30000,
    memoryLimit: '128m',
    cpuLimit: 0.5,
    networkDisabled: true,
  },
  'node-network': {
    name: 'Node.js with Network',
    description: 'Node.js container with network access for API calls',
    baseImage: 'node:20-alpine',
    defaultTimeout: 60000,
    memoryLimit: '256m',
    cpuLimit: 1.0,
    networkDisabled: false,
  },
  'python-isolated': {
    name: 'Python Isolated',
    description: 'Python container without network access',
    baseImage: 'python:3.12-alpine',
    defaultTimeout: 30000,
    memoryLimit: '128m',
    cpuLimit: 0.5,
    networkDisabled: true,
  },
  'python-network': {
    name: 'Python with Network',
    description: 'Python container with network access',
    baseImage: 'python:3.12-alpine',
    defaultTimeout: 60000,
    memoryLimit: '256m',
    cpuLimit: 1.0,
    networkDisabled: false,
  },
};

export interface NodeDockerConfig {
  preset: keyof typeof SANDBOX_PRESETS;
  requiresNetwork: boolean;
}

export const NODE_DOCKER_CONFIGS: Record<string, NodeDockerConfig> = {
  trigger: {
    preset: 'node-isolated',
    requiresNetwork: false,
  },
  httpRequest: {
    preset: 'node-network',
    requiresNetwork: true,
  },
  ifElse: {
    preset: 'node-isolated',
    requiresNetwork: false,
  },
};

export function getNodeDockerConfig(nodeType: string): NodeDockerConfig {
  const nodeDef = nodeRegistry.get(nodeType);
  if (nodeDef) {
    const requiresNetwork = nodeDef.requiresNetwork ?? false;
    return {
      preset: requiresNetwork ? 'node-network' : 'node-isolated',
      requiresNetwork,
    };
  }

  return (
    NODE_DOCKER_CONFIGS[nodeType] || {
      preset: 'node-network',
      requiresNetwork: true,
    }
  );
}

export function createSandboxConfig(
  preset: keyof typeof SANDBOX_PRESETS | string,
  overrides?: Partial<DockerNodeConfig>
): DockerNodeConfig {
  const sandbox = SANDBOX_PRESETS[preset] || SANDBOX_PRESETS['node-network'];

  return {
    image: sandbox.baseImage,
    timeout: sandbox.defaultTimeout,
    memoryLimit: sandbox.memoryLimit,
    cpuLimit: sandbox.cpuLimit,
    networkDisabled: sandbox.networkDisabled,
    ...overrides,
  };
}

export function createNodeDockerConfig(
  nodeType: string,
  overrides?: Partial<DockerNodeConfig>
): DockerNodeConfig {
  const config = getNodeDockerConfig(nodeType);
  return createSandboxConfig(config.preset, overrides);
}

export function generateNodeScript(
  code: string,
  runtime: 'node' | 'python' = 'node'
): string[] {
  if (runtime === 'python') {
    return [
      'python',
      '-c',
      `
import json
import os
import sys

inputs = json.loads(os.environ.get('YNODE_INPUTS', '{}'))
outputs = {}

try:
${code
  .split('\n')
  .map((line) => '    ' + line)
  .join('\n')}
    print(json.dumps({"success": True, "outputs": outputs}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
    sys.exit(1)
`,
    ];
  }

  return [
    'node',
    '-e',
    `
const inputs = JSON.parse(process.env.YNODE_INPUTS || '{}');
const outputs = {};

try {
${code}
    console.log(JSON.stringify({ success: true, outputs }));
} catch (error) {
    console.log(JSON.stringify({ success: false, error: error.message }));
    process.exit(1);
}
`,
  ];
}

export function validateSandboxPreset(
  preset: string
): preset is keyof typeof SANDBOX_PRESETS {
  return preset in SANDBOX_PRESETS;
}

export function listSandboxPresets(): SandboxConfig[] {
  return Object.values(SANDBOX_PRESETS);
}
