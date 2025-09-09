export interface Fulfiller {
  title: string;
  uri: string;
  base: number;
  address: string;
  vig: number;
}

export interface Material {
  title: string;
  description?: string;
  price: number;
  type: string;
  tags?: string[];
}

export interface FulfillmentSelection {
  fulfiller: Fulfiller | null;
  baseColors: string[];
  materials: Material[];
}

export interface ChildData {
  price: string;
  child_type: string;
  child_contract: string;
  child_id: string;
  currency: string;
  metadata?: {
    title?: string;
    image?: string;
    description?: string;
    tags?: string[];
  };
  uri: string;
}

