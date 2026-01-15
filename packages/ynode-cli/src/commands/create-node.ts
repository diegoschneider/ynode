import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  getBasicNodeTemplate,
  getIntegrationNodeTemplate,
} from '../utils/templates.js';

interface CreateNodeOptions {
  category: string;
  credentials: boolean;
}

export async function createNode(
  name: string,
  options: CreateNodeOptions
): Promise<void> {
  const { category, credentials } = options;

  const nodeType = name.replace(/([A-Z])/g, (match, p1, offset) =>
    offset > 0 ? `-${p1.toLowerCase()}` : p1.toLowerCase()
  );

  const className = name.charAt(0).toLowerCase() + name.slice(1);

  // Integration nodes: ynode-nodes/<name>/node.ts
  const ynodeNodesDir = path.resolve(process.cwd(), 'ynode-nodes');
  const outputDir = path.join(ynodeNodesDir, nodeType);
  const filePath = path.join(outputDir, 'node.ts');

  console.log(`Creating node: ${name}`);
  console.log(`  Type: ${nodeType}`);
  console.log(`  Category: ${category}`);
  console.log(`  Output: ${filePath}`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    console.error(`Error: File already exists at ${filePath}`);
    process.exit(1);
  }

  const template = credentials
    ? getIntegrationNodeTemplate(name, className, nodeType, category)
    : getBasicNodeTemplate(name, className, nodeType, category);

  fs.writeFileSync(filePath, template, 'utf-8');

  console.log(`\nNode created successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  1. Edit ${filePath} to implement your node logic`);
  console.log(`  2. Run pnpm --filter @ynode/core build`);
  console.log(`  3. Restart ynode-server to load the new node`);
}
