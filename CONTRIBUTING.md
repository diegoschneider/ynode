# Contributing to ynode

Thanks for your interest in contributing! This guide covers all types of contributions.

## Table of Contents

- [Contributing to ynode](#contributing-to-ynode)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
    - [Running Development Servers](#running-development-servers)
  - [Project Architecture](#project-architecture)
    - [Key Components](#key-components)
    - [Data Flow](#data-flow)
  - [Types of Contributions](#types-of-contributions)
    - [New Nodes](#new-nodes)
    - [Frontend (ynode-app)](#frontend-ynode-app)
    - [Backend (ynode-server)](#backend-ynode-server)
    - [Core Library (@ynode/core)](#core-library-ynodecore)
    - [CLI Tools](#cli-tools)
    - [Documentation](#documentation)
    - [Bug Fixes](#bug-fixes)
  - [Creating Nodes](#creating-nodes)
    - [Quick Start](#quick-start)
    - [Node Categories](#node-categories)
    - [Node Definition](#node-definition)
    - [Port Types](#port-types)
    - [Credentials](#credentials)
    - [Memory](#memory)
  - [Testing](#testing)
    - [Frontend](#frontend)
    - [Manual Testing](#manual-testing)
    - [Validate Node Definition](#validate-node-definition)
  - [Submitting a Pull Request](#submitting-a-pull-request)
    - [Before Submitting](#before-submitting)
    - [PR Checklist](#pr-checklist)
    - [Creating the PR](#creating-the-pr)
  - [Code Style](#code-style)
  - [Reporting Issues](#reporting-issues)
  - [Questions?](#questions)

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm**

### Setup

```bash
git clone https://github.com/iamyureka/ynode.git
cd ynode
pnpm install
pnpm --filter @ynode/core build
```

### Running Development Servers

```bash
# Terminal 1: Backend
pnpm --filter ynode-server dev

# Terminal 2: Frontend
pnpm --filter ynode-app dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

---

## Project Architecture

```
ynode/
├── packages/
│   ├── ynode-core/       # Shared types, node definitions, registry
│   └── ynode-cli/        # CLI for scaffolding new nodes
├── ynode-nodes/          # Community/integration nodes
├── ynode-app/            # Frontend (React + Vite + React Flow)
└── ynode-server/         # Backend (Express + SQLite + WebSocket)
```

### Key Components

| Component      | Purpose                                                          |
| -------------- | ---------------------------------------------------------------- |
| `@ynode/core`  | Type definitions, node registry, validation, serialization       |
| `ynode-cli`    | Scaffolding tool for creating new nodes                          |
| `ynode-nodes`  | Community-contributed nodes (OpenAI, Telegram, converters, etc.) |
| `ynode-server` | Executes workflows, manages auth, credentials, WebSocket         |
| `ynode-app`    | Visual workflow editor UI                                        |

### Data Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ynode-app     │◄──►│  ynode-server   │◄──►│   @ynode/core   │
│   (Frontend)    │    │   (Executor)    │    │   (Definitions) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   ynode-nodes   │
                       └─────────────────┘
```

---

## Types of Contributions

### New Nodes

Add integrations with external services or utility nodes.

| Location                     | What to modify                    |
| ---------------------------- | --------------------------------- |
| `ynode-nodes/<name>/node.ts` | Node definition and execute logic |

See [Creating Nodes](#creating-nodes) for details.

---

### Frontend (ynode-app)

React + Vite + React Flow application.

| Area             | Location                                   |
| ---------------- | ------------------------------------------ |
| Canvas / Editor  | `src/components/Canvas/`                   |
| Node rendering   | `src/components/nodes/GenericNode.tsx`     |
| Property panel   | `src/components/NodeConfig/`               |
| Execution logs   | `src/components/ExecutionPanel/`           |
| Sidebar          | `src/components/Sidebar/`                  |
| Pages            | `src/pages/` (Dashboard, Editor, Settings) |
| State management | `src/store/` (Zustand stores)              |
| API calls        | `src/api/`                                 |
| Styles           | `src/index.css`, `tailwind.config.js`      |

**Stack:**
- React 19, TypeScript
- React Flow for the node editor
- TailwindCSS for styling
- Zustand for state management

**Running frontend only:**
```bash
pnpm --filter ynode-app dev
```

---

### Backend (ynode-server)

Express + SQLite + WebSocket server.

| Area                    | Location                            |
| ----------------------- | ----------------------------------- |
| API routes              | `src/server.ts`                     |
| Workflow execution      | `src/executor/index.ts`             |
| Node loading            | `src/nodes/loader.ts`               |
| Database layer          | `src/db/`                           |
| Auth & sessions         | `src/db/auth.ts`, `src/middleware/` |
| Credentials (encrypted) | `src/db/credentials.ts`             |
| Memory storage          | `src/db/memory.ts`                  |
| WebSocket               | `src/websocket/`                    |
| Validation schemas      | `src/validation/`                   |

**Stack:**
- Express.js, TypeScript
- better-sqlite3 for database
- ws for WebSocket
- Argon2 for password hashing
- AES-256-GCM for credential encryption

**Running backend only:**
```bash
pnpm --filter ynode-server dev
```

**Environment variables:** Copy `.env.example` to `.env`

---

### Core Library (@ynode/core)

Shared types and utilities used by both server and nodes.

| Area                | Location                 |
| ------------------- | ------------------------ |
| Node interface      | `src/types/node.ts`      |
| Port types & colors | `src/types/port.ts`      |
| Execution context   | `src/types/execution.ts` |
| Node registry       | `src/registry.ts`        |
| Plugin loader       | `src/pluginLoader.ts`    |
| Validation          | `src/validation.ts`      |
| Built-in nodes      | `src/nodes/`             |

**After changes:**
```bash
pnpm --filter @ynode/core build
```

---

### CLI Tools

Developer tooling for node scaffolding.

| Area      | Location                                    |
| --------- | ------------------------------------------- |
| CLI entry | `packages/ynode-cli/src/cli.ts`             |
| Commands  | `packages/ynode-cli/src/commands/`          |
| Templates | `packages/ynode-cli/src/utils/templates.ts` |

**After changes:**
```bash
pnpm --filter @ynode/cli build
```

---

### Documentation

- `README.md` - Project overview
- `CONTRIBUTING.md` - This file
- `packages/*/README.md` - Package-specific docs

---

### Bug Fixes

1. Please check existing issues first
2. Create an issue if one doesn't exist
3. Reference the issue in your PR

---

## Creating Nodes

### Quick Start

```bash
# Basic node
node packages/ynode-cli/dist/cli.js create-node MyNode -c utility

# With credential support
node packages/ynode-cli/dist/cli.js create-node Slack -c communication --credentials
```

Creates `ynode-nodes/<node-name>/node.ts`.

**After creating:**
1. Implement logic in the generated file
2. `pnpm --filter @ynode/core build`
3. Restart `ynode-server`

### Node Categories

| Category        | Description           |
| --------------- | --------------------- |
| `trigger`       | Workflow entry points |
| `logic`         | Control flow          |
| `transform`     | Data transformation   |
| `integration`   | External APIs         |
| `ai`            | LLM integrations      |
| `communication` | Messaging services    |
| `data`          | Storage/variables     |
| `utility`       | General helpers       |
| `custom`        | User-defined          |

### Node Definition

```typescript
import { z } from 'zod';
import { defineNode } from '@ynode/core';
import type { ExecutionContext, NodeOutput } from '@ynode/core';

const configSchema = z.object({
    myOption: z.string().default('default value'),
});

type MyNodeConfig = z.infer<typeof configSchema>;

export const myNode = defineNode<MyNodeConfig>({
    type: 'my-node',
    label: 'My Node',
    description: 'What this node does',
    category: 'utility',
    icon: 'Box',  // https://lucide.dev/icons

    inputs: [
        { id: 'trigger', label: 'Trigger', type: 'trigger', required: true },
        { id: 'data', label: 'Data', type: 'string' },
    ],

    outputs: [
        { id: 'result', label: 'Result', type: 'object' },
        { id: 'error', label: 'Error', type: 'object' },
    ],

    configSchema,
    defaultConfig: { myOption: 'default value' },

    async execute(ctx: ExecutionContext<MyNodeConfig>): Promise<NodeOutput> {
        const { config, inputs, log } = ctx;
        log(`Option: ${config.myOption}`);

        return {
            data: {
                default: { processed: true, input: inputs.data },
                result: { processed: true, input: inputs.data },
            },
        };
    },
});

export default myNode;
```

### Port Types

| Category   | Types                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------- |
| Primitive  | `string`, `number`, `boolean`, `null`                                                        |
| Structured | `object`, `array`, `json`                                                                    |
| Format     | `datetime`, `date`, `time`, `url`, `email`, `uuid`, `markdown`, `html`, `xml`, `yaml`, `csv` |
| Binary     | `binary`, `image`, `audio`, `video`, `pdf`                                                   |
| Special    | `any`, `trigger`                                                                             |

### Credentials

```typescript
export const myNode = defineNode({
    // ...
    credentials: [{ type: 'my-api', required: true, description: 'API key' }],
    requiresNetwork: true,

    async execute(ctx) {
        const creds = await ctx.credentials.get(ctx.config.credentialId);
        // use creds.apiKey
    },
});
```

### Memory

```typescript
// Node-scoped
const value = await ctx.memory.get('key');
await ctx.memory.set('key', value);

// Workflow-scoped (shared between nodes)
await ctx.workflowMemory.set('shared', data);
```

---

## Testing

### Frontend

```bash
pnpm --filter ynode-app test
```

### Manual Testing

1. Run both dev servers
2. Create a workflow with your changes
3. Execute and check logs

### Validate Node Definition

```bash
node packages/ynode-cli/dist/cli.js validate ynode-nodes/my-node/node.ts
```

---

## Submitting a Pull Request

### Before Submitting

1. Test your changes
2. `pnpm format`
3. No console errors
4. Naming conventions:
   - Node types: `kebab-case`
   - Variables: `camelCase`
   - Types: `PascalCase`

### PR Checklist

**For nodes:**
- [ ] Clear `label` and `description`
- [ ] All ports have descriptions
- [ ] Error handling implemented
- [ ] `default` included in output
- [ ] No hardcoded secrets

**For platform:**
- [ ] Tested affected features
- [ ] No regressions
- [ ] Follows existing patterns

### Creating the PR

```bash
git checkout -b feat/my-feature
# make changes
git commit -m "feat: description"
git push origin feat/my-feature
```

Open PR against `main`.

**Commit prefixes:** `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`

---

## Code Style

- TypeScript
- Zod for validation
- Prettier (`pnpm format`)
- async/await
- Descriptive names

---

## Reporting Issues

Include:

1. Steps to reproduce
2. Expected vs actual behavior
3. Screenshots (if UI)
4. Browser/Node version
5. Error messages

---

## Questions?

Open a [GitHub Issue](https://github.com/iamyureka/ynode/issues).

Thanks for contributing — we appreciate it! 🚀
