import { DesignCardProps } from "../../Design/types/design.types";

export interface ComfyUIWorkflow {
  id: string;
  name: string;
  workflowJson: any;
  description?: string;
  createdAt: Date;
  lastModified: Date;
  isDefault?: boolean;
}

export interface LibraryCardProps {
  item: ComfyUIWorkflow | SynthPrompt | CompositePrompt;
  type: "workflow" | "synthPrompt" | "compositePrompt";
  onLoad: (
    id: string,
    type: "workflow" | "synthPrompt" | "compositePrompt"
  ) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export interface DesignCardExtendedProps extends DesignCardProps {
  isDeleting?: boolean;
}

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  designName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface SynthPrompt {
  id: string;
  name: string;
  prompt: string;
  negativePrompt?: string;
  settings?: {
    steps?: number;
    cfgScale?: number;
    sampler?: string;
    scheduler?: string;
    seed?: number;
  };
  description?: string;
  createdAt: Date;
  lastModified: Date;
  isDefault?: boolean;
}
export interface CompositePrompt {
  id: string;
  name: string;
  prompt: string;
  negativePrompt?: string;
  settings?: {
    steps?: number;
    cfgScale?: number;
    sampler?: string;
    scheduler?: string;
    seed?: number;
  };
  description?: string;
  createdAt: Date;
  lastModified: Date;
  isDefault?: boolean;
}
export interface LibraryStats {
  workflowsCount: number;
  synthPromptsCount: number;
  compositePromptsCount: number;
}
export type LibraryItemType = "workflow" | "synthPrompt" | "compositePrompt";
export interface CreateLibraryItemRequest {
  name: string;
  description?: string;
  type: LibraryItemType;
  data: any;
}
