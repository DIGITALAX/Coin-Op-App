export interface SparrowStats {
  iteration: string;
  strip_width: string;
  phase: string;
  utilization: number;
  height: string;
  width: string;
  density: string;
  full_stats: string;
}

export interface PatternPiece {
  id: string;
  name: string;
  garmentType: "tshirt" | "hoodie";
  svgPath: string;
  widthMM: number;
  heightMM: number;
  seamAllowanceMM: string;
  instructions?: string;
  quantity: number;
}

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  svgElement: SVGSVGElement | null;
  viewportPx: ViewportPx;
  patternPieces: PatternPiece[];
  liveSvgContent?: string;
  isManualMode?: boolean;
  manualPieces?: CanvasPanel[];
}

export interface NestingSettingsProps {
  settings: NestingSettings;
  onSettingsChange: (settings: NestingSettings) => void;
  disabled: boolean;
}

export interface PackingCanvasProps {
  selectedPieces: PatternPiece[];
}

export interface CanvasPanel {
  id: string;
  name: string;
  pathData: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  pathBounds: DOMRect | null;
  scaleFactor?: number;
}

export interface PatternState {
  autoResult: NestingResult | null;
  manualPieces: CanvasPanel[] | null;
  currentMode: "auto" | "manual";
  settings: NestingSettings;
  liveSvgContent: string | null;
  selectedPieces: PatternPiece[];
  selectedSize: GarmentSize;
}

export interface NestingSettings {
  minItemSeparation: number;
  allowedRotations: number[];
  stripWidthMultiplier: number;
  iterationLimit: number;
  strikeLimit: number;
}
export type RotationPreset = {
  name: string;
  angles: number[];
};

export const ROTATION_PRESETS: RotationPreset[] = [
  { name: "no_rotation", angles: [0] },
  { name: "180_only", angles: [0, 180] },
  { name: "90_steps", angles: [0, 90, 180, 270] },
  { name: "45_steps", angles: [0, 45, 90, 135, 180, 225, 270, 315] },
  {
    name: "30_steps",
    angles: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
  },
  { name: "15_steps", angles: Array.from({ length: 24 }, (_, i) => i * 15) },
  { name: "10_steps", angles: Array.from({ length: 36 }, (_, i) => i * 10) },
  { name: "5_steps", angles: Array.from({ length: 72 }, (_, i) => i * 5) },
  { name: "1_steps", angles: Array.from({ length: 360 }, (_, i) => i * 1) },
  {
    name: "05_steps",
    angles: Array.from({ length: 720 }, (_, i) => i * 0.5),
  },
  {
    name: "01_steps",
    angles: Array.from({ length: 3600 }, (_, i) => i * 0.1),
  },
];
export const DEFAULT_NESTING_SETTINGS: NestingSettings = {
  minItemSeparation: 0.0,
  allowedRotations: [0, 1],
  stripWidthMultiplier: 5.0,
  iterationLimit: 200,
  strikeLimit: 3,
};

export type GarmentSize =
  | "XXS"
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL"
  | "3XL"
  | "4XL"
  | "5XL"
  | "CUSTOM";

export interface NestingRequest {
  pattern_pieces: {
    id: string;
    name: string;
    svg_path: string;
    demand: number;
  }[];
  strip_width: number;
  settings: NestingSettings;
}
export interface PlacedItem {
  id: string;
  x: number;
  y: number;
  rotation: number;
}
export interface NestingResult {
  placed_items: PlacedItem[];
  strip_height: number;
  utilization: number;
}

export interface PrintExportOptions {
  selectedSize: GarmentSize;
  garmentType: "tshirt" | "hoodie";
  isManualMode: boolean;
  manualPieces: CanvasPanel[];
  autoBasePieces: CanvasPanel[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface LayoutBounds {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
  width: number;
  height: number;
}

export interface PrintTile {
  row: number;
  col: number;
  page_x: number;
  page_y: number;
  grid_ref: string;
  pieces_on_page: CanvasPanel[];
}

export interface ViewportPx {
  width: number;
  height: number;
}

export interface CustomDimensions {
  widthCm: number;
  heightCm: number;
}