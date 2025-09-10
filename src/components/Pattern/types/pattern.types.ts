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

export const HOODIE_FRONT_PANEL_DIMENSIONS: Record<
  GarmentSize,
  { widthCm: number; heightCm: number }
> = {
  XXS: { widthCm: 31.2, heightCm: 61.0 },
  XS: { widthCm: 32.4, heightCm: 62.6 },
  S: { widthCm: 33.6, heightCm: 64.2 },
  M: { widthCm: 34.8, heightCm: 65.8 },
  L: { widthCm: 36.0, heightCm: 67.4 },
  XL: { widthCm: 37.2, heightCm: 69.0 },
  XXL: { widthCm: 38.4, heightCm: 70.6 },
  "3XL": { widthCm: 39.6, heightCm: 72.2 },
  "4XL": { widthCm: 40.8, heightCm: 73.8 },
  "5XL": { widthCm: 42.0, heightCm: 75.4 },
  CUSTOM: { widthCm: 0, heightCm: 0 },
};

export const SHIRT_FRONT_PANEL_DIMENSIONS: Record<
  GarmentSize,
  { widthCm: number; heightCm: number }
> = {
  XXS: { widthCm: 29.5, heightCm: 55.0 },
  XS: { widthCm: 30.7, heightCm: 56.5 },
  S: { widthCm: 31.9, heightCm: 58.0 },
  M: { widthCm: 33.1, heightCm: 59.5 },
  L: { widthCm: 34.3, heightCm: 61.0 },
  XL: { widthCm: 35.5, heightCm: 62.5 },
  XXL: { widthCm: 36.7, heightCm: 64.0 },
  "3XL": { widthCm: 37.9, heightCm: 65.5 },
  "4XL": { widthCm: 39.1, heightCm: 67.0 },
  "5XL": { widthCm: 40.3, heightCm: 69.0 },
  CUSTOM: { widthCm: 0, heightCm: 0 },
};

export const PATTERN_COLORS: string[] = [
  "#4ECDC4",
  "#45B7AF",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#FFB6C1",
  "#87CEEB",
  "#98FB98",
];
