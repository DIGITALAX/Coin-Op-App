import { useRef, useEffect, useState, useCallback, MouseEvent } from "react";
import {
  ComfyUIWorkflow,
  ComfyUINode,
  RenderNode,
  CanvasState,
  ComfyUISettings,
} from "../../../components/ComfyUI/types/comfyui.types";
import { useComfyUI } from "./useComfyUI";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
const DEFAULT_CONFIG = {
  nodeWidth: 200,
  nodeHeight: 120,
};
export const useNodeCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { getNodeInfo } = useComfyUI();
  const { getItem, setItem } = useDesignStorage();
  const [workflow, setWorkflow] = useState<ComfyUIWorkflow | null>(null);
  const [renderNodes, setRenderNodes] = useState<RenderNode[]>([]);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    selectedNodes: [],
    selectedConnections: [],
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastMouse, setLastMouse] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [draggingNode, setDraggingNode] = useState<{
    id: string;
    offset: { x: number; y: number };
  } | null>(null);
  const [hasInitializedView, setHasInitializedView] = useState<boolean>(false);
  const calculateNodeLayout = useCallback(
    async (nodes: ComfyUINode[]): Promise<RenderNode[]> => {
      const renderNodes: RenderNode[] = [];
      const nodesPerRow = Math.ceil(Math.sqrt(nodes.length));
      const nodeSpacingX = 250;
      const nodeSpacingY = 200;
      const numberOfRows = Math.ceil(nodes.length / nodesPerRow);
      const gridWidth =
        (nodesPerRow - 1) * nodeSpacingX + DEFAULT_CONFIG.nodeWidth;
      const gridHeight =
        (numberOfRows - 1) * nodeSpacingY + DEFAULT_CONFIG.nodeHeight;
      const startX = 2000 - gridWidth / 2;
      const startY = 2000 - gridHeight / 2;
      const getUsedOutputs = (nodeId: string): number[] => {
        const usedOutputs: number[] = [];
        nodes.forEach((otherNode) => {
          Object.values(otherNode.inputs).forEach((input) => {
            if (Array.isArray(input) && input[0] === nodeId) {
              const outputIndex = input[1] as number;
              if (!usedOutputs.includes(outputIndex)) {
                usedOutputs.push(outputIndex);
              }
            }
          });
        });
        return usedOutputs.sort((a, b) => a - b);
      };
      const savedData = (await getItem<ComfyUISettings>("comfyuiSettings")) || {};
      const savedPositions = savedData.nodePositions || {};
      const savedInputs = savedData.nodeInputs || {};
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const row = Math.floor(i / nodesPerRow);
        const col = i % nodesPerRow;
        try {
          const nodeInfo = await getNodeInfo(node.class_type);
          const getActualNodeDimensions = (classType: string) => {
            switch (classType) {
              case "VAELoader":
              case "UnetLoaderGGUF":
              case "CLIPLoaderGGUF":
                return { width: 250, height: 120 };
              case "LoraLoader":
                return { width: 280, height: 200 };
              case "KSampler":
                return { width: 400, height: 400 };
              case "LoadImage":
                return { width: 380, height: 250 };
              case "CLIPTextEncode":
                return { width: 600, height: 400 };
              default:
                return {
                  width: DEFAULT_CONFIG.nodeWidth,
                  height: DEFAULT_CONFIG.nodeHeight,
                };
            }
          };
          const baseDimensions = getActualNodeDimensions(node.class_type);
          const actualDimensions = {
            width:
              node.class_type === "CLIPTextEncode"
                ? Math.max(baseDimensions.width, 600)
                : node.class_type === "KSampler"
                ? Math.max(baseDimensions.width, 400)
                : baseDimensions.width,
            height:
              node.class_type === "CLIPTextEncode"
                ? Math.max(baseDimensions.height, 400)
                : node.class_type === "KSampler"
                ? Math.max(baseDimensions.height, 400)
                : baseDimensions.height,
          };
          const renderNode: RenderNode = {
            ...node,
            position: (savedPositions[node.id] || [
              startX + col * nodeSpacingX,
              startY + row * nodeSpacingY,
            ]) as [number, number],
            inputs: savedInputs[node.id] || node.inputs,
            size: actualDimensions,
            inputPorts: Object.keys(node.inputs)
              .filter((inputName) => Array.isArray(node.inputs[inputName]))
              .map((inputName, index) => ({
                id: `${node.id}_in_${inputName}`,
                name: inputName,
                type: nodeInfo.input_types[inputName] || "UNKNOWN",
                position: { x: 6, y: 60 + index * 30 },
                connected: true,
              })),
            outputPorts: getUsedOutputs(node.id).map(
              (outputIndex, portIndex) => ({
                id: `${node.id}_out_${outputIndex}`,
                name: node.outputs[outputIndex] || "UNKNOWN",
                type: node.outputs[outputIndex] || "UNKNOWN",
                position: {
                  x: actualDimensions.width - 3.5,
                  y: 60 + portIndex * 30,
                },
                connected: false,
              })
            ),
            nodeInfo,
          };
          renderNodes.push(renderNode);
        } catch (error) {
          const disabledNodeDimensions = {
            width: DEFAULT_CONFIG.nodeWidth,
            height: DEFAULT_CONFIG.nodeHeight,
          };
          const renderNode: RenderNode = {
            ...node,
            position: (savedPositions[node.id] || [
              startX + col * nodeSpacingX,
              startY + row * nodeSpacingY,
            ]) as [number, number],
            inputs: savedInputs[node.id] || node.inputs,
            size: disabledNodeDimensions,
            inputPorts: Object.keys(node.inputs)
              .filter((inputName) => Array.isArray(node.inputs[inputName]))
              .map((inputName, index) => ({
                id: `${node.id}_in_${inputName}`,
                name: inputName,
                type: "UNKNOWN",
                position: { x: 6, y: 60 + index * 30 },
                connected: true,
              })),
            outputPorts: getUsedOutputs(node.id).map(
              (outputIndex, portIndex) => ({
                id: `${node.id}_out_${outputIndex}`,
                name: node.outputs[outputIndex] || "UNKNOWN",
                type: node.outputs[outputIndex] || "UNKNOWN",
                position: {
                  x: disabledNodeDimensions.width - 3.5,
                  y: 60 + portIndex * 30,
                },
                connected: false,
              })
            ),
            nodeInfo: {
              category: "unknown",
              description: "Unknown node type",
              input_types: {},
              output_types: ["UNKNOWN"],
              color: "#95A5A6",
            },
          };
          renderNodes.push(renderNode);
        }
      }
      return renderNodes;
    },
    [getNodeInfo]
  );
  const handleNodeInputChange = useCallback(
    (nodeId: string, inputName: string, value: any) => {
      setRenderNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((node) =>
          node.id === nodeId
            ? { ...node, inputs: { ...node.inputs, [inputName]: value } }
            : node
        );
        (async () => {
          const currentSettings = (await getItem("comfyuiSettings")) || {};
          if (typeof currentSettings !== 'object') {
            return;
          }
          const updatedSettings = {
            ...currentSettings,
            nodePositions: updatedNodes.reduce((acc, node) => {
              acc[node.id] = node.position;
              return acc;
            }, {} as Record<string, [number, number]>),
            nodeInputs: updatedNodes.reduce((acc, node) => {
              acc[node.id] = node.inputs;
              return acc;
            }, {} as Record<string, any>),
          };
          await setItem("comfyuiSettings", updatedSettings);
        })();
        return updatedNodes;
      });
    },
    [getItem, setItem]
  );
  const handleNodeMouseDown = useCallback(
    (e: MouseEvent, nodeId: string) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      const node = renderNodes.find((n) => n.id === nodeId);
      if (!node || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const worldX =
        (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom;
      const worldY =
        (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom;
      const offset = {
        x: worldX - node.position[0],
        y: worldY - node.position[1],
      };
      setDraggingNode({ id: nodeId, offset });
    },
    [renderNodes, canvasState]
  );
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!draggingNode) {
        setIsDragging(true);
        setLastMouse({ x: e.clientX, y: e.clientY });
      }
    },
    [draggingNode]
  );
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (draggingNode && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const worldX =
          (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom;
        const worldY =
          (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom;
        const newX = worldX - draggingNode.offset.x;
        const newY = worldY - draggingNode.offset.y;
        setRenderNodes((prev) => {
          const updatedNodes = prev.map((node) =>
            node.id === draggingNode.id
              ? { ...node, position: [newX, newY] as [number, number] }
              : node
          );
          (async () => {
            const currentSettings = (await getItem("comfyuiSettings")) || {};
            if (typeof currentSettings !== 'object') {
              return;
            }
            const updatedSettings = {
              ...currentSettings,
              nodePositions: updatedNodes.reduce((acc, node) => {
                acc[node.id] = node.position;
                return acc;
              }, {} as Record<string, [number, number]>),
              nodeInputs: updatedNodes.reduce((acc, node) => {
                acc[node.id] = node.inputs;
                return acc;
              }, {} as Record<string, any>),
            };
            await setItem("comfyuiSettings", updatedSettings);
          })();
          return updatedNodes;
        });
      } else if (isDragging) {
        const deltaX = e.clientX - lastMouse.x;
        const deltaY = e.clientY - lastMouse.y;
        setCanvasState((prev) => ({
          ...prev,
          pan: {
            x: prev.pan.x + deltaX,
            y: prev.pan.y + deltaY,
          },
        }));
        setLastMouse({ x: e.clientX, y: e.clientY });
      }
    },
    [isDragging, draggingNode, lastMouse, canvasState, getItem, setItem]
  );
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggingNode(null);
  }, []);
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setCanvasState((prev) => {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3.0, prev.zoom * zoomFactor));
      const worldX = (mouseX - prev.pan.x) / prev.zoom;
      const worldY = (mouseY - prev.pan.y) / prev.zoom;
      const newPanX = mouseX - worldX * newZoom;
      const newPanY = mouseY - worldY * newZoom;
      return {
        ...prev,
        zoom: newZoom,
        pan: { x: newPanX, y: newPanY },
      };
    });
  }, []);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);
  useEffect(() => {
    if (workflow) {
      calculateNodeLayout(workflow.nodes).then((nodes) => {
        setRenderNodes(nodes);
        setHasInitializedView(false);
      });
    }
  }, [workflow]);
  useEffect(() => {
    if (renderNodes.length > 0 && containerRef.current && !hasInitializedView) {
      setTimeout(() => {
        resetView();
        setHasInitializedView(true);
      }, 50);
    }
  }, [renderNodes.length, hasInitializedView]);
  const loadWorkflow = async (workflowData: ComfyUIWorkflow) => {
    setWorkflow(workflowData);
  };
  const resetView = () => {
    if (!renderNodes.length || !containerRef.current) {
      setCanvasState({
        zoom: 1.0,
        pan: { x: 0, y: 0 },
        selectedNodes: [],
        selectedConnections: [],
      });
      return;
    }
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;
    const nodesPerRow = Math.ceil(Math.sqrt(renderNodes.length));
    const numberOfRows = Math.ceil(renderNodes.length / nodesPerRow);
    const nodeSpacingX = 250;
    const nodeSpacingY = 200;
    const gridWidth =
      (nodesPerRow - 1) * nodeSpacingX + DEFAULT_CONFIG.nodeWidth;
    const gridHeight =
      (numberOfRows - 1) * nodeSpacingY + DEFAULT_CONFIG.nodeHeight;
    const gridCenterX = 2000;
    const gridCenterY = 2000;
    const zoomToFitX = (containerRect.width * 0.8) / gridWidth;
    const zoomToFitY = (containerRect.height * 0.8) / gridHeight;
    const zoomToFit = Math.min(zoomToFitX, zoomToFitY, 1.0);
    const panX = containerCenterX - gridCenterX * zoomToFit;
    const panY = containerCenterY - gridCenterY * zoomToFit;
    setCanvasState({
      zoom: zoomToFit,
      pan: { x: panX, y: panY },
      selectedNodes: [],
      selectedConnections: [],
    });
  };
  return {
    containerRef,
    workflow,
    renderNodes,
    canvasState,
    loadWorkflow,
    resetView,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleNodeInputChange,
    handleNodeMouseDown,
    draggingNode,
  };
};
