import { memo } from 'react';
import { BaseEdge, getSmoothStepPath, useReactFlow } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { getTypeColor, isTypeCompatible } from '../../types/nodeTypes';
import { useNodeTypesStore } from '../../store/nodeTypesStore';
import type { PortDataType } from '../../types/nodeTypes';

/**
 * TypedEdge - A custom edge component that colors connections based on the
 * source port's data type.
 *
 * Features:
 * - Type-based coloring (pink for strings, green for numbers, etc.)
 * - Visual feedback for execution state (animated when running)
 * - Compatibility validation highlighting
 */
export const TypedEdge = memo(
    ({
        id,
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        source,
        target,
        sourceHandleId,
        targetHandleId,
        style = {},
        data,
    }: EdgeProps) => {
        const getNodeDefinition = useNodeTypesStore(
            (state) => state.getNodeDefinition
        );
        const { getNode } = useReactFlow();

        // Get source and target nodes
        const sourceNode = getNode(source);
        const targetNode = getNode(target);

        // Get port types from node definitions
        let sourceType: PortDataType = 'any';
        let targetType: PortDataType = 'any';

        if (sourceNode) {
            const sourceDef = getNodeDefinition(sourceNode.type || '');
            if (sourceDef) {
                const outputPort = sourceDef.outputs.find(
                    (o) => o.id === sourceHandleId
                );
                if (outputPort) {
                    sourceType = outputPort.type as PortDataType;
                }
            }
        }

        if (targetNode) {
            const targetDef = getNodeDefinition(targetNode.type || '');
            if (targetDef) {
                const inputPort = targetDef.inputs.find((i) => i.id === targetHandleId);
                if (inputPort) {
                    targetType = inputPort.type as PortDataType;
                }
            }
        }

        // Get the color based on source type
        const typeColor = getTypeColor(sourceType);

        // Check if the connection is compatible
        const isCompatible = isTypeCompatible(sourceType, targetType);

        // Build the edge path
        const [edgePath] = getSmoothStepPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
            borderRadius: 8,
        });

        // Determine edge style based on execution state and compatibility
        interface EdgeData {
            isFlowing?: boolean;
            isCompleted?: boolean;
            isError?: boolean;
            isSkipped?: boolean;
        }
        const edgeData = (data as EdgeData) || {};
        let strokeColor = typeColor;
        let strokeWidth = 2;
        let strokeDasharray = undefined;
        let opacity = 1;

        // Execution state overrides
        if (edgeData.isFlowing) {
            strokeColor = '#facc15'; // Yellow for flowing
            strokeWidth = 3;
        } else if (edgeData.isCompleted) {
            strokeColor = '#4ade80'; // Green for completed
        } else if (edgeData.isError) {
            strokeColor = '#f87171'; // Red for error
        } else if (edgeData.isSkipped) {
            strokeColor = '#6b7280'; // Gray for skipped
            opacity = 0.5;
        }

        // Incompatible connection warning
        if (!isCompatible && !edgeData.isFlowing && !edgeData.isCompleted) {
            strokeDasharray = '5,5';
            opacity = 0.6;
        }

        return (
            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    ...style,
                    stroke: strokeColor,
                    strokeWidth,
                    strokeDasharray,
                    opacity,
                }}
            />
        );
    }
);

TypedEdge.displayName = 'TypedEdge';

export default TypedEdge;
