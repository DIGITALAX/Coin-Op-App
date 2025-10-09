import { INFURA_GATEWAY } from "./constants";

export const getImageUrl = (uri: string): string => {
  if (!uri) return "";
  if (uri?.startsWith("data:")) return uri;
  if (uri?.startsWith("ipfs://")) {
    const hash = uri?.replace("ipfs://", "");
    return `${INFURA_GATEWAY}/ipfs/${hash}`;
  }
  if (uri?.startsWith("Qm") || uri?.startsWith("bafy")) {
    return `${INFURA_GATEWAY}/ipfs/${uri}`;
  }
  return uri;
};