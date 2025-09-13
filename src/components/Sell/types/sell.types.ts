import { Fulfiller } from "../../Fulfillment/types/fulfillment.types";

export interface SellData {
  front: {
    compositeImage: string;
    templateId: string;
    templateContract: string;
    children: {
      childId: string;
      childContract: string;
      canvasImage: Blob;
    }[];
  };
  back?: {
    compositeImage: string;
    templateId: string;
    templateContract: string;
    children: {
      childId: string;
      childContract: string;
      canvasImage: Blob;
    }[];
  };
  fulfiller: Fulfiller;
  material: {
    childId: string;
    childContract: string;
  };
  color: {
    childId: string;
    childContract: string;
  };
}

export interface UseSellReturn {
  handleCoinOpMarket: () => Promise<void>;
  isProcessing: boolean;
  hasComposite: boolean;
  isCheckingComposite: boolean;
}
