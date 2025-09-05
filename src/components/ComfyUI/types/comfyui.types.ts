export interface NodeFactoryProps {
  node: RenderNode;
  onInputChange: (nodeId: string, inputName: string, value: any) => void;
  comfyUrl?: string;
}
export interface ComfyUINode {
  id: string;
  class_type: string;
  title: string;
  inputs: Record<string, ComfyUIValue>;
  outputs: string[];
  position?: [number, number];
}
export type ComfyUIValue =
  | { type: "text"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "connection"; value: [string, number] }
  | { type: "null" };
export interface ComfyUIWorkflow {
  nodes: ComfyUINode[];
  connections: ComfyUIConnection[];
}
export interface ComfyUIConnection {
  from_node: string;
  from_output: number;
  to_node: string;
  to_input: string;
}
export interface NodeInfo {
  category: string;
  description: string;
  input_types: Record<string, string>;
  output_types: string[];
  color: string;
}
export interface NodeSize {
  width: number;
  height: number;
}
export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  selectedNodes: string[];
  selectedConnections: string[];
}
export interface NodePort {
  id: string;
  name?: string;
  type: string;
  position: { x: number; y: number };
  connected: boolean;
}
export interface RenderNode extends ComfyUINode {
  position: [number, number];
  size: NodeSize;
  inputPorts: NodePort[];
  outputPorts: NodePort[];
  nodeInfo: NodeInfo;
}
export interface GenericNodeProps {
  node: RenderNode;
  onInputChange: (inputName: string, value: any) => void;
}
export interface NodeInputProps {
  name: string;
  type: string;
  value: any;
  connected: boolean;
  onChange: (value: any) => void;
  comfyUrl?: string;
}
export interface ComfyUINodeEditorProps {
  workflowJson?: string;
  onWorkflowChange?: (workflow: ComfyUIWorkflow | undefined) => void;
  comfyUrl?: string;
}
export interface LoadImageNodeProps {
  node: RenderNode;
  onInputChange: (inputName: string, value: any) => void;
}
export interface KSamplerNodeProps {
  node: RenderNode;
  onInputChange: (inputName: string, value: any) => void;
}
export interface CLIPTextEncodeNodeProps {
  node: RenderNode;
  onInputChange: (inputName: string, value: any) => void;
}
export interface VAELoaderNodeProps {
  node: RenderNode;
  onInputChange: (inputName: string, value: any) => void;
  comfyUrl?: string;
}
export interface NodeCanvasConfig {
  nodeWidth: number;
  nodeHeight: number;
  portSize: number;
  connectionStroke: number;
  gridSize: number;
}

export interface ComfyUISettings {
  nodePositions?: Record<string, [number, number]>;
  nodeInputs?: Record<string, Record<string, any>>;
  workflowJson?: any;
  [key: string]: any;
}
export interface UnetLoaderGGUFNodeProps {
  node: RenderNode;
  onInputChange: (inputName: string, value: any) => void;
  comfyUrl?: string;
}
export interface CLIPLoaderGGUFNodeProps {
  node: RenderNode;
  onInputChange: (inputName: string, value: any) => void;
  comfyUrl?: string;
}
export interface DisabledNodeProps {
  node: RenderNode;
}
export interface LoraLoaderNodeProps {
  node: RenderNode;
  onInputChange: (inputName: string, value: any) => void;
  comfyUrl?: string;
}

export interface NodePortsProps {
  node: RenderNode;
}

export interface ConnectionPoint {
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  from: ConnectionPoint;
  to: ConnectionPoint;
  path: string;
}