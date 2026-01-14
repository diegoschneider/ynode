import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  getBasicNodeTemplate,
  getIntegrationNodeTemplate,
  getInternalNodeTemplate,
} from '../utils/templates.js';

interface CreateNodeOptions {
  category: string;
  output: string;
  credentials: boolean;
  internal?: boolean;
}

export async function createNode(
  name: string,
  options: CreateNodeOptions
): Promise<void> {
  const { category, output, credentials } = options;

  const nodeType = name.replace(/([A-Z])/g, (match, p1, offset) =>
    offset > 0 ? `-${p1.toLowerCase()}` : p1.toLowerCase()
  );

  const className = name.charAt(0).toLowerCase() + name.slice(1);
  const fileName = `${nodeType}.ts`;
  const filePath = path.join(output, fileName);

  const isInternal = options.internal || output.includes('ynode-core');

  console.log(`Creating node: ${name}`);
  console.log(`  Type: ${nodeType}`);
  console.log(`  Category: ${category}`);
  console.log(`  Output: ${filePath}`);
  console.log(
    `  Mode: ${isInternal ? 'internal (ynode-core)' : 'external (plugin)'}`
  );

  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    console.error(`Error: File already exists at ${filePath}`);
    process.exit(1);
  }

  let template: string;
  if (isInternal) {
    template = getInternalNodeTemplate(name, className, nodeType, category);
  } else if (credentials) {
    template = getIntegrationNodeTemplate(name, className, nodeType, category);
  } else {
    template = getBasicNodeTemplate(name, className, nodeType, category);
  }

  fs.writeFileSync(filePath, template, 'utf-8');

  console.log(`\n✓ Node created successfully!`);
  console.log(`\nNext steps:`);
  if (isInternal) {
    console.log(`  1. Edit ${filePath}`);
    console.log(`  2. Add import to packages/ynode-core/src/nodes/index.ts`);
    console.log(`  3. Add export and register in registerBuiltinNodes()`);
    console.log(`  4. Run 'pnpm --filter @ynode/core build'`);
  } else {
    console.log(`  1. Edit ${filePath} to customize your node`);
    console.log(`  2. Export the node from your plugin's index.ts`);
    console.log(`  3. Run 'pnpm build' to compile`);
  }
}
