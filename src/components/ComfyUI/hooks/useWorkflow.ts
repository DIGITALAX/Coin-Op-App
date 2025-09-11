import { useEffect, useState } from "react";
import { ComfyUIWorkflow } from "../types/comfyui.types";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
const useWorkflow = (
  loadWorkflow: (workflowData: ComfyUIWorkflow) => Promise<void>,
  workflowJson: string | undefined,
  onWorkflowChange:
    | ((workflow: ComfyUIWorkflow | undefined) => void)
    | undefined,
  resetView: () => void,
  workflow: ComfyUIWorkflow | null,
  parseWorkflow: (workflowJson: string) => Promise<ComfyUIWorkflow>
) => {
  const { setItem } = useDesignStorage();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const loadWorkflowFromJson = async (jsonString: string) => {
    setLoading(true);
    setError(null);
    try {
      let workflowData;
      try {
        workflowData =
          typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      } catch (parseErr) {
        throw new Error("Invalid JSON format");
      }
      const hasNodesArray = Array.isArray(workflowData.nodes);
      const hasConnectionsArray = Array.isArray(workflowData.connections);
      if (hasNodesArray && hasConnectionsArray) {
        await loadWorkflow(workflowData);
        onWorkflowChange?.(workflowData);
      } else {
        const workflowJsonString = JSON.stringify(workflowData);
        const parsedWorkflow = await parseWorkflow(workflowJsonString);
        await loadWorkflow(parsedWorkflow);
        onWorkflowChange?.(parsedWorkflow);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse workflow");
    } finally {
      setLoading(false);
    }
  };
  const deleteWorkflow = async () => {
    if (
      confirm(
        "Are you sure you want to delete this workflow? This will clear it from cache and you will need to upload it again."
      )
    ) {
      await setItem("comfyuiSettings", {});
      onWorkflowChange?.(undefined);
      resetView();
    }
  };
  useEffect(() => {
    if (workflowJson && !workflow) {
      loadWorkflowFromJson(workflowJson);
    }
  }, [workflowJson]);
  return {
    deleteWorkflow,
    setError,
    error,
    loading,
  };
};
export default useWorkflow;
