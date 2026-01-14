# @ynode/cli

CLI tools for creating custom nodes.

## Usage

### For ynode-core Contributors (internal)

```bash
node packages/ynode-cli/dist/cli.js create-node MyNode -c utility -o packages/ynode-core/src/nodes --internal
```

After creating, open `packages/ynode-core/src/nodes/index.ts` and add these 3 lines:

```typescript
// 1. Add import at the top with other imports
import { myNodeNode } from './my-node';

// 2. Add export with other exports
export { myNodeNode } from './my-node';

// 3. Add register inside registerBuiltinNodes() function
nodeRegistry.register(myNodeNode);
```

Then build:

```bash
pnpm --filter @ynode/core build
```

## Full Example

Before:

```typescript
import { getVariableNode } from './getVariable';

export { getVariableNode } from './getVariable';

export function registerBuiltinNodes(): void {
  // ...
  nodeRegistry.register(getVariableNode);
}
```

After adding `MyNode`:

```typescript
import { getVariableNode } from './getVariable';
import { myNodeNode } from './my-node'; // <- ADD

export { getVariableNode } from './getVariable';
export { myNodeNode } from './my-node'; // <- ADD

export function registerBuiltinNodes(): void {
  // ...
  nodeRegistry.register(getVariableNode);
  nodeRegistry.register(myNodeNode); // <- ADD
}
```

## Options

| Option           | Description                             |
| ---------------- | --------------------------------------- |
| `-c, --category` | Node category (default: custom)         |
| `-o, --output`   | Output directory (default: ./src/nodes) |
| `--credentials`  | Include credential support template     |
| `--internal`     | Use relative imports (for ynode-core)   |
