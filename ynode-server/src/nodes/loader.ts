import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { nodeRegistry } from '@ynode/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const YNODE_NODES_DIR = join(__dirname, '../../../ynode-nodes');

export async function loadIntegrationNodes(): Promise<void> {
    if (!existsSync(YNODE_NODES_DIR)) {
        console.log('ynode-nodes folder not found, skipping integration nodes');
        return;
    }

    const folders = readdirSync(YNODE_NODES_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name !== 'node_modules')
        .map(d => d.name);

    console.log(`Loading ${folders.length} integration nodes from ynode-nodes/`);

    for (const folder of folders) {
        try {
            const nodePath = join(YNODE_NODES_DIR, folder, 'node.ts');
            if (!existsSync(nodePath)) {
                console.warn(`  Skip ${folder}: no node.ts found`);
                continue;
            }

            const { default: node } = await import(
                `file://${join(YNODE_NODES_DIR, folder, 'node.ts')}`
            );

            if (node && typeof node === 'object' && 'type' in node) {
                nodeRegistry.register(node);
                console.log(`  ✓ Loaded ${node.type}`);
            } else {
                console.warn(`  Skip ${folder}: invalid export`);
            }
        } catch (err) {
            console.error(`  ✗ Failed to load ${folder}:`, err);
        }
    }
}
