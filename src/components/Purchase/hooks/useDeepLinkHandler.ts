import { useEffect, useState } from "react";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { PurchaseResult } from "../types/purchase.types";

export const useDeepLinkHandler = () => {
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setupDeepLinkListener = async () => {
      try {
        unlisten = await onOpenUrl((urls) => {
          const url = urls[0];
          if (url?.startsWith("coinop://purchase")) {
            handlePurchaseComplete(url);
          }
        });
      } catch (error) {
      }
    };
    setupDeepLinkListener();
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);
  const handlePurchaseComplete = (url: string) => {
    try {
      const urlObj = new URL(url);
      const success = urlObj.searchParams.get("success") === "true";
      const sessionId = urlObj.searchParams.get("sessionId");
      const txHash = urlObj.searchParams.get("txHash");
      const result: PurchaseResult = {
        success,
        sessionId: sessionId || undefined,
        txHash: txHash || undefined,
      };
      setPurchaseResult(result);
      if (success) {
        setShowSuccessPopup(true);
      }
    } catch (error) {
    }
  };
  const dismissPopup = () => {
    setShowSuccessPopup(false);
    setPurchaseResult(null);
  };
  return {
    purchaseResult,
    showSuccessPopup,
    dismissPopup,
  };
};