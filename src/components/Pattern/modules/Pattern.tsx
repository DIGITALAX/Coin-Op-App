import { useState, useCallback, FunctionComponent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { PatternLibrary } from "./PatternLibrary";
import { PackingCanvas } from "./PackingCanvas";
import { usePatternExport } from "../../Synth/hooks/usePatternExport";
import { useInteractiveCanvasCapture } from "../../Synth/hooks/useInteractiveCanvasCapture";
import { useDesignContext } from "../../../context/DesignContext";
import { useApp } from "../../../context/AppContext";
import PageNavigation from "../../Common/modules/PageNavigation";
import { PatternPiece, Size } from "../types/pattern.types";
const Pattern: FunctionComponent = () => {
  const [selectedPieces, setSelectedPieces] = useState<PatternPiece[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSewingExportDialog, setShowSewingExportDialog] = useState(false);
  const [selectedSize, setSelectedSize] = useState<Size>("M");
  const { currentDesign } = useDesignContext();
  const { selectedTemplate } = useApp();
  const { exportPatternSet, isExporting, exportProgress } = usePatternExport();
  const { captureInteractiveCanvasAt300DPI } = useInteractiveCanvasCapture();
  const isApplicableTemplate = () => {
    return (
      selectedTemplate?.template_type === "shirt" || selectedTemplate?.template_type === "hoodie"
    );
  };

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

  const handleSewingPatternExport = async () => {
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
  };
  const handleExportPattern = async () => {
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
  };
  return (
    <div className="relative w-full h-full flex flex-col p-4 bg-black overflow-x-hidden">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-satB text-white tracking-wider">
            SEWING PATTERNS
          </h2>
          <div className="flex gap-3">
            <div
              onClick={() => setShowSewingExportDialog(true)}
              className="px-4 py-2 bg-ama hover:opacity-70 text-black rounded font-mana text-xs cursor-pointer"
            >
              EXPORT TO SEW
            </div>
            <div
              onClick={() => setShowExportDialog(true)}
              className="px-4 py-2 bg-gris hover:opacity-70 text-white rounded font-mana text-xs cursor-pointer"
            >
              EXPORT TO PRINT
            </div>
          </div>
        </div>
        {currentDesign && (
          <p className="text-ama font-mana text-xxxs mb-2">
            Project: {currentDesign.name}
          </p>
        )}
      </div>
      {isApplicableTemplate() ? (
        <div className="flex-1 flex overflow-y-scroll overflow-x-hidden">
          <div className="w-80 flex-shrink-0 pr-4">
            <PatternLibrary
              onSelectPieces={handleSelectPieces}
              onSizeChange={handleSizeChange}
              templateType={selectedTemplate?.template_type as "shirt" | "hoodie"}
            />
          </div>
          <div className="flex-1 min-w-0 overflow-x-hidden">
            <PackingCanvas
              selectedPieces={selectedPieces}
              selectedSize={selectedSize}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center w-full h-full max-w-4xl">
            <div className="text-white/50 text-center">
              <div className="text-lg mb-4">Pattern Not Applicable</div>
              <div className="text-sm mb-2">
                Sewing patterns are only available for apparel templates.
              </div>
              <div className="text-xs text-white/30">
                Current template:{" "}
                <span className="text-ama">{selectedTemplate?.name}</span> (
                {selectedTemplate?.template_type})
              </div>
              <div className="text-xs text-white/30 mt-2">
                Switch to T-Shirt or Hoodie template to use this feature.
              </div>
            </div>
          </div>
        </div>
      )}
      <PageNavigation currentPage="/Pattern" />
      {showSewingExportDialog && (
        
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-oscuro border border-ama rounded-lg p-6 max-w-md">
            <h3 className="text-white font-mana text-sm mb-4">
              Export Sewing Pattern
            </h3>
            <div className="space-y-4">
              <p className="text-white/70 text-xs">
                Choose format for production sewing patterns:
              </p>
              <div className="space-y-2">
                <div
                  onClick={() => handleSewingPatternExport()}
                  className="px-4 py-3 bg-verde/20 hover:bg-verde/30 border border-verde/50 rounded cursor-pointer text-white text-xs font-mana"
                >
                  <div className="font-bold">
                    Professional PDF Pattern (Step 1)
                  </div>
                  <div className="text-xs text-white/60">
                    Basic pattern info and sizing - multi-page tiling coming
                    next
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <div
                  onClick={() => setShowSewingExportDialog(false)}
                  className="px-4 py-2 bg-gris hover:opacity-70 text-white rounded font-mana text-xxxs cursor-pointer"
                >
                  CANCEL
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-oscuro border border-ama rounded-lg p-6 max-w-md">
            <h3 className="text-white font-mana text-sm mb-4">
              Export Design Pattern
            </h3>
            <div className="space-y-4">
              {isExporting && (
                <p className="text-ama font-mana text-xxxs animate-pulse">
                  {exportProgress}
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <div
                  onClick={() => setShowExportDialog(false)}
                  className="px-4 py-2 bg-gris hover:opacity-70 text-white rounded font-mana text-xxxs cursor-pointer"
                >
                  CANCEL
                </div>
                <div
                  onClick={handleExportPattern}
                  className={`px-4 py-2 rounded font-mana text-xxxs cursor-pointer ${
                    isExporting
                      ? "bg-gris/40 text-white/50 cursor-not-allowed"
                      : "bg-ama hover:opacity-70 text-black"
                  }`}
                  style={{ pointerEvents: isExporting ? "none" : "auto" }}
                >
                  {isExporting ? "EXPORTING..." : "EXPORT"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Pattern;
