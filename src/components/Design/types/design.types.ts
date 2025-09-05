export interface Design {
  id: string;
  name: string;
  templateId: string;
  layerTemplateId: string;
  childUri: string;
  createdAt: Date;
  lastModified: Date;
  thumbnail?: string;
  description?: string;
  wasteData?: {
    totalWastePercentage?: number;
    fabricSavedMM2?: number;
    layoutCount?: number;
    lastWasteAnalysis?: Date;
  };
}
export interface DesignMetadata {
  design: Design;
  stats: {
    canvasHistoryCount: number;
    aiGenerationCount: number;
    compositeCount: number;
    wastePercentage?: number;
    fabricSavedMM2?: number;
    patternLayoutCount?: number;
  };
}
export interface CreateDesignRequest {
  name: string;
  templateId: string;
  layerTemplateId: string;
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
  templateId: string;
  layerTemplateId: string;
  childUri: string;
  onDesignCreated: (request: CreateDesignRequest) => Promise<Design>;
}
export interface DesignCardProps {
  designMetadata: DesignMetadata;
  onLoad: (designId: string) => void;
  onDelete: (designId: string) => void;
}