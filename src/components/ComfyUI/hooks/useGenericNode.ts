import { RenderNode } from "../types/comfyui.types";

export const useGenericNode = (node: RenderNode) => {
  const width = node.size.width;
  const height = Math.max(node.size.height, 120);
  const inputEntries = Object.entries(node.inputs);
  const nonConnectedInputs = inputEntries.filter(([_, value]) => !Array.isArray(value));
  const connectedInputs = inputEntries.filter(([_, value]) => Array.isArray(value));
  return {
    width,
    height,
    inputEntries,
    nonConnectedInputs,
    connectedInputs
  };
};