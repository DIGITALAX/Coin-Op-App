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
  childId: string;
  childContract: string;
}

export interface FulfillmentSelection {
  baseColors: string[];
  materials: Material[];
}

export interface ChildData {
  price: string;
  childType: string;
  childContract: string;
  childId: string;
  currency: string;
  metadata?: {
    title?: string;
    image?: string;
    description?: string;
    tags?: string[];
  };
  uri: string;
}

