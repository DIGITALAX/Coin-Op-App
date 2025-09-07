import { NetworkConfig } from "../components/Common/types/common.types";
import {
  TemplateChoice,
} from "../components/Format/types/format.types";
import {
  Fulfiller,
} from "../components/Fulfillment/types/fulfillment.types";
import { Market } from "../components/Sell/types/sell.types";

export const INFURA_GATEWAY: string = "https://thedial.infura-ipfs.io";
export type Environment = "testnet" | "mainnet";

export const NETWORK_CONFIGS: Record<Environment, NetworkConfig> = {
  testnet: {
    chainId: 37111,
    rpcUrl: "https://rpc.testnet.lens.dev",
    name: "Lens Testnet",
    contracts: {
      fulfiller: "0x44e4684063eC94C6d52F6d2CAFD5e4e1eD6Bd03F",
      splits: "0x7991EEB9a278a1facd4009b2bc578FA23a307B5d",
    },
    tokens: {
      mona: "0x8b205CBd20417BF9a28078197A13528bcB584836",
    },
  },
  mainnet: {
    chainId: 232,
    rpcUrl: "https://rpc.lens.dev",
    name: "Lens Mainnet",
    contracts: {
      fulfiller: "0x0000000000000000000000000000000000000000",
      splits: "0x0000000000000000000000000000000000000000",
    },
    tokens: {
      mona: "0x0000000000000000000000000000000000000000",
    },
  },
};
export const CURRENT_ENVIRONMENT: Environment = (
  process.env.NODE_ENV === "production" ? "mainnet" : "testnet"
) as Environment;
export const CURRENT_NETWORK = NETWORK_CONFIGS[CURRENT_ENVIRONMENT];
export const MARKETS: Market[] = [
  {
    title: "Coin Op",
    uri: "ipfs://",
    address: ""
  },
];
export const FULFILLERS: Fulfiller[] = [
  {
    title: "The Manufactory",
    uri: "ipfs://QmfCoKxKmrJw1fAgwqWh6a3MmJ1h8cv4jh2mQx15CrgyT5",
    address: "0xdD35935C12E3748704C96492E5565d34daE73De7",
    base: 1,
    vig: 5
  },
];
export const BASE_COLORS: string[] = ["#fff", "#000"];

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
  ["Composite"]: "/Composite",
  ["Fulfillment"]: "/Fulfillment",
  ["Sell"]: "/Sell",
};
