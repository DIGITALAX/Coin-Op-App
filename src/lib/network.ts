import { NetworkConfig } from "../components/Common/types/common.types";
import {
  NETWORK_CONFIGS,
  CURRENT_ENVIRONMENT,
  type Environment,
} from "./constants";
export const getNetworkConfig = (env?: Environment): NetworkConfig => {
  return NETWORK_CONFIGS[env || CURRENT_ENVIRONMENT];
};
export const getCurrentNetwork = (): NetworkConfig => {
  return getNetworkConfig();
};
export const getContractAddress = (
  contractName: keyof NetworkConfig["contracts"],
  env?: Environment
): `0x${string}` => {
  const config = getNetworkConfig(env);
  return config.contracts[contractName];
};
export const getTokenAddress = (
  tokenName: keyof NetworkConfig["tokens"],
  env?: Environment
): `0x${string}` => {
  const config = getNetworkConfig(env);
  return config.tokens[tokenName];
};
export const isTestnet = (): boolean => {
  return CURRENT_ENVIRONMENT === "testnet";
};
export const isMainnet = (): boolean => {
  return CURRENT_ENVIRONMENT === "mainnet";
};
export const getCurrentChainId = (): number => {
  return getCurrentNetwork().chainId;
};
export const getCurrentRpcUrl = (): string => {
  return getCurrentNetwork().rpcUrl;
};
