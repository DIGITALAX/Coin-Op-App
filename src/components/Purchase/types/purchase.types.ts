
export interface ShippingDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
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
    wgho: `0x${string}`;
  };
}
export type PaymentToken = "mona" | "wgho";
export interface PaymentMethod {
  token: PaymentToken;
  label: string;
  symbol: string;
  address?: `0x${string}`;
}
export const PAYMENT_METHODS: PaymentMethod[] = [
  { token: "mona", label: "Monavale", symbol: "MONA" },
  { token: "wgho", label: "Wrapped GHO", symbol: "WGHO" }
];
export interface ConversionRate {
  usdAmount: number;
  tokenAmount: string;
  rate: string;
}
export interface PurchaseOrder {
  cartItems: any[];
  shippingDetails: ShippingDetails;
  paymentToken: PaymentToken;
  totalUsd: number;
  totalTokenAmount: string;
  conversionRate: string;
}

export interface UsePurchaseFormReturn {
  shippingDetails: ShippingDetails;
  setShippingDetails: (details: ShippingDetails) => void;
  updateShippingField: (field: keyof ShippingDetails, value: string) => void;
  paymentToken: PaymentToken;
  setPaymentToken: (token: PaymentToken) => void;
  isShippingComplete: () => boolean;
}

export interface DesktopCartData {
  items: any[];
  paymentToken: "mona" | "wgho";
  usdTotal: number;
  timestamp: number;
}

export interface SuccessPopupProps {
  isVisible: boolean;
  purchaseResult: PurchaseResult | null;
  onClearCart: () => void;
  onDismiss: () => void;
}

export interface PurchaseResult {
  success: boolean;
  sessionId?: string;
  txHash?: string;
}