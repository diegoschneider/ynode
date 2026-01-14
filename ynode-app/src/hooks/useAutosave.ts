import { useEffect, useRef } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { useWorkflowDataStore } from '../store/workflowDataStore';
import { workflowWs } from '../api/workflowApi';

const DEBOUNCE_MS = 2000;

export function useAutosave() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const isDirty = useWorkflowStore((s) => s.isDirty);
  const setSaveStatus = useWorkflowStore((s) => s.setSaveStatus);
  const setWorkflowId = useWorkflowStore((s) => s.setWorkflowId);
  const markClean = useWorkflowStore((s) => s.markClean);
  const updateWorkflowInCache = useWorkflowDataStore(
    (s) => s.updateWorkflowInCache
  );

  const prevRef = useRef({ nodes, edges, workflowName });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!isDirty || isSavingRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const currentState = useWorkflowStore.getState();
      if (!currentState.isDirty) return;

      isSavingRef.current = true;
      setSaveStatus('saving');

      try {
        const {
          nodes: currentNodes,
          edges: currentEdges,
          workflowName: currentName,
          workflowId: currentId,
        } = currentState;

        const savedWorkflow = await workflowWs.saveWorkflow({
          id: currentId,
          name: currentName,
          nodes: currentNodes,
          edges: currentEdges,
        });

        if (!currentId && savedWorkflow.id) {
          setWorkflowId(savedWorkflow.id);
        }

        updateWorkflowInCache(savedWorkflow);

        markClean();
        setSaveStatus('saved');

        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Save failed';
        setSaveStatus('error', message);
      } finally {
        isSavingRef.current = false;
      }
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges, workflowName, isDirty]);

  useEffect(() => {
    prevRef.current = { nodes, edges, workflowName };
  }, [nodes, edges, workflowName]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
}
