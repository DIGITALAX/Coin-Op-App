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
export interface FabricDimensions {
  widthMM: number;
  heightMM: number;
  fabricType: "knit" | "woven";
}
export interface PatternLayout {
  pieces: PlacedPatternPiece[];
  fabricDimensions: FabricDimensions;
  wastePercentage: number;
  wasteAreas: WasteArea[];
  algorithmUsed?: string;
  efficiency?: number;
  sharedCutLength?: number;
}
export interface PlacedPatternPiece extends PatternPiece {
  x: number;
  y: number;
  rotation: number;
  mirrored: boolean;
}
export interface WasteArea {
  id: string;
  x: number;
  y: number;
  widthMM: number;
  heightMM: number;
  areaMM2: number;
  suggestions: string[];
}
export interface GarmentSet {
  id: string;
  name: string;
  type: "tshirt" | "hoodie";
  pieces: PatternPiece[];
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL";
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
  selectedSize: HoodieSize;
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

export interface SvgExportOptions {
  sizePreset: SizePreset;
  paper: PaperSize;
  orientation: Orientation;
  marginMm: number;
  overlapMm: number;
  includeCropMarks: boolean;
  hoodieSize?: HoodieSize;
}

export const ROTATION_PRESETS: RotationPreset[] = [
  { name: "No Rotation", angles: [0] },
  { name: "180° Only", angles: [0, 180] },
  { name: "90° Steps", angles: [0, 90, 180, 270] },
  { name: "45° Steps", angles: [0, 45, 90, 135, 180, 225, 270, 315] },
  {
    name: "30° Steps",
    angles: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
  },
  { name: "15° Steps", angles: Array.from({ length: 24 }, (_, i) => i * 15) },
  { name: "10° Steps", angles: Array.from({ length: 36 }, (_, i) => i * 10) },
  { name: "5° Steps", angles: Array.from({ length: 72 }, (_, i) => i * 5) },
  { name: "1° Steps", angles: Array.from({ length: 360 }, (_, i) => i * 1) },
  {
    name: "0.5° Steps",
    angles: Array.from({ length: 720 }, (_, i) => i * 0.5),
  },
  {
    name: "0.1° Steps",
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

export type HoodieSize =
  | "XXS"
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL"
  | "3XL"
  | "4XL"
  | "5XL";

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
  selectedSize: HoodieSize;
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

export type PaperSize = "A4" | "A3" | "A2" | "A1" | "A0";
export type Orientation = "portrait" | "landscape";
export type SizePreset = "S" | "M" | "L" | "XL";

export interface ExportOptions {
  sizePreset: SizePreset;
  scaleMultipliers: Record<SizePreset, number>;
  paper: PaperSize;
  orientation: Orientation;
  marginMm: number;
  overlapMm: number;
  includeCropMarks: boolean;
  includeLabels: boolean;
  dpi: number;
  hoodieSize?: HoodieSize;
}

export interface ExportPayload {
  svgString: string;
  viewportPx: ViewportPx;
  options: ExportOptions;
  outPath?: string;
}

export const DEFAULT_SCALE_MULTIPLIERS: Record<SizePreset, number> = {
  S: 0.9,
  M: 1.0,
  L: 1.1,
  XL: 1.2,
};

export const ISO_PAPER_SIZES_MM: Record<
  PaperSize,
  { width: number; height: number }
> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A2: { width: 420, height: 594 },
  A1: { width: 594, height: 841 },
  A0: { width: 841, height: 1189 },
};

export const HOODIE_FRONT_PANEL_DIMENSIONS: Record<
  HoodieSize,
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
  "5XL": { widthCm: 40.2, heightCm: 79.4 },
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
