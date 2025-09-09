import { FunctionComponent, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PatternLibrary } from "./PatternLibrary";
import { PackingCanvas } from "./PackingCanvas";
import { NestingSettingsPanel } from "./NestingSettings";
import { usePattern } from "../hooks/usePattern";
import { usePackingCanvas } from "../hooks/usePackingCanvas";
import { PatternPiece } from "../types/pattern.types";
import { useApp } from "../../../context/AppContext";
import PageNavigation from "../../Common/modules/PageNavigation";

const Pattern: FunctionComponent = () => {
  const { t } = useTranslation();
  const { selectedLayer } = useApp();
  const [loadedPatterns, setLoadedPatterns] = useState<PatternPiece[]>([]);
  
  const {
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
  } = usePattern();

  const { nestingSettings, setNestingSettings, isNesting, isSparrowRunning } =
    usePackingCanvas(loadedPatterns);

  const getGarmentType = (): "tshirt" | "hoodie" | null => {
    if (!selectedLayer?.front?.metadata?.tags) return null;
    const tags = selectedLayer.front.metadata.tags;
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      if (tagLower === "t-shirt" || tagLower === "shirt") return "tshirt";
      if (tagLower === "hoodie") return "hoodie";
    }
    return null;
  };

  const loadSVGDimensionsFromData = async (
    svgData: string
  ): Promise<{ width: number; height: number }> => {
    try {
      let svgText = svgData;

      if (svgData.startsWith("ipfs://") || svgData.startsWith("Qm")) {
        const ipfsUrl = svgData.startsWith("ipfs://")
          ? `https://thedial.infura-ipfs.io/ipfs/${svgData.replace(
              "ipfs://",
              ""
            )}`
          : `https://thedial.infura-ipfs.io/ipfs/${svgData}`;
        const response = await fetch(ipfsUrl);
        if (response.ok) {
          svgText = await response.text();
        } else {
          return { width: 100, height: 100 };
        }
      }

      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      const svgElement = svgDoc.querySelector("svg");
      if (svgElement) {
        const viewBox = svgElement.getAttribute("viewBox");
        if (viewBox) {
          const [, , width, height] = viewBox.split(" ").map(Number);
          return { width, height };
        }
        const width = parseFloat(svgElement.getAttribute("width") || "0");
        const height = parseFloat(svgElement.getAttribute("height") || "0");
        return { width, height };
      }
    } catch (error) {}
    return { width: 100, height: 100 };
  };

  const loadActualPatterns = async (garmentType: "tshirt" | "hoodie") => {
    if (!selectedLayer) {
      setLoadedPatterns([]);
      return;
    }

    try {
      const loadedPieces: PatternPiece[] = [];
      const seenPatterns = new Set<string>();

      const templatesWithPatterns = [
        selectedLayer.front,
        selectedLayer.back,
      ].filter(Boolean);

      for (const template of templatesWithPatterns) {
        if (!template?.childReferences) continue;

        const patternChildren = template.childReferences.filter((child: any) =>
          child.child?.metadata?.tags?.includes("pattern")
        );

        for (const child of patternChildren) {
          if (!child.child?.metadata?.image || !child.child?.metadata?.title)
            continue;

          const patternKey = `${child.child.metadata.title}-${child.child.metadata.image}`;
          if (seenPatterns.has(patternKey)) continue;
          seenPatterns.add(patternKey);

          const svgData = child.child.metadata.image;
          const dimensions = await loadSVGDimensionsFromData(svgData);
          const quantity = child.amount || 1;

          const piece: PatternPiece = {
            id:
              child.childId || `${child.child.metadata.title}-${Math.random()}`,
            name: child.child.metadata.title,
            garmentType,
            instructions: child.metadata.instructions,
            svgPath: svgData,
            widthMM: dimensions.width,
            heightMM: dimensions.height,
            seamAllowanceMM: child.metadata.seamAllowance,
            quantity,
          };
          loadedPieces.push(piece);
        }
      }

      setLoadedPatterns(loadedPieces);
    } catch (error) {
      setLoadedPatterns([]);
    }
  };

  useEffect(() => {
    const garmentType = getGarmentType();
    if (garmentType && selectedLayer) {
      loadActualPatterns(garmentType);
    }
  }, [selectedLayer]);

  if (!currentDesign) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-4 bg-black">
        <div className="text-white font-mana">{t("loading_design")}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col p-4 bg-black overflow-x-hidden">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-satB text-white tracking-wider">
            {t("sewing_patterns")}
          </h2>
        </div>
        {currentDesign && (
          <p className="text-ama font-mana text-xxxs mb-2">
            {t("project")}: {currentDesign.name}
          </p>
        )}
      </div>
      {isApplicableTemplate() ? (
        <div className="flex-1 flex overflow-y-scroll overflow-x-hidden">
          <div className="w-80 flex-shrink-0 pr-4 flex flex-col gap-6">
            <PatternLibrary />
            <NestingSettingsPanel
              settings={nestingSettings}
              onSettingsChange={setNestingSettings}
              disabled={isNesting || isSparrowRunning}
            />
          </div>
          <div className="flex-1 min-w-0 overflow-x-hidden">
            <PackingCanvas selectedPieces={loadedPatterns} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center w-full h-full max-w-4xl">
            <div className="text-white/50 text-center">
              <div className="text-lg mb-4">{t("pattern_not_applicable")}</div>
              <div className="text-sm mb-2">
                {t("sewing_patterns_apparel_only")}
              </div>
              <div className="text-xs text-white/30">
                {t("current_template")}:{" "}
                <span className="text-ama">{selectedTemplate?.name}</span> (
                {selectedTemplate?.template_type})
              </div>
              <div className="text-xs text-white/30 mt-2">
                {t("switch_to_apparel")}
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
              {t("export_sewing_pattern")}
            </h3>
            <div className="space-y-4">
              <p className="text-white/70 text-xs">
                {t("choose_format_production")}
              </p>
              <div className="space-y-2">
                <div className="px-4 py-3 bg-verde/20 hover:bg-verde/30 border border-verde/50 rounded cursor-pointer text-white text-xs font-mana">
                  <div className="font-bold">
                    {t("professional_pdf_pattern")}
                  </div>
                  <div className="text-xs text-white/60">
                    {t("basic_pattern_info")}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <div
                  onClick={() => setShowSewingExportDialog(false)}
                  className="px-4 py-2 bg-gris hover:opacity-70 text-white rounded font-mana text-xxxs cursor-pointer"
                >
                  {t("cancel")}
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
              {t("export_design_pattern")}
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
                  {t("cancel")}
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
                  {isExporting ? t("exporting") : t("export")}
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
