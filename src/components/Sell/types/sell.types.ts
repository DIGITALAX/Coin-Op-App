export interface SellData {
  composite_front: string;
  composite_back?: string;
  fulfiller_address: string;
  custom_fields: {
    colors: string[];
    materials: Array<{
      childId: string;
      childContract: string;
    }>;
    template_contract: string;
    template_id: string;
    zone_children: Array<{
      image: string;
      location: "front" | "back";
    }>;
  };
}

export interface UseSellReturn {
  handleCoinOpMarket: () => Promise<void>;
  isProcessing: boolean;
  hasComposite: boolean;
  isCheckingComposite: boolean;
}