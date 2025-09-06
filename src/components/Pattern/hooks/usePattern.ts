import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useDesignContext } from "../../../context/DesignContext";
import { useApp } from "../../../context/AppContext";
import { usePatternExport } from "../../Synth/hooks/usePatternExport";
import { useInteractiveCanvasCapture } from "../../Synth/hooks/useInteractiveCanvasCapture";
import { PatternPiece, Size } from "../types/pattern.types";

export const usePattern = () => {
  const [selectedPieces, setSelectedPieces] = useState<PatternPiece[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSewingExportDialog, setShowSewingExportDialog] = useState(false);
  const [selectedSize, setSelectedSize] = useState<Size>("M");
  
  const { currentDesign } = useDesignContext();
  const { selectedTemplate } = useApp();
  const { exportPatternSet, isExporting, exportProgress } = usePatternExport();
  const { captureInteractiveCanvasAt300DPI } = useInteractiveCanvasCapture();

  const isApplicableTemplate = useCallback(() => {
    return (
      selectedTemplate?.template_type === "shirt" || selectedTemplate?.template_type === "hoodie"
    );
  }, [selectedTemplate]);

  const handleSelectPieces = useCallback(
    (pieces: PatternPiece[], size: Size) => {
      setSelectedPieces(pieces);
      setSelectedSize(size);
    },
    []
  );

  const handleSizeChange = useCallback((pieces: PatternPiece[], size: Size) => {
    setSelectedPieces(pieces);
    setSelectedSize(size);
  }, []);

  const handleSewingPatternExport = useCallback(async () => {
    if (!selectedPieces.length) return;
    const garmentType = selectedTemplate?.template_type === "shirt" ? "tshirt" : "hoodie";
    const projectName = currentDesign?.name || "pattern";
    const pieces = selectedPieces.map((piece) => piece.name);
    try {
      const result = await invoke<string>("export_professional_pattern", {
        request: {
          garment_type: garmentType,
          size: selectedSize,
          pieces: pieces,
          project_name: projectName,
          seam_allowance_mm: 10.0,
        },
      });
      alert(result);
      setShowSewingExportDialog(false);
    } catch (error) {
      alert(`Export failed: ${error}`);
    }
  }, [selectedPieces, selectedTemplate, currentDesign, selectedSize]);

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
    selectedPieces,
    selectedSize,
    showExportDialog,
    showSewingExportDialog,
    setShowExportDialog,
    setShowSewingExportDialog,
    isExporting,
    exportProgress,
    isApplicableTemplate,
    handleSelectPieces,
    handleSizeChange,
    handleSewingPatternExport,
    handleExportPattern,
    currentDesign,
    selectedTemplate
  };
};