export interface Fulfiller {
  title: string;
  uri: string;
}
export interface Material {
  title: string;
  description: string;
  price: number;
  type: "apparel" | "poster" | "sticker";
  id: number;
}
export interface FulfillmentSelection {
  fulfiller: Fulfiller | null;
  baseColor: string | null;
  material: Material | null;
}
