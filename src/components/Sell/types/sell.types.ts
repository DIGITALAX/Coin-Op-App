export interface SellData {
  front: {
    compositeImage: string;
    templateId: string;
    templateContract: string;
    children: {
      childId: string;
      childContract: string;
      canvasImage: string;
    }[];
  };
  back?: {
    compositeImage: string;
    templateId: string;
    templateContract: string;
    children: {
      childId: string;
      childContract: string;
      canvasImage: string;
    }[];
  };
  fulfiller: string;
  materials: {
    childId: string;
    childContract: string;
  }[];
  colors: string[];
}

export interface UseSellReturn {
  handleCoinOpMarket: () => Promise<void>;
  isProcessing: boolean;
  hasComposite: boolean;
  isCheckingComposite: boolean;
}
