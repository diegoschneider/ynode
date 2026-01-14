import * as path from 'node:path';

export async function validateNode(nodePath: string): Promise<void> {
  console.log(`Validating node: ${nodePath}`);

  const absolutePath = path.resolve(nodePath);

  try {
    const module = await import(absolutePath);

    const exportedKeys = Object.keys(module);
    console.log(`  Exports found: ${exportedKeys.join(', ')}`);

    let nodeDefinition = null;
    for (const key of exportedKeys) {
      const exported = module[key];
      if (
        exported &&
        typeof exported === 'object' &&
        'type' in exported &&
        'execute' in exported
      ) {
        nodeDefinition = exported;
        break;
      }
    }

    if (!nodeDefinition) {
      console.error(`\n✗ No valid NodeDefinition found in ${nodePath}`);
      console.log(
        `  A NodeDefinition must have 'type' and 'execute' properties`
      );
      process.exit(1);
    }

    console.log(`\n✓ Valid NodeDefinition found:`);
    console.log(`  Type: ${nodeDefinition.type}`);
    console.log(`  Label: ${nodeDefinition.label}`);
    console.log(`  Category: ${nodeDefinition.category}`);
    console.log(`  Inputs: ${nodeDefinition.inputs?.length || 0}`);
    console.log(`  Outputs: ${nodeDefinition.outputs?.length || 0}`);

    const issues: string[] = [];

    if (!nodeDefinition.type || typeof nodeDefinition.type !== 'string') {
      issues.push('Missing or invalid "type" property');
    }
    if (!nodeDefinition.label || typeof nodeDefinition.label !== 'string') {
      issues.push('Missing or invalid "label" property');
    }
    if (
      !nodeDefinition.category ||
      typeof nodeDefinition.category !== 'string'
    ) {
      issues.push('Missing or invalid "category" property');
    }
    if (!nodeDefinition.icon || typeof nodeDefinition.icon !== 'string') {
      issues.push('Missing or invalid "icon" property');
    }
    if (!Array.isArray(nodeDefinition.inputs)) {
      issues.push('Missing or invalid "inputs" array');
    }
    if (!Array.isArray(nodeDefinition.outputs)) {
      issues.push('Missing or invalid "outputs" array');
    }
    if (typeof nodeDefinition.execute !== 'function') {
      issues.push('Missing or invalid "execute" function');
    }

    if (issues.length > 0) {
      console.log(`\n⚠ Validation warnings:`);
      issues.forEach((issue) => console.log(`  - ${issue}`));
    } else {
      console.log(`\n✓ All validations passed!`);
    }
  } catch (error) {
    console.error(
      `\n✗ Failed to load node:`,
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}
