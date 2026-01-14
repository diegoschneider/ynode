#!/usr/bin/env node
import { Command } from 'commander';
import { createNode } from './commands/create-node.js';
import { validateNode } from './commands/validate-node.js';

const program = new Command();

program
  .name('ynode')
  .description('CLI tools for ynode community node development')
  .version('0.1.0');

program
  .command('create-node <name>')
  .description('Create a new node from template')
  .option('-c, --category <category>', 'Node category', 'custom')
  .option('-o, --output <directory>', 'Output directory', './src/nodes')
  .option('--credentials', 'Include credential support template', false)
  .option(
    '--internal',
    'Use relative imports (for ynode-core development)',
    false
  )
  .action(createNode);

program
  .command('validate <nodePath>')
  .description('Validate a node definition file')
  .action(validateNode);

program.parse();
