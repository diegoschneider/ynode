import { describe, it, expect, beforeEach } from 'vitest';
import { nodeRegistry, registerBuiltinNodes, triggerNode } from '@ynode/core';

describe('NodeRegistry', () => {
  beforeEach(() => {
    nodeRegistry.clear();
  });

  describe('register', () => {
    it('should register a node definition', () => {
      registerBuiltinNodes();
      expect(nodeRegistry.has('trigger')).toBe(true);
      expect(nodeRegistry.has('httpRequest')).toBe(true);
      expect(nodeRegistry.has('ifElse')).toBe(true);
    });

    it('should throw error when registering duplicate type', () => {
      registerBuiltinNodes();
      expect(() => nodeRegistry.register(triggerNode)).toThrow(
        'Node type "trigger" is already registered'
      );
    });
  });

  describe('get', () => {
    it('should return node definition by type', () => {
      registerBuiltinNodes();
      const trigger = nodeRegistry.get('trigger');
      expect(trigger).toBeDefined();
      expect(trigger?.type).toBe('trigger');
      expect(trigger?.label).toBe('Trigger');
      expect(trigger?.category).toBe('trigger');
    });

    it('should return undefined for unknown type', () => {
      const unknown = nodeRegistry.get('unknown-node');
      expect(unknown).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all registered nodes', () => {
      registerBuiltinNodes();
      const all = nodeRegistry.getAll();
      expect(all.length).toBe(13);
    });

    it('should return empty array when no nodes registered', () => {
      const all = nodeRegistry.getAll();
      expect(all).toEqual([]);
    });
  });

  describe('getByCategory', () => {
    it('should filter nodes by category', () => {
      registerBuiltinNodes();

      const triggers = nodeRegistry.getByCategory('trigger');
      expect(triggers.length).toBe(3);

      const logic = nodeRegistry.getByCategory('logic');
      expect(logic.length).toBe(4);

      const integrations = nodeRegistry.getByCategory('integration');
      expect(integrations.length).toBe(1);
    });
  });

  describe('size', () => {
    it('should return correct count', () => {
      expect(nodeRegistry.size).toBe(0);
      registerBuiltinNodes();
      expect(nodeRegistry.size).toBe(13);
    });
  });
});
