import { Template } from "../../Format/types/format.types";
import { ChildCanvasData, CompositeImages } from "../types/composite.types";


export const collectCompositeImages = async (
  templateId: string,
  getItem: (key: string, category: string) => Promise<any>
): Promise<CompositeImages> => {
  const compositeImages: CompositeImages = {};
  try {
    const frontCanvasKey = `compositeCanvasCapture_${templateId}_front`;
    const backCanvasKey = `compositeCanvasCapture_${templateId}_back`;
    const [frontCanvas, backCanvas] = await Promise.all([
      getItem(frontCanvasKey, "composite").catch(() => null),
      getItem(backCanvasKey, "composite").catch(() => null),
    ]);
    if (frontCanvas && typeof frontCanvas === "string") {
      compositeImages.front = frontCanvas;
    }
    if (backCanvas && typeof backCanvas === "string") {
      compositeImages.back = backCanvas;
    }
    if (!compositeImages.front) {
      const frontBgKey = `compositeImage_${templateId}_front`;
      const frontBg = await getItem(frontBgKey, "composite").catch(() => null);
      if (frontBg && typeof frontBg === "string") {
        compositeImages.front = frontBg;
      }
    }
    if (!compositeImages.back) {
      const backBgKey = `compositeImage_${templateId}_back`;
      const backBg = await getItem(backBgKey, "composite").catch(() => null);
      if (backBg && typeof backBg === "string") {
        compositeImages.back = backBg;
      }
    }
  } catch (error) {
  }
  return compositeImages;
};
export const collectChildrenCanvasData = async (
  layer: Template,
  getItem: (key: string, category: string, defaultValue?: any) => Promise<any>
): Promise<ChildCanvasData[]> => {
  const childrenData: ChildCanvasData[] = [];
  try {
    const canvasHistory = await getItem("canvasHistory", "synth", []);
    if (canvasHistory && Array.isArray(canvasHistory)) {
      const layerHistoryItems = canvasHistory.filter((item: any) => {
        return (
          item.layerTemplateId === layer.templateId &&
          item.thumbnail &&
          item.thumbnail.startsWith("data:")
        );
      });
      layerHistoryItems.forEach((item: any) => {
        const childData: ChildCanvasData = {
          uri: item.thumbnail,
          canvasData: item.thumbnail,
          originalUri: item.childUri,
          child: item.child,
        };
        childrenData.push(childData);
      });
    }
  } catch (error) {
  }
  return childrenData;
};
