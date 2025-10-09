import { useState, useCallback } from "react";
import { useDesignContext } from "../../../context/DesignContext";
import { useApp } from "../../../context/AppContext";
import { usePatternExport } from "../../Synth/hooks/usePatternExport";
import { getCurrentTemplate } from "../../Synth/utils/templateHelpers";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { INFURA_GATEWAY } from "../../../lib/constants";

export const usePattern = () => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSewingExportDialog, setShowSewingExportDialog] = useState(false);

  const { currentDesign } = useDesignContext();
  const { selectedTemplate } = useApp();
  const { exportPatternSet, isExporting, exportProgress } = usePatternExport();
  const { selectedLayer, isBackSide } = useApp();
  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const { getItem } = useDesignStorage();
  const captureInteractiveCanvasAt300DPI = useCallback(
    async (bleedMM: number = 3): Promise<string | null> => {
      if (!selectedLayer) return null;
      try {
        const dpi = 300;
        const scaleFactor = dpi / 72;
        const mmToPixels = (dpi / 25.4) * scaleFactor;
        const bleedPixels = bleedMM * mmToPixels;
        const baseUri = currentTemplate?.metadata.image;
        const fullUrl = baseUri?.startsWith("ipfs://")
          ? `${INFURA_GATEWAY}/ipfs/${baseUri.replace("ipfs://", "")}`
          : baseUri;
        const response = await fetch(fullUrl!);
        const svgText = await response.text();
        const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
        const svgUrl = URL.createObjectURL(svgBlob);
        const baseImg = new Image();
        await new Promise((resolve, reject) => {
          baseImg.onload = resolve;
          baseImg.onerror = reject;
          baseImg.src = svgUrl;
        });
        const canvas = document.createElement("canvas");
        canvas.width = baseImg.naturalWidth * scaleFactor + bleedPixels * 2;
        canvas.height = baseImg.naturalHeight * scaleFactor + bleedPixels * 2;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        const baseScaledWidth = baseImg.naturalWidth * scaleFactor;
        const baseScaledHeight = baseImg.naturalHeight * scaleFactor;
        ctx.drawImage(
          baseImg,
          bleedPixels,
          bleedPixels,
          baseScaledWidth,
          baseScaledHeight
        );
        URL.revokeObjectURL(svgUrl);
        const childrenWithCoordinates = currentTemplate?.childReferences.filter(
          (child: any) => child.coordinates
        )!;
        for (const child of childrenWithCoordinates) {
          const childUri = child.child.metadata.image;
          const fullChildUrl = childUri?.startsWith("ipfs://")
            ? `${INFURA_GATEWAY}/ipfs/${childUri.replace("ipfs://", "")}`
            : childUri;
          const childResponse = await fetch(fullChildUrl);
          const childSvgText = await childResponse.text();
          const childSvgBlob = new Blob([childSvgText], {
            type: "image/svg+xml",
          });
          const childSvgUrl = URL.createObjectURL(childSvgBlob);
          const childImg = new Image();
          await new Promise((resolve, reject) => {
            childImg.onload = resolve;
            childImg.onerror = reject;
            childImg.src = childSvgUrl;
          });
          const baseSizeMM = currentTemplate?.childReferences.find(
            (ref) => ref.metadata?.ratio
          )?.metadata?.ratio!;
          const mmToPixelsRatio = baseScaledWidth / baseSizeMM;
          const childX = child.metadata.x * mmToPixelsRatio + bleedPixels;
          const childY = child.metadata.y * mmToPixelsRatio + bleedPixels;
          const childWidth = childImg.naturalWidth * scaleFactor;
          const childHeight = childImg.naturalHeight * scaleFactor;
          ctx.drawImage(childImg, childX, childY, childWidth, childHeight);
          URL.revokeObjectURL(childSvgUrl);
        }
        const dataUrl = canvas.toDataURL("image/png");
        canvas.remove();
        return dataUrl;
      } catch (error) {
        return null;
      }
    },
    [selectedLayer, getItem]
  );

  const isApplicableTemplate = useCallback(() => {
    return (
      selectedTemplate?.template_type === "shirt" ||
      selectedTemplate?.template_type === "hoodie"
    );
  }, [selectedTemplate]);

  const handleExportPattern = useCallback(async () => {
    if (!captureInteractiveCanvasAt300DPI) return;
    try {
      const frontCanvasDataUrl = await captureInteractiveCanvasAt300DPI(3);
      if (frontCanvasDataUrl) {
        const baseName = currentDesign?.name || "pattern";
        await exportPatternSet(frontCanvasDataUrl, null, baseName);
        setShowExportDialog(false);
      }
    } catch (error) {}
  }, [captureInteractiveCanvasAt300DPI, currentDesign, exportPatternSet]);

  return {
    showExportDialog,
    showSewingExportDialog,
    setShowExportDialog,
    setShowSewingExportDialog,
    isExporting,
    exportProgress,
    isApplicableTemplate,
    handleExportPattern,
    currentDesign,
    selectedTemplate,
  };
};
