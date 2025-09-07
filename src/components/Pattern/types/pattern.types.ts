export  interface SparrowStats {
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
  currentMode: 'auto' | 'manual';
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
  { name: "30° Steps", angles: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330] },
  { name: "15° Steps", angles: Array.from({ length: 24 }, (_, i) => i * 15) },
  { name: "10° Steps", angles: Array.from({ length: 36 }, (_, i) => i * 10) },
  { name: "5° Steps", angles: Array.from({ length: 72 }, (_, i) => i * 5) },
  { name: "1° Steps", angles: Array.from({ length: 360 }, (_, i) => i * 1) },
  { name: "0.5° Steps", angles: Array.from({ length: 720 }, (_, i) => i * 0.5) },
  { name: "0.1° Steps", angles: Array.from({ length: 3600 }, (_, i) => i * 0.1) },
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
    chest: 864,      
    length: 635,     
    shoulder: 406,   
    sleeveLength: 190, 
    sleeveWidth: 165,  
    neckWidth: 165,    
  },
  S: {
    chest: 914,      
    length: 660,     
    shoulder: 432,   
    sleeveLength: 203, 
    sleeveWidth: 178,  
    neckWidth: 178,    
  },
  M: {
    chest: 965,      
    length: 686,     
    shoulder: 457,   
    sleeveLength: 216, 
    sleeveWidth: 191,  
    neckWidth: 191,    
  },
  L: {
    chest: 1067,     
    length: 711,     
    shoulder: 483,   
    sleeveLength: 229, 
    sleeveWidth: 203,  
    neckWidth: 203,    
  },
  XL: {
    chest: 1168,     
    length: 737,     
    shoulder: 508,   
    sleeveLength: 241, 
    sleeveWidth: 216,  
    neckWidth: 216,    
  },
  XXL: {
    chest: 1270,     
    length: 762,     
    shoulder: 533,   
    sleeveLength: 254, 
    sleeveWidth: 229,  
    neckWidth: 229,    
  },
  XXXL: {
    chest: 1372,     
    length: 787,     
    shoulder: 559,   
    sleeveLength: 267, 
    sleeveWidth: 241,  
    neckWidth: 241,    
  },
};
export const UNISEX_HOODIE_SIZING: Record<Size, SizeGrading & { hoodDepth: number; pocketWidth: number }> = {
  XS: {
    ...UNISEX_T_SHIRT_SIZING.XS,
    length: 635,       
    sleeveLength: 635, 
    hoodDepth: 330,    
    pocketWidth: 330,  
  },
  S: {
    ...UNISEX_T_SHIRT_SIZING.S,
    length: 660,
    sleeveLength: 660,
    hoodDepth: 343,    
    pocketWidth: 343,
  },
  M: {
    ...UNISEX_T_SHIRT_SIZING.M,
    length: 686,
    sleeveLength: 686, 
    hoodDepth: 356,    
    pocketWidth: 356,
  },
  L: {
    ...UNISEX_T_SHIRT_SIZING.L,
    length: 711,
    sleeveLength: 711,
    hoodDepth: 381,    
    pocketWidth: 381,
  },
  XL: {
    ...UNISEX_T_SHIRT_SIZING.XL,
    length: 737,
    sleeveLength: 737,
    hoodDepth: 406,    
    pocketWidth: 406,
  },
  XXL: {
    ...UNISEX_T_SHIRT_SIZING.XXL,
    length: 762,
    sleeveLength: 762,
    hoodDepth: 432,    
    pocketWidth: 432,
  },
  XXXL: {
    ...UNISEX_T_SHIRT_SIZING.XXXL,
    length: 787,
    sleeveLength: 787,
    hoodDepth: 457,    
    pocketWidth: 457,
  },
};
export const BASE_SIZE: Size = "M";
export const calculateScaleFactor = (targetSize: Size, garmentType: "tshirt" | "hoodie"): { width: number; height: number } => {
  const baseSizing = garmentType === "tshirt" ? UNISEX_T_SHIRT_SIZING[BASE_SIZE] : UNISEX_HOODIE_SIZING[BASE_SIZE];
  const targetSizing = garmentType === "tshirt" ? UNISEX_T_SHIRT_SIZING[targetSize] : UNISEX_HOODIE_SIZING[targetSize];
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