import { nodeRegistry } from '../registry';
import { triggerNode } from './trigger';
import { httpRequestNode } from './httpRequest';
import { ifElseNode } from './ifElse';
import { webhookNode } from './webhook';
import { scheduleNode } from './schedule';
import { switchNode } from './switch';
import { mergeNode } from './merge';
import { delayNode } from './delay';
import { jsonTransformNode } from './jsonTransform';
import { templateNode } from './template';
import { splitNode } from './split';

export { triggerNode } from './trigger';
export { httpRequestNode } from './httpRequest';
export { ifElseNode } from './ifElse';
export { webhookNode } from './webhook';
export { scheduleNode } from './schedule';
export { switchNode } from './switch';
export { mergeNode } from './merge';
export { delayNode } from './delay';
export { jsonTransformNode } from './jsonTransform';
export { templateNode } from './template';
export { splitNode } from './split';

export function registerBuiltinNodes(): void {
  if (nodeRegistry.has('trigger')) {
    return;
  }

  nodeRegistry.register(triggerNode);
  nodeRegistry.register(httpRequestNode);
  nodeRegistry.register(ifElseNode);
  nodeRegistry.register(webhookNode);
  nodeRegistry.register(scheduleNode);
  nodeRegistry.register(switchNode);
  nodeRegistry.register(mergeNode);
  nodeRegistry.register(delayNode);
  nodeRegistry.register(jsonTransformNode);
  nodeRegistry.register(templateNode);
  nodeRegistry.register(splitNode);
}

export function getBuiltinNodes() {
  return [
    triggerNode,
    httpRequestNode,
    ifElseNode,
    webhookNode,
    scheduleNode,
    switchNode,
    mergeNode,
    delayNode,
    jsonTransformNode,
    templateNode,
    splitNode,
  ];
}
