import { useState } from "react";
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

  const handleCoinOpMarket = async () => {
    if (!currentDesign || !selectedLayer || isProcessing) return;

    setIsProcessing(true);
    
    try {
      const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
      if (!currentTemplate) {
        setIsProcessing(false);
        return;
      }

      const frontCanvasKey = `compositeCanvasCapture_${currentTemplate.templateId}_front`;
      const backCanvasKey = `compositeCanvasCapture_${currentTemplate.templateId}_back`;
      
      const [composite_front, composite_back, fulfillmentData] = await Promise.all([
        getItem(frontCanvasKey, "composite"),
        getItem(backCanvasKey, "composite").catch(() => null),
        getItem("fulfillment", currentDesign.id, null),
      ]);

      if (!composite_front) {
        setIsProcessing(false);
        return;
      }

      const fulfiller_address = (fulfillmentData as any)?.selectedFulfiller?.address || "";

      const colors: string[] = [];
      const fulfillmentDataAny = fulfillmentData as any;
      if (fulfillmentDataAny?.selectedColors && Array.isArray(fulfillmentDataAny.selectedColors)) {
        fulfillmentDataAny.selectedColors.forEach((color: any) => {
          if (color?.hex) {
            colors.push(color.hex);
          }
        });
      }

      const materials: Array<{ childId: string; childContract: string }> = [];
      if (fulfillmentDataAny?.selectedMaterials && Array.isArray(fulfillmentDataAny.selectedMaterials)) {
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

      const zone_children: Array<{ image: string; location: "front" | "back" }> = [];
      
      try {
        const canvasHistory = await getItem("canvasHistory", "synth", []);
        if (canvasHistory && Array.isArray(canvasHistory)) {
          const zoneChildren = currentTemplate?.childReferences?.filter((child: any) => 
            child?.child?.metadata?.tags?.includes("zone")
          ) || [];

          for (const zoneChild of zoneChildren) {
            const childHistory = canvasHistory.find((history: any) => 
              history.childUri === zoneChild.uri && 
              history.layerTemplateId === currentTemplate.templateId
            ) as any;

            if (childHistory?.thumbnail) {
              const tags = zoneChild?.child?.metadata?.tags || [];
              const location: "front" | "back" = tags.includes("back") ? "back" : "front";
              
              zone_children.push({
                image: childHistory.thumbnail,
                location,
              });
            }
          }
        }
      } catch (error) {
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

      const fgoUrl = process.env.NODE_ENV === "production"
        ? "http://localhost:3001/sell"
        : "https://coinop.themanufactory.xyz/sell";

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
        const fallbackUrl = `${fgoUrl}/sell?data=${encodeURIComponent(JSON.stringify(sellData))}`;
        await openUrl(fallbackUrl);
      }
    } catch (error) {
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleCoinOpMarket,
    isProcessing,
  };
};