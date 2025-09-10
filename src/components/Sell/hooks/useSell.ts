import { useState, useEffect, useCallback } from "react";
import { useDesignContext } from "../../../context/DesignContext";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { getCurrentTemplate } from "../../Synth/utils/templateHelpers";
import { useApp } from "../../../context/AppContext";
import { UseSellReturn, SellData } from "../types/sell.types";
import { openUrl } from "@tauri-apps/plugin-opener";

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
      const frontCompositeKey = `compositeImage_${frontTemplate.templateId}_front`;

      const frontComposite = await getItem(frontCompositeKey, "composite");

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
            childImg.onerror = () => childResolve();
            childImg.src = child.imageUrl;
          });
        }

        resolve(canvas.toDataURL("image/png"));
      };
      bg.onerror = () => resolve("");
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
      const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);

      if (!currentTemplate) {
        setIsProcessing(false);
        return;
      }

      const frontTemplate = getCurrentTemplate(selectedLayer, false);

      if (!frontTemplate) {
        setIsProcessing(false);
        return;
      }

      const fulfillmentData = await getItem(
        "fulfillment",
        currentDesign.id,
        null
      );

      const frontImageKey = `compositeImage_${frontTemplate.templateId}_front`;
      const backImageKey = `compositeImage_${frontTemplate.templateId}_back`;
      const frontChildrenKey = `compositeCanvasChildren_${frontTemplate.templateId}_front`;
      const backChildrenKey = `compositeCanvasChildren_${frontTemplate.templateId}_back`;

      const [frontImage, backImage, frontChildren, backChildren]: any =
        await Promise.all([
          getItem(frontImageKey, "composite"),
          getItem(backImageKey, "composite").catch(() => null),
          getItem(frontChildrenKey, "composite").catch(() => []),
          getItem(backChildrenKey, "composite").catch(() => []),
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

      const { FULFILLERS } = await import("../../../lib/constants");
      const fulfiller_address = FULFILLERS[0]?.address || "";

      const colors: string[] = [];
      const fulfillmentDataAny = fulfillmentData as any;
      if (
        fulfillmentDataAny?.selectedColors &&
        Array.isArray(fulfillmentDataAny.selectedColors)
      ) {
        fulfillmentDataAny.selectedColors.forEach((color: any) => {
          if (color?.hex) {
            colors.push(color.hex);
          }
        });
      }

      const materials: Array<{ childId: string; childContract: string }> = [];
      if (
        fulfillmentDataAny?.selectedMaterials &&
        Array.isArray(fulfillmentDataAny.selectedMaterials)
      ) {
        fulfillmentDataAny.selectedMaterials.forEach((material: any) => {
          if (material?.childId && material?.childContract) {
            materials.push({
              childId: material.childId,
              childContract: material.childContract,
            });
          }
        });
      }

      const template_contract = currentTemplate?.templateContract || "";
      const template_id = currentTemplate?.templateId || "";

      const zone_children: Array<{
        image: string;
        location: "front" | "back";
      }> = [];

      try {
        const canvasHistory = await getItem("canvasHistory", "synth", []);
        if (canvasHistory && Array.isArray(canvasHistory)) {
          const zoneChildren =
            currentTemplate?.childReferences?.filter((child: any) =>
              child?.child?.metadata?.tags?.includes("zone")
            ) || [];

          for (const zoneChild of zoneChildren) {
            const childHistory = canvasHistory.find(
              (history: any) =>
                history.childUri === zoneChild.uri &&
                history.layerTemplateId === currentTemplate.templateId
            ) as any;

            if (childHistory?.thumbnail) {
              const tags = zoneChild?.child?.metadata?.tags || [];
              const location: "front" | "back" = tags.includes("back")
                ? "back"
                : "front";

              zone_children.push({
                image: childHistory.thumbnail,
                location,
              });
            }
          }
        }
      } catch (error: any) {
        console.error(error.message);
      }

      const sellData: SellData = {
        composite_front: composite_front as string,
        composite_back: composite_back as string | undefined,
        fulfiller_address,
        custom_fields: {
          colors,
          materials,
          template_contract,
          template_id,
          zone_children,
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
