
export interface ChildElement {
  id: string;
  uri: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl: string;
  isDragging?: boolean;
  isResizing?: boolean;
  isWarping?: boolean;
  isSelected?: boolean;
  warpPoints?: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
}
export interface CompositeCanvasProps {
  backgroundImage?: string;
  onCanvasChange?: (canvas: HTMLCanvasElement) => void;
}
export interface CompositeCanvasRef {
  addChild: (imageUrl: string, placementUri: string, transforms?: { x?: number; y?: number; scale?: number; rotation?: number; flip?: number }) => void;
  clearAll: () => void;
  captureCanvas: () => Promise<string | null>;
}

export interface CompositeHistoryProps {
  onImageSelected?: (imageUrl: string) => void;
}

export interface CompositeImages {
  front?: string;
  back?: string;
}
export interface ChildCanvasData {
  uri: string;
  canvasData?: string;
  originalUri?: string;
  child?: any;
}
