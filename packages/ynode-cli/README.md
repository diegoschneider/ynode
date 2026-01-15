# @ynode/cli

CLI tools for creating custom ynode nodes.

## Usage

```bash
node packages/ynode-cli/dist/cli.js create-node <name> [options]
```

## Commands

### `create-node <name>`

Create a new node in `ynode-nodes/<name>/node.ts`.

**Options:**

| Option           | Description                | Default   |
| ---------------- | -------------------------- | --------- |
| `-c, --category` | Node category              | `utility` |
| `--credentials`  | Include credential support | `false`   |

**Example:**

```bash
# Basic node
node packages/ynode-cli/dist/cli.js create-node MyNode -c utility

# Node with credential support
node packages/ynode-cli/dist/cli.js create-node Slack -c communication --credentials
```

**Output:**

```
Creating node: MyNode
  Type: my-node
  Category: utility
  Output: ynode-nodes/my-node/node.ts

  Node created successfully!

Next steps:
  1. Edit ynode-nodes/my-node/node.ts to implement your node logic
  2. Run pnpm --filter @ynode/core build
  3. Restart ynode-server to load the new node
```

### `validate <nodePath>`

Validate a node definition file.

```bash
node packages/ynode-cli/dist/cli.js validate ynode-nodes/my-node/node.ts
```

## Node Categories

| Category        | Description                         |
| --------------- | ----------------------------------- |
| `triggers`      | Workflow entry points               |
| `logic`         | Control flow (if/else, switch)      |
| `transform`     | Data transformation                 |
| `integrations`  | HTTP, webhooks, external APIs       |
| `data`          | Variables, memory, storage          |
| `ai`            | LLM integrations (OpenAI, etc.)     |
| `communication` | Messaging (Telegram, Discord, etc.) |
| `utility`       | General utility nodes               |
