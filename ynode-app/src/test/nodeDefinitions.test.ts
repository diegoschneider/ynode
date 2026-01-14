import { describe, it, expect, vi } from 'vitest';
import { triggerNode, httpRequestNode, ifElseNode } from '@ynode/core';
import type { ExecutionContext } from '@ynode/core';

function createMockContext<T>(
  config: T,
  inputs: Record<string, unknown> = {}
): ExecutionContext<T> {
  return {
    nodeId: 'test-node-1',
    config,
    inputs,
    variables: {},
    log: vi.fn(),
    workflowId: 'test-workflow-1',
    executionId: 'test-execution-1',
    credentials: {
      get: vi
        .fn()
        .mockRejectedValue(new Error('Credentials not accessible in tests')),
    },
    memory: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue([]),
    },
    workflowMemory: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue([]),
    },
  };
}

describe('TriggerNode', () => {
  it('should have correct metadata', () => {
    expect(triggerNode.type).toBe('trigger');
    expect(triggerNode.category).toBe('trigger');
    expect(triggerNode.inputs).toHaveLength(0);
    expect(triggerNode.outputs).toHaveLength(1);
  });

  it('should execute and return trigger data', async () => {
    const ctx = createMockContext(triggerNode.defaultConfig);
    const result = await triggerNode.execute(ctx);

    expect(result.data.trigger).toBeDefined();
    expect((result.data.trigger as Record<string, unknown>).triggered).toBe(
      true
    );
    expect((result.data.trigger as Record<string, unknown>).type).toBe(
      'manual'
    );
  });
});

describe('HttpRequestNode', () => {
  it('should have correct metadata', () => {
    expect(httpRequestNode.type).toBe('httpRequest');
    expect(httpRequestNode.category).toBe('integration');
    expect(httpRequestNode.inputs.length).toBeGreaterThan(0);
    expect(httpRequestNode.outputs.length).toBeGreaterThan(0);
  });

  it('should return error when URL is empty', async () => {
    const ctx = createMockContext({
      ...httpRequestNode.defaultConfig,
      url: '',
    });
    const result = await httpRequestNode.execute(ctx);

    expect(result.error).toBeDefined();
    expect(result.data.error).toBeDefined();
  });

  it('should use urlOverride from inputs', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ success: true }),
      headers: new Headers(),
    });

    const ctx = createMockContext(
      { ...httpRequestNode.defaultConfig, url: 'http://original.com' },
      { urlOverride: 'http://override.com' }
    );

    await httpRequestNode.execute(ctx);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://override.com',
      expect.any(Object)
    );

    globalThis.fetch = originalFetch;
  });
});

describe('IfElseNode', () => {
  it('should have correct metadata', () => {
    expect(ifElseNode.type).toBe('ifElse');
    expect(ifElseNode.category).toBe('logic');
    expect(ifElseNode.outputs).toHaveLength(2);
    expect(ifElseNode.outputs[0].id).toBe('true');
    expect(ifElseNode.outputs[1].id).toBe('false');
  });

  it('should return true branch when condition is true', async () => {
    const ctx = createMockContext(
      { condition: 'data.value > 5' },
      { data: { value: 10 } }
    );

    const result = await ifElseNode.execute(ctx);
    expect(result.branch).toBe('true');
    expect(result.data.true).toBeDefined();
  });

  it('should return false branch when condition is false', async () => {
    const ctx = createMockContext(
      { condition: 'data.value > 5' },
      { data: { value: 2 } }
    );

    const result = await ifElseNode.execute(ctx);
    expect(result.branch).toBe('false');
    expect(result.data.false).toBeDefined();
  });

  it('should handle invalid conditions gracefully', async () => {
    const ctx = createMockContext(
      { condition: 'invalid.syntax.' },
      { data: {} }
    );

    const result = await ifElseNode.execute(ctx);
    expect(result.branch).toBe('false');
    expect(result.error).toBeDefined();
  });
});
