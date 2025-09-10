import { FunctionComponent, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { HoodieSize, ExportDialogProps } from "../types/pattern.types";
import { useSvgExport } from "../hooks/useSvgExport";

export const ExportDialog: FunctionComponent<ExportDialogProps> = ({
  isOpen,
  onClose,
  svgElement,
  viewportPx,
  patternPieces,
  liveSvgContent,
}) => {
  const { t } = useTranslation();
  const { exportSvgToPdf } = useSvgExport();
  const [size, setSize] = useState<HoodieSize>("M");
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportStatus("Preparing export...");

    try {
      const result = await exportSvgToPdf(
        svgElement,
        viewportPx,
        size,
        patternPieces,
        liveSvgContent
      );

      if (result.success) {
        setExportStatus(`Export successful! File saved: ${result.filePath}`);
        setTimeout(() => {
          onClose();
          setExportStatus(null);
        }, 2000);
      } else {
        setExportStatus(`Export failed: ${result.error}`);
        setTimeout(() => setExportStatus(null), 5000);
      }
    } catch (error) {
      setExportStatus(`Export failed: ${error}`);
      setTimeout(() => setExportStatus(null), 5000);
    } finally {
      setIsExporting(false);
    }
  }, [
    svgElement,
    viewportPx,
    size,
    exportSvgToPdf,
    onClose,
    patternPieces,
    liveSvgContent,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-ama rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-satB text-lg">
            {t("export_to_print")}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-ama transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-white font-mana text-xs mb-2">
              Hoodie Size
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as HoodieSize)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 font-mana text-sm"
            >
              <option value="XXS">XXS (31.2 × 61.0 cm)</option>
              <option value="XS">XS (32.4 × 62.6 cm)</option>
              <option value="S">S (33.6 × 64.2 cm)</option>
              <option value="M">M (34.8 × 65.8 cm)</option>
              <option value="L">L (36.0 × 67.4 cm)</option>
              <option value="XL">XL (37.2 × 69.0 cm)</option>
              <option value="XXL">XXL (38.4 × 70.6 cm)</option>
              <option value="3XL">3XL (39.6 × 72.2 cm)</option>
              <option value="4XL">4XL (40.8 × 73.8 cm)</option>
              <option value="5XL">5XL (40.2 × 79.4 cm)</option>
            </select>
          </div>
        </div>

        {exportStatus && (
          <div
            className={`mb-4 p-3 rounded font-mana text-xs ${
              exportStatus.includes("successful")
                ? "bg-verde/20 border border-verde/50 text-verde"
                : "bg-red-500/20 border border-red-500/50 text-red-300"
            }`}
          >
            {exportStatus}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-mana text-sm rounded transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !svgElement}
            className={`flex-1 px-4 py-2 rounded font-mana text-sm transition-colors ${
              isExporting || !svgElement
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-ama hover:bg-ama/90 text-black"
            }`}
          >
            {isExporting ? t("exporting") : t("export")}
          </button>
        </div>
      </div>
    </div>
  );
};
