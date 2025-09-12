import { useState, useEffect, useCallback } from "react";
import { useDesignContext } from "../../../context/DesignContext";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { getCurrentTemplate } from "../../Synth/utils/templateHelpers";
import { useApp } from "../../../context/AppContext";
import { UseSellReturn, SellData } from "../types/sell.types";
import { openUrl } from "@tauri-apps/plugin-opener";
import { FULFILLERS } from "../../../lib/constants";
import { CanvasHistory } from "../../Synth/types/synth.types";

export const useSell = (): UseSellReturn => {
  const { currentDesign } = useDesignContext();
  const { getItem } = useDesignStorage();
  const { selectedLayer, isBackSide } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasComposite, setHasComposite] = useState(false);
  const [isCheckingComposite, setIsCheckingComposite] = useState(true);

  const checkComposite = useCallback(async () => {
    if (!currentDesign) {
      setHasComposite(false);
      setIsCheckingComposite(false);
      return;
    }

    const frontTemplate = getCurrentTemplate(selectedLayer, false);

    if (!frontTemplate) {
      setHasComposite(false);
      setIsCheckingComposite(false);
      return;
    }

    try {
      const frontCompositeKey = `compositeImage_${currentDesign.id}_front`;

      const frontComposite = await getItem(frontCompositeKey);

      setHasComposite(!!frontComposite);
    } catch (error) {
      setHasComposite(false);
    } finally {
      setIsCheckingComposite(false);
    }
  }, [currentDesign, selectedLayer, isBackSide, getItem]);

  const renderComposite = async (
    backgroundImage: string,
    children: any[]
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 600;
      canvas.height = 600;

      if (!ctx) {
        resolve("");
        return;
      }

      const bg = new Image();
      bg.onload = async () => {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        for (const child of children) {
          const childImg = new Image();
          await new Promise<void>((childResolve) => {
            childImg.onload = () => {
              ctx.drawImage(
                childImg,
                child.x,
                child.y,
                child.width,
                child.height
              );
              childResolve();
            };
            childImg.onerror = () => {
              childResolve();
            };
            childImg.src = child.imageUrl;
          });
        }

        const result = canvas.toDataURL("image/png");
        resolve(result);
      };
      bg.onerror = () => {
        resolve("");
      };
      bg.src = backgroundImage;
    });
  };

  useEffect(() => {
    checkComposite();
  }, [checkComposite]);

  const handleCoinOpMarket = async () => {
    if (!currentDesign) {
      return;
    }

    if (!selectedLayer) {
      return;
    }

    if (isProcessing) {
      return;
    }

    setIsCheckingComposite(true);
    await checkComposite();

    if (!hasComposite) {
      return;
    }

    setIsProcessing(true);

    try {
      const frontTemplate = getCurrentTemplate(selectedLayer, false);

      if (!frontTemplate) {
        setIsProcessing(false);
        return;
      }

      const fulfillmentData = await getItem("fulfillment");

      const backTemplate = getCurrentTemplate(selectedLayer, true);

      const frontImageKey = `compositeImage_${currentDesign.id}_front`;
      const backImageKey = `compositeImage_${currentDesign.id}_back`;
      const frontChildrenKey = `compositeCanvasChildren_${currentDesign.id}_front`;
      const backChildrenKey = `compositeCanvasChildren_${currentDesign.id}_back`;

      const [frontImage, backImage, frontChildren, backChildren]: any =
        await Promise.all([
          getItem(frontImageKey),
          getItem(backImageKey).catch(() => null),
          getItem(frontChildrenKey).catch(() => []),
          getItem(backChildrenKey).catch(() => []),
        ]);

      if (!frontImage || typeof frontImage !== "string") {
        setIsProcessing(false);
        return;
      }

      const composite_front = await renderComposite(
        frontImage,
        frontChildren || []
      );
      let composite_back: string | null = null;

      if (backImage && typeof backImage === "string") {
        composite_back = await renderComposite(backImage, backChildren || []);
      }

      const fulfillmentDataAny = fulfillmentData as any;

      const zoneChildrenFront: Array<{
        childId: string;
        childContract: string;
        canvasImage: string;
      }> = [];

      const zoneChildrenBack: Array<{
        childId: string;
        childContract: string;
        canvasImage: string;
      }> = [];

      try {
        const canvasHistory: CanvasHistory[] | null = await getItem(
          "canvasHistory"
        );

        if (canvasHistory && Array.isArray(canvasHistory)) {
          const childrenFront =
            selectedLayer.front?.childReferences?.filter((child: any) =>
              child?.child?.metadata?.tags?.includes("zone")
            ) || [];

          for (const zoneChild of childrenFront) {
            const childHistory = canvasHistory.find(
              (history) =>
                history.childUri === zoneChild.uri &&
                history.layerTemplateId === selectedLayer.front.templateId
            ) as CanvasHistory;

            if (childHistory?.thumbnail) {
              zoneChildrenFront.push({
                canvasImage: childHistory.thumbnail as string,
                childId: zoneChild.childId,
                childContract: zoneChild.childContract,
              });
            }
          }

          const childrenBack =
            selectedLayer.back?.childReferences?.filter((child: any) =>
              child?.child?.metadata?.tags?.includes("zone")
            ) || [];

          for (const zoneChild of childrenBack) {
            const childHistory = canvasHistory.find(
              (history) =>
                history.childUri === zoneChild.uri &&
                history.layerTemplateId === selectedLayer.back?.templateId
            ) as CanvasHistory;

            if (childHistory?.thumbnail) {
              zoneChildrenBack.push({
                canvasImage: childHistory.thumbnail as string,
                childId: zoneChild.childId,
                childContract: zoneChild.childContract,
              });
            }
          }
        }
      } catch (error: any) {
        console.error(error.message);
      }

      const sellData: SellData = {
        front: {
          compositeImage: composite_front,
          templateId: frontTemplate.templateId,
          templateContract: frontTemplate.templateContract,
          children: zoneChildrenFront,
        },
        back: composite_back
          ? {
              compositeImage: composite_back,
              templateId: backTemplate!?.templateId,
              templateContract: backTemplate!?.templateContract,
              children: zoneChildrenBack,
            }
          : undefined,
        fulfiller: FULFILLERS[0],
        color: {
          childId: fulfillmentDataAny?.color?.childId,
          childContract: fulfillmentDataAny?.color?.childContract,
        },
        material: {
          childId: fulfillmentDataAny?.material?.childId,
          childContract: fulfillmentDataAny?.material?.childContract,
        },
      };

      const fgoUrl =
        process.env.NODE_ENV === "production"
          ? "https://coinop.themanufactory.xyz"
          : "http://localhost:3000";

      try {
        const response = await fetch(`${fgoUrl}/api/create-sell-session/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors",
          body: JSON.stringify(sellData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create sell session: ${response.status}`);
        }

        const result = await response.json();

        const sessionId = result.sessionId;
        const sellUrl = `${fgoUrl}/sell?sessionId=${sessionId}`;

        await openUrl(sellUrl);
      } catch (apiError) {
        const fallbackUrl = `${fgoUrl}/sell?data=${encodeURIComponent(
          JSON.stringify(sellData)
        )}`;
        await openUrl(fallbackUrl);
      }
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleCoinOpMarket,
    isProcessing,
    hasComposite,
    isCheckingComposite,
  };
};
