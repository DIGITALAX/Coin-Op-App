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
  selectedSize: Size;
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

export interface PatternLibraryProps {
  onSelectPieces: (pieces: PatternPiece[], size: Size) => void;
  onSizeChange?: (pieces: PatternPiece[], size: Size) => void;
}

export interface PatternState {
  autoResult: NestingResult | null;
  manualPieces: CanvasPanel[] | null;
  currentMode: "auto" | "manual";
  settings: NestingSettings;
  liveSvgContent: string | null;
  selectedPieces: PatternPiece[];
  selectedSize: Size;
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

export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";
export interface SizeGrading {
  chest: number;
  length: number;
  shoulder: number;
  sleeveLength: number;
  sleeveWidth: number;
  neckWidth: number;
}
export const UNISEX_T_SHIRT_SIZING: Record<Size, SizeGrading> = {
  XS: {
    chest: 460,
    length: 610,
    shoulder: 380,
    sleeveLength: 200,
    sleeveWidth: 150,
    neckWidth: 160,
  },
  S: {
    chest: 510,
    length: 640,
    shoulder: 410,
    sleeveLength: 210,
    sleeveWidth: 160,
    neckWidth: 170,
  },
  M: {
    chest: 540,
    length: 670,
    shoulder: 440,
    sleeveLength: 220,
    sleeveWidth: 170,
    neckWidth: 180,
  },
  L: {
    chest: 580,
    length: 700,
    shoulder: 470,
    sleeveLength: 230,
    sleeveWidth: 180,
    neckWidth: 190,
  },
  XL: {
    chest: 610,
    length: 730,
    shoulder: 500,
    sleeveLength: 240,
    sleeveWidth: 190,
    neckWidth: 200,
  },
  XXL: {
    chest: 650,
    length: 760,
    shoulder: 530,
    sleeveLength: 250,
    sleeveWidth: 200,
    neckWidth: 210,
  },
  XXXL: {
    chest: 690,
    length: 790,
    shoulder: 560,
    sleeveLength: 260,
    sleeveWidth: 210,
    neckWidth: 220,
  },
};
export const UNISEX_HOODIE_SIZING: Record<
  Size,
  SizeGrading & { hoodDepth: number; pocketWidth: number }
> = {
  XS: {
    chest: 520,
    length: 660,
    shoulder: 410,
    sleeveLength: 350,
    sleeveWidth: 180,
    neckWidth: 190,
    hoodDepth: 320,
    pocketWidth: 280,
  },
  S: {
    chest: 570,
    length: 690,
    shoulder: 440,
    sleeveLength: 360,
    sleeveWidth: 190,
    neckWidth: 200,
    hoodDepth: 340,
    pocketWidth: 300,
  },
  M: {
    chest: 600,
    length: 720,
    shoulder: 470,
    sleeveLength: 370,
    sleeveWidth: 200,
    neckWidth: 210,
    hoodDepth: 360,
    pocketWidth: 320,
  },
  L: {
    chest: 640,
    length: 750,
    shoulder: 500,
    sleeveLength: 380,
    sleeveWidth: 210,
    neckWidth: 220,
    hoodDepth: 380,
    pocketWidth: 340,
  },
  XL: {
    chest: 680,
    length: 780,
    shoulder: 530,
    sleeveLength: 390,
    sleeveWidth: 220,
    neckWidth: 230,
    hoodDepth: 400,
    pocketWidth: 360,
  },
  XXL: {
    chest: 720,
    length: 810,
    shoulder: 560,
    sleeveLength: 400,
    sleeveWidth: 230,
    neckWidth: 240,
    hoodDepth: 420,
    pocketWidth: 380,
  },
  XXXL: {
    chest: 760,
    length: 840,
    shoulder: 590,
    sleeveLength: 410,
    sleeveWidth: 240,
    neckWidth: 250,
    hoodDepth: 440,
    pocketWidth: 400,
  },
};
export const BASE_SIZE: Size = "M";
export const calculateScaleFactor = (
  targetSize: Size,
  garmentType: "tshirt" | "hoodie"
): { width: number; height: number } => {
  const baseSizing =
    garmentType === "tshirt"
      ? UNISEX_T_SHIRT_SIZING[BASE_SIZE]
      : UNISEX_HOODIE_SIZING[BASE_SIZE];
  const targetSizing =
    garmentType === "tshirt"
      ? UNISEX_T_SHIRT_SIZING[targetSize]
      : UNISEX_HOODIE_SIZING[targetSize];
  return {
    width: targetSizing.chest / baseSizing.chest,
    height: targetSizing.length / baseSizing.length,
  };
};

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
  selectedSize: Size;
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
