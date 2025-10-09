import { FunctionComponent, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GarmentSize, ExportDialogProps } from "../types/pattern.types";
import { useSvgExport } from "../hooks/useSvgExport";
import { HOODIE_FRONT_PANEL_DIMENSIONS, SHIRT_FRONT_PANEL_DIMENSIONS } from "../../../lib/constants";

export const ExportDialog: FunctionComponent<ExportDialogProps> = ({
  isOpen,
  onClose,
  svgElement,
  viewportPx,
  patternPieces,
  liveSvgContent,
  isManualMode,
  manualPieces,
}) => {
  const { t } = useTranslation();
  const { exportSvgToPdf } = useSvgExport();
  const [size, setSize] = useState<GarmentSize | "CUSTOM">("M");
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [customWidth, setCustomWidth] = useState<string>("34.8");
  const [customHeight, setCustomHeight] = useState<string>("65.8");
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const garmentType = useMemo(() => {
    return patternPieces?.[0]?.garmentType || "hoodie";
  }, [patternPieces]);

  const isShirt = garmentType === "tshirt";
  const dimensionTable = isShirt ? SHIRT_FRONT_PANEL_DIMENSIONS : HOODIE_FRONT_PANEL_DIMENSIONS;

  const handleCancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsExporting(false);
    setExportStatus(null);
    onClose();
  }, [abortController, onClose]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportStatus("Preparing export...");

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const customDimensions = size === "CUSTOM" ? {
        widthCm: parseFloat(customWidth),
        heightCm: parseFloat(customHeight)
      } : undefined;

      const result = await exportSvgToPdf(
        svgElement,
        viewportPx,
        size,
        patternPieces,
        liveSvgContent!,
        customDimensions,
        garmentType,
        isManualMode,
        manualPieces,
        controller.signal
      );

      if (controller.signal.aborted) {
        return;
      }

      if (result.success) {
        setExportStatus(`Export successful! File saved: ${result.filePath}`);
        setTimeout(() => {
          if (!controller.signal.aborted) {
            onClose();
            setExportStatus(null);
          }
        }, 2000);
      } else {
        setExportStatus(`Export failed: ${result.error}`);
        setTimeout(() => {
          if (!controller.signal.aborted) {
            setExportStatus(null);
          }
        }, 5000);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        if (error instanceof Error && error.name === 'AbortError') {
          setExportStatus("Export cancelled");
        } else {
          setExportStatus(`Export failed: ${error}`);
        }
        setTimeout(() => {
          if (!controller.signal.aborted) {
            setExportStatus(null);
          }
        }, 3000);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsExporting(false);
        setAbortController(null);
      }
    }
  }, [
    svgElement,
    viewportPx,
    size,
    exportSvgToPdf,
    onClose,
    patternPieces,
    liveSvgContent,
    customWidth,
    customHeight,
    garmentType,
    isManualMode,
    manualPieces,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="bg-oscuro border-2 border-azul rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-pixel text-xs">
            {t("export_to_print")}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-crema transition-colors text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-white font-agency text-xs mb-2">
              {isShirt ? t("shirt_size") : t("hoodie_size")}
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as GarmentSize)}
              className="w-full appearance-none bg-black text-white border border-crema rounded px-3 py-2 font-agency text-xs"
              style={{ backgroundImage: 'none' }}
            >
              {(Object.keys(dimensionTable) as Array<keyof typeof dimensionTable>).map((sizeKey) => {
                if (sizeKey === "CUSTOM") return null;
                const dims = dimensionTable[sizeKey];
                return (
                  <option key={sizeKey} value={sizeKey}>
                    {sizeKey} ({dims.widthCm} × {dims.heightCm} cm)
                  </option>
                );
              })}
              <option value="CUSTOM">{t("custom_size")}</option>
            </select>
          </div>

          {size === "CUSTOM" && (
            <div className="space-y-3">
              <label className="block text-white font-agency text-xs mb-2">
                {t("custom_front_panel_dimensions")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-crema font-agency text-xs mb-1">
                    {t("width_cm")}
                  </label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    min="10"
                    max="100"
                    step="0.1"
                    className="w-full bg-black text-white border border-crema rounded px-3 py-2 font-agency text-xs"
                    placeholder="34.8"
                  />
                </div>
                <div>
                  <label className="block text-crema font-agency text-xs mb-1">
                    {t("height_cm")}
                  </label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    min="10"
                    max="150"
                    step="0.1"
                    className="w-full bg-black text-white border border-crema rounded px-3 py-2 font-agency text-xs"
                    placeholder="65.8"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {exportStatus && (
          <div
            className={`mb-4 p-3 rounded font-agency text-xs ${
              exportStatus.includes("successful")
                ? "bg-black border border-crema text-white"
                : "bg-black border border-rosa text-white"
            }`}
          >
            {exportStatus}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={isExporting ? handleCancel : onClose}
            className="lowercase flex-1 px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-viol text-white hover:opacity-80"
            style={{ transform: "skewX(-15deg)" }}
          >
            <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
              {isExporting ? "Cancel Export" : t("cancel")}
            </span>
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !svgElement}
            className={`lowercase flex-1 px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul ${
              isExporting || !svgElement
                ? "bg-viol text-white/50 cursor-not-allowed"
                : "bg-white text-black hover:opacity-80"
            }`}
            style={{ transform: "skewX(-15deg)" }}
          >
            <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
              {isExporting ? t("exporting") : t("export")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
