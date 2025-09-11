export interface Design {
  id: string;
  name: string;
  frontLayerTemplateId: string;
  backLayerTemplateId?: string;
  childUri: string;
  createdAt: Date;
  lastModified: Date;
  thumbnail?: string;
  description?: string;
  type: string;
  patternData?: {
    autoResult: any;
    manualPieces: any[];
    autoBasePieces?: any[];
    currentMode: "auto" | "manual";
    settings: any;
    liveSvgContent: string | null;
    savedSvgContent?: string | null;
    canvasWidth?: number;
    canvasHeight?: number;
    lastSvgFromNesting?: string | null;
  };
}
export interface DesignMetadata {
  design: Design;
  stats: {
    canvasHistoryCount: number;
    aiGenerationCount: number;
    compositeCount: number;
    wastePercentage?: number;
    patternLayoutCount?: number;
  };
}
export interface CreateDesignRequest {
  name: string;
  templateId: string;
  type: string;
  frontLayerTemplateId: string;
  backLayerTemplateId?: string;
  childUri: string;
  description?: string;
}
export interface DesignContextType {
  currentDesign: Design | null;
  availableDesigns: DesignMetadata[];
  isLoading: boolean;
  createDesign: (request: CreateDesignRequest) => Promise<Design>;
  loadDesign: (designId: string) => Promise<void>;
  deleteDesign: (designId: string) => Promise<void>;
  updateDesignThumbnail: (designId: string, thumbnail: string) => Promise<void>;
  refreshDesigns: () => Promise<void>;
}
export interface DesignCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  templateId: string;
  frontLayerTemplateId: string;
  backLayerTemplateId?: string;
  childUri: string;
  onDesignCreated: (request: CreateDesignRequest) => Promise<Design>;
}
export interface DesignCardProps {
  designMetadata: DesignMetadata;
  onLoad: (designId: string) => void;
  onDelete: (designId: string) => void;
}
