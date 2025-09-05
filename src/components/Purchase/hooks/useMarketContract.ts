import { useState, useCallback, useMemo } from "react";
import { createPublicClient, http, formatEther } from "viem";
import {
  getCurrentNetwork,
  getContractAddress,
  getTokenAddress,
} from "../../../lib/network";
import { PaymentToken, ConversionRate } from "../types/purchase.types";
import { SplitsABI } from "../../../abis";
export const useMarketContract = () => {
  const [conversionRates, setConversionRates] = useState<
    Record<PaymentToken, ConversionRate | null>
  >({
    mona: null,
    wgho: null,
  });
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const network = getCurrentNetwork();
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: {
          id: network.chainId,
          name: network.name,
          network: network.name.toLowerCase(),
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: {
            default: { http: [network.rpcUrl] },
            public: { http: [network.rpcUrl] },
          },
        },
        transport: http(network.rpcUrl),
      }),
    [network.chainId, network.name, network.rpcUrl]
  );
  const getConversionRate = useCallback(
    async (
      token: PaymentToken,
      usdAmount: number
    ): Promise<ConversionRate | null> => {
      try {
        setError(null);
        const splitsContract = getContractAddress("splits");
        const tokenAddress = getTokenAddress(token);
        const isCurrency = (await publicClient.readContract({
          address: splitsContract,
          abi: SplitsABI,
          functionName: "getIsCurrency",
          args: [tokenAddress],
        })) as boolean;
        if (!isCurrency) {
          setError(`${token.toUpperCase()} is not configured in the contract`);
          return null;
        }
        const rate = (await publicClient.readContract({
          address: splitsContract,
          abi: SplitsABI,
          functionName: "getCurrencyRate",
          args: [tokenAddress],
        })) as bigint;
        const weiAmount = (await publicClient.readContract({
          address: splitsContract,
          abi: SplitsABI,
          functionName: "getCurrencyWei",
          args: [tokenAddress],
        })) as bigint;
        if (rate === 0n) {
          setError(`${token.toUpperCase()} rate not set in contract`);
          return null;
        }
        const tokenAmount =
          (BigInt(Math.floor(usdAmount * 1e18)) * weiAmount) / rate;
        const formattedTokenAmount = formatEther(tokenAmount);
        const formattedRate = formatEther(rate);
        const roundedTokenAmount = parseFloat(formattedTokenAmount).toFixed(3);
        const roundedRate = parseFloat(formattedRate).toFixed(3);
        return {
          usdAmount,
          tokenAmount: roundedTokenAmount,
          rate: roundedRate,
        };
      } catch (error: any) {
        setError(`Failed to get ${token.toUpperCase()} conversion rate`);
        return null;
      }
    },
    [publicClient]
  );
  const loadConversionRates = useCallback(
    async (usdAmount: number) => {
      if (usdAmount <= 0) return;
      setIsLoadingRates(true);
      const newRates: Record<PaymentToken, ConversionRate | null> = {
        mona: null,
        wgho: null,
      };
      for (const token of ["mona", "wgho"] as PaymentToken[]) {
        newRates[token] = await getConversionRate(token, usdAmount);
      }
      setConversionRates(newRates);
      setIsLoadingRates(false);
    },
    [getConversionRate]
  );
  return {
    conversionRates,
    isLoadingRates,
    getConversionRate,
    loadConversionRates,
    error,
  };
};
