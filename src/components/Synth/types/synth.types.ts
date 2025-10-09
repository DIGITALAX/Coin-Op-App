import {
  Dispatch,
  MutableRefObject,
  ReactElement,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";
import { Template } from "../../Format/types/format.types";
export interface PatternElement {
  type: string;
  attributes: Record<string, any>;
}
export interface SVGContentData {
  content: string | null;
  isLoading: boolean;
}
export interface SvgPatternType {
  id: number;
  type: "circle" | "pattern" | "image";
  points?: { x: number; y: number }[][];
  posX?: number;
  posY?: number;
  stroke?: string;
  scaleFactorX?: number;
  scaleFactorY?: number;
  bounds?: {
    left: number;
    top: number;
  };
  image?: HTMLImageElement;
  x1?: number;
  y1?: number;
  width?: number;
  height?: number;
  originalWidth?: number;
  originalHeight?: number;
}

export interface CanvasHistory {
  id: string;
  childUri: string;
  child?: any;
  layerTemplateId: string;
  templateName: string;
  elements: any[];
  thumbnailPath: string;
  timestamp: number;
  originalCanvasWidth: number;
  originalCanvasHeight: number;
}
export interface ElementInterface {
  id: number;
  type: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  points?: {
    x: number;
    y: number;
    pressure?: number;
  }[];
  fill?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  rotation?: number;
  image?: HTMLImageElement;
  imageSrc?: string;
  imageWidth?: number;
  imageHeight?: number;
}
export type CanvasHistoryProps = {
  onHistoryLoad: (historyItem: CanvasHistory) => void;
};
export interface HoldButtonProps {
  onAction: () => void;
  className: string;
  children: ReactNode;
}
export interface InteractiveCanvasProps {
  templateChild: Template | null;
  size?: "small" | "large";
  onChildClick?: (childUri: string) => void;
}
export interface UseInteractiveCanvasReturn {
  updateChildCanvas: (childIndex: number, newUri: string) => void;
  templateChild: Template | null;
}

export interface UseGeneratorProps {
  mode?: "synth" | "composite";
  onImageGenerated?: (imageUrl: string) => void;
  getCanvasImage?: () => string | null;
}

export interface UseSynthCanvasProps {
  onCanvasSave?: (childIndex: number, newUri: string) => void;
}

export interface GeneratorProps {
  showNodeEditor?: boolean;
  setShowNodeEditor?: (show: boolean) => void;
  onStateChange?: (state: { aiProvider: string; comfySettings: any }) => void;
  onComfySettingsUpdate?: (updateFn: (prev: any) => any) => void;
  mode?: "synth" | "composite";
  onImageGenerated?: (imageUrl: string) => void;
  getCanvasImage?: () => string | null | Promise<string | null>;
}

export interface LibrarySelectorProps {
  type: "workflow" | "prompt";
  mode?: "synth" | "composite";
  onSelect: (item: any) => void;
  onSave: (name: string, description?: string) => void;
  className?: string;
}

export interface SynthCanvasProps {
  onCanvasSave?: (childIndex: number, newUri: string) => void;
}

export interface ShowCanvasProps {
  convertCoordinatesToPixels: (
    x: number,
    y: number,
    scale?: number,
    flip?: number,
    rotation?: number
  ) => any;
  baseTemplateChild: any;
  imageRef: MutableRefObject<HTMLImageElement | null>;
  setCanvasWidth: (width: number) => void;
  imageDimensions: Record<string, { width: number; height: number }>;
  setImageDimensions: Dispatch<
    SetStateAction<Record<string, { width: number; height: number }>>
  >;
  canvasContainerRef: RefObject<HTMLDivElement | null>;
  parsedSvgCache: Record<string, any>;
  createReactElement: (
    childEl: any,
    key: string,
    onChildClick?: (uri: string) => void,
    uri?: string
  ) => ReactElement;
  getImageSrc: (src: string) => string;
  currentTemplate: Template | null;
  canvasWidth: number | undefined;
  imageUrls: Record<string, string>;
  templateChild: Template | null;
  onChildClick?: (childUri: string) => void;
}
