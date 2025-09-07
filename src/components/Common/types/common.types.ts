import { ReactNode } from "react";
import {
  Child,
  Template,
  TemplateChoice,
  GroupedTemplate,
} from "../../Format/types/format.types";
import { FulfillmentSelection } from "../../Fulfillment/types/fulfillment.types";
import {
  ComfyUIWorkflow,
  CompositePrompt,
  CreateLibraryItemRequest,
  LibraryStats,
  SynthPrompt,
} from "../../Activity/types/activity.types";

export enum Walkthrough {
  Format = "Format",
  Layer = "Layer",
  Synth = "Synth",
  Composite = "Composite",
  Pattern = "Pattern",
  Fulfillment = "Fulfillment",
  Sell = "Sell",
}


export interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  name: string;
  contracts: {
    fulfiller: `0x${string}`;
    splits: `0x${string}`;
  };
  tokens: {
    mona: `0x${string}`;
  };
}

export interface PageNavigationProps {
  currentPage: string;
}

export interface AppContextType {
  selectedTemplate: GroupedTemplate | undefined;
  selectTemplate: (templateChoice: GroupedTemplate) => void;
  selectedLayer: { front: Template; back?: Template };
  selectLayer: (front: Template, back?: Template) => void;
  selectedPatternChild: Child;
  setSelectedPatternChild: (child: Child) => void;
  isBackSide: boolean;
  flipCanvas: () => void;
  canFlip: boolean;
  groupedTemplates: GroupedTemplate[];
  isLoadingTemplates: boolean;
}

export interface AppProviderProps {
  children: ReactNode;
}

export interface ProjectGuardProps {
  children: ReactNode;
}

export interface CartProviderProps {
  children: ReactNode;
}
export interface CartItem {
  id: string;
  designId?: string;
  designName?: string;
  template: TemplateChoice;
  layer: Template;
  fulfillmentSelection: FulfillmentSelection;
  unitPrice: number;
  quantity: number;
  timestamp: Date;
  compositeImages?: {
    front?: string;
    back?: string;
  };
  childrenCanvasData?: Array<{
    uri: string;
    canvasData?: string;
    originalUri?: string;
  }>;
}
export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "id" | "timestamp" | "quantity">) => void;
  removeFromCart: (id: string) => void;
  removeByDesignId: (designId: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

export interface DesignProviderProps {
  children: ReactNode;
}

export interface LibraryProviderProps {
  children: ReactNode;
}

export interface LibraryContextType {
  workflows: ComfyUIWorkflow[];
  synthPrompts: SynthPrompt[];
  compositePrompts: CompositePrompt[];
  stats: LibraryStats;
  isLoading: boolean;
  createWorkflow: (
    request: Omit<CreateLibraryItemRequest, "type"> & { data: any }
  ) => Promise<ComfyUIWorkflow>;
  createSynthPrompt: (
    request: Omit<CreateLibraryItemRequest, "type"> & { data: SynthPrompt }
  ) => Promise<SynthPrompt>;
  createCompositePrompt: (
    request: Omit<CreateLibraryItemRequest, "type"> & { data: CompositePrompt }
  ) => Promise<CompositePrompt>;
  loadWorkflow: (id: string) => ComfyUIWorkflow | null;
  loadSynthPrompt: (id: string) => SynthPrompt | null;
  loadCompositePrompt: (id: string) => CompositePrompt | null;
  deleteWorkflow: (id: string) => Promise<void>;
  deleteSynthPrompt: (id: string) => Promise<void>;
  deleteCompositePrompt: (id: string) => Promise<void>;
  refreshLibrary: () => Promise<void>;
}
