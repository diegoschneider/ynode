# ynode-app

Frontend application for ynode workflow automation platform.

## Tech Stack

- React 19, TypeScript, Vite
- React Flow (node-based editor)
- TailwindCSS, Zustand

## Structure

```
src/
├── api/
│   ├── credentialsApi.ts
│   ├── nodeTypesApi.ts
│   └── workflowApi.ts
├── components/
│   ├── Auth/
│   ├── Canvas/
│   ├── ExecutionPanel/
│   ├── Header/
│   ├── NodeConfig/
│   ├── Sidebar/
│   ├── nodes/
│   │   └── GenericNode.tsx
│   └── ui/
├── hooks/
├── layouts/
├── lib/
├── nodes/
├── pages/
│   ├── Dashboard/
│   ├── Editor/
│   └── Settings/
├── store/
│   ├── authStore.ts
│   ├── nodeTypesStore.ts
│   ├── workflowDataStore.ts
│   └── workflowStore.ts
├── test/
├── types/
│   ├── index.ts
│   ├── nodeTypes.ts
│   └── workflow.ts
├── App.tsx
├── index.css
└── main.tsx
```

## Commands

```bash
pnpm dev        # Development server (localhost:5173)
pnpm build      # Production build
pnpm test       # Run tests
```

## Architecture

Nodes are defined in `@ynode/core`, not here. The frontend fetches definitions from `GET /api/node-types` and renders them using `GenericNode`.
