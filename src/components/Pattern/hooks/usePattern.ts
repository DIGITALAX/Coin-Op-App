import { useState, useCallback } from "react";
import { useDesignContext } from "../../../context/DesignContext";
import { useApp } from "../../../context/AppContext";
import { usePatternExport } from "../../Synth/hooks/usePatternExport";
import { useInteractiveCanvasCapture } from "../../Synth/hooks/useInteractiveCanvasCapture";

export const usePattern = () => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSewingExportDialog, setShowSewingExportDialog] = useState(false);
  
  const { currentDesign } = useDesignContext();
  const { selectedTemplate } = useApp();
  const { exportPatternSet, isExporting, exportProgress } = usePatternExport();
  const { captureInteractiveCanvasAt300DPI } = useInteractiveCanvasCapture();

  const isApplicableTemplate = useCallback(() => {
    return (
      selectedTemplate?.template_type === "shirt" || selectedTemplate?.template_type === "hoodie"
    );
  }, [selectedTemplate]);


  const handleExportPattern = useCallback(async () => {
    if (!captureInteractiveCanvasAt300DPI) return;
    try {
      const frontCanvasDataUrl = await captureInteractiveCanvasAt300DPI(3);
      if (frontCanvasDataUrl) {
        const baseName = currentDesign?.name || "pattern";
        await exportPatternSet(frontCanvasDataUrl, null, baseName, {
          widthInches: 8,
          heightInches: 10,
          dpi: 300,
        });
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
    selectedTemplate
  };
};