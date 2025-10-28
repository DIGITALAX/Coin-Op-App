import { NetworkConfig } from "../components/Common/types/common.types";
import { TemplateChoice } from "../components/Format/types/format.types";
import { Fulfiller } from "../components/Fulfillment/types/fulfillment.types";
import { GarmentSize } from "../components/Pattern/types/pattern.types";

export const INFURA_GATEWAY: string = "https://thedial.infura-ipfs.io";
export type Environment = "testnet" | "mainnet";

export const NETWORK_CONFIGS: Record<Environment, NetworkConfig> = {
  testnet: {
    chainId: 37111,
    rpcUrl: "https://rpc.testnet.lens.dev",
    name: "Lens Testnet",
    tokens: {
      mona: "0x8b205CBd20417BF9a28078197A13528bcB584836",
    },
  },
  mainnet: {
    chainId: 232,
    rpcUrl: "https://rpc.lens.dev",
    name: "Lens Mainnet",
    tokens: {
      mona: "0x28547B5b6B405A1444A17694AC84aa2d6A03b3Bd",
    },
  },
};
export const CURRENT_ENVIRONMENT: Environment = (
  process.env.NODE_ENV === "production" ? "mainnet" : "testnet"
) as Environment;
export const CURRENT_NETWORK = NETWORK_CONFIGS[CURRENT_ENVIRONMENT];

export const FULFILLERS: Fulfiller[] = [
  {
    title: "The Manufactory",
    uri: "ipfs://QmfCoKxKmrJw1fAgwqWh6a3MmJ1h8cv4jh2mQx15CrgyT5",
    base: 1,
    vig: 5,
    address: "0xdD35935C12E3748704C96492E5565d34daE73De7",
  },
];

export const TEMPLATE_CHOICES: TemplateChoice[] = [
  {
    name: "Hoodie",
    type: "hoodie",
    image: "QmVhSyXB67nUj1yH7GmojxvkoAdsrAumJkXs5rECnN7Cfj",
  },
  {
    name: "Shirt",
    type: "shirt",
    image: "QmRXrv2icSyRi5P7VEx9yWh66VQB9UiiYPSt2NDkuGAcB9",
  },
  {
    name: "Poster",
    type: "poster",
    image: "QmXSKZvk6iHtqRN9e3GEZPKRiDTUD72RY7w84ya2t3mRdZ",
  },
  {
    name: "Sticker",
    type: "sticker",
    image: "QmV3Au8Vz2HZ4cfP5Jp5WsD47umg67rN11Y47a5mdL7dnm",
  },
];

export const printTypeToNumber: { [key in string]: number } = {
  ["sticker"]: 0,
  ["poster"]: 1,
  ["shirt"]: 3,
  ["hoodie"]: 2,
};
export const SUPPORTED_NODES: string[] = [
  "CLIPTextEncode",
  "LoadImage",
  "LoraLoader",
  "VAELoader",
  "UnetLoaderGGUF",
  "CLIPLoaderGGUF",
  "KSampler",
];
export const pageMap: { [key in string]: string } = {
  ["Format"]: "/",
  ["Layer"]: "/Layer",
  ["Synth"]: "/Synth",
  ["Pattern"]: "/Pattern",
  ["Blender"]: "/Blender",
  ["Composite"]: "/Composite",
  ["Fulfill"]: "/Fulfill",
  ["Sell"]: "/Sell",
};

export const HOODIE_FRONT_PANEL_DIMENSIONS: Record<
  GarmentSize,
  { widthCm: number; heightCm: number }
> = {
  XXS: { widthCm: 31.2, heightCm: 61.0 },
  XS: { widthCm: 32.4, heightCm: 62.6 },
  S: { widthCm: 33.6, heightCm: 64.2 },
  M: { widthCm: 34.8, heightCm: 65.8 },
  L: { widthCm: 36.0, heightCm: 67.4 },
  XL: { widthCm: 37.2, heightCm: 69.0 },
  XXL: { widthCm: 38.4, heightCm: 70.6 },
  "3XL": { widthCm: 39.6, heightCm: 72.2 },
  "4XL": { widthCm: 40.8, heightCm: 73.8 },
  "5XL": { widthCm: 42.0, heightCm: 75.4 },
  CUSTOM: { widthCm: 0, heightCm: 0 },
};

export const SHIRT_FRONT_PANEL_DIMENSIONS: Record<
  GarmentSize,
  { widthCm: number; heightCm: number }
> = {
  XXS: { widthCm: 29.5, heightCm: 55.0 },
  XS: { widthCm: 30.7, heightCm: 56.5 },
  S: { widthCm: 31.9, heightCm: 58.0 },
  M: { widthCm: 33.1, heightCm: 59.5 },
  L: { widthCm: 34.3, heightCm: 61.0 },
  XL: { widthCm: 35.5, heightCm: 62.5 },
  XXL: { widthCm: 36.7, heightCm: 64.0 },
  "3XL": { widthCm: 37.9, heightCm: 65.5 },
  "4XL": { widthCm: 39.1, heightCm: 67.0 },
  "5XL": { widthCm: 40.3, heightCm: 69.0 },
  CUSTOM: { widthCm: 0, heightCm: 0 },
};

export const PATTERN_COLORS: string[] = [
  "#8B5CF6",
  "#3B82F6",
  "#06B6D4",
  "#A78BFA",
  "#60A5FA",
  "#FBBF24",
  "#F472B6",
  "#E5E7EB",
  "#9333EA",
  "#2563EB",
  "#0891B2",
  "#F9FAFB",
];
