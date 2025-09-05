import { invoke } from "@tauri-apps/api/core";
import { ComfyUIWorkflow, NodeInfo } from "../types/comfyui.types";
export const useComfyUI = () => {
  const parseWorkflow = async (
    workflowJson: string
  ): Promise<ComfyUIWorkflow> => {
    try {
      const result = await invoke<ComfyUIWorkflow>("parse_comfyui_workflow", {
        workflowJson,
      });
      return result;
    } catch (error) {
      throw error;
    }
  };
  const getNodeInfo = async (classType: string): Promise<NodeInfo> => {
    try {
      const result = await invoke<NodeInfo>("get_node_info", {
        classType,
      });
      return result;
    } catch (error) {
      throw error;
    }
  };
  return {
    parseWorkflow,
    getNodeInfo,
  };
};
