# @ynode/core

Shared types, node definitions, and utilities.

## Structure

```
src/
├── nodes/
│   ├── delay.ts
│   ├── getVariable.ts
│   ├── httpRequest.ts
│   ├── ifElse.ts
│   ├── index.ts
│   ├── jsonTransform.ts
│   ├── merge.ts
│   ├── schedule.ts
│   ├── setVariable.ts
│   ├── split.ts
│   ├── switch.ts
│   ├── template.ts
│   ├── trigger.ts
│   └── webhook.ts
├── types/
│   ├── execution.ts
│   ├── index.ts
│   ├── node.ts
│   ├── port.ts
│   └── serialization.ts
├── index.ts
├── pluginLoader.ts
├── registry.ts
├── serializer.ts
└── validation.ts
```

## Usage

```typescript
import {
  nodeRegistry,
  registerBuiltinNodes,
  serializeNodeTypes,
  pluginManager,
} from '@ynode/core';

registerBuiltinNodes();
const response = serializeNodeTypes('1.0.0');
```

## Adding Nodes

Please refer to the [CLI documentation](../ynode-cli/README.md) for instructions on how to create and register new nodes.
