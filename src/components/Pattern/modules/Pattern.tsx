import { FunctionComponent } from "react";
import { PatternLibrary } from "./PatternLibrary";
import { PackingCanvas } from "./PackingCanvas";
import { NestingSettingsPanel } from "./NestingSettings";
import { usePattern } from "../hooks/usePattern";
import { usePackingCanvas } from "../hooks/usePackingCanvas";
import PageNavigation from "../../Common/modules/PageNavigation";

const Pattern: FunctionComponent = () => {
  const {
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
    handleExportPattern,
    currentDesign,
    selectedTemplate
  } = usePattern();

  const { nestingSettings, setNestingSettings, isNesting, isSparrowRunning } = usePackingCanvas(selectedPieces, selectedSize);
  
  if (!currentDesign) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-4 bg-black">
        <div className="text-white font-mana">Loading design...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col p-4 bg-black overflow-x-hidden">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-satB text-white tracking-wider">
            SEWING PATTERNS
          </h2>
        </div>
        {currentDesign && (
          <p className="text-ama font-mana text-xxxs mb-2">
            Project: {currentDesign.name}
          </p>
        )}
      </div>
      {isApplicableTemplate() ? (
        <div className="flex-1 flex overflow-y-scroll overflow-x-hidden">
          <div className="w-80 flex-shrink-0 pr-4 flex flex-col gap-6">
            <PatternLibrary
              onSelectPieces={handleSelectPieces}
              onSizeChange={handleSizeChange}
            />
            <NestingSettingsPanel
              settings={nestingSettings}
              onSettingsChange={setNestingSettings}
              disabled={isNesting || isSparrowRunning}
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
