import { FunctionComponent, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { 
  PaperSize, 
  Orientation, 
  SizePreset, 
  HoodieSize,
  ViewportPx,
  ISO_PAPER_SIZES_MM,
  HOODIE_FRONT_PANEL_DIMENSIONS,
  PatternPiece
} from "../types/pattern.types";
import { useSvgExport } from "../hooks/useSvgExport";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  svgElement: SVGSVGElement | null;
  viewportPx: ViewportPx;
  patternPieces: PatternPiece[];
  liveSvgContent?: string;
}

interface ExportSettings {
  hoodieSize: HoodieSize;
  paper: PaperSize;
  orientation: Orientation;
  marginMm: number;
  overlapMm: number;
  includeCropMarks: boolean;
}

const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  hoodieSize: "M",
  paper: "A4",
  orientation: "portrait",
  marginMm: 10,
  overlapMm: 5,
  includeCropMarks: true,
};

export const ExportDialog: FunctionComponent<ExportDialogProps> = ({
  isOpen,
  onClose,
  svgElement,
  viewportPx,
  patternPieces,
  liveSvgContent,
}) => {
  const { t } = useTranslation();
  const { exportSvgToPdf, getEstimatedPageCount } = useSvgExport();
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleSettingChange = useCallback(<K extends keyof ExportSettings>(
    key: K,
    value: ExportSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportStatus("Preparing export...");

    try {
      const exportOptions = {
        sizePreset: "M" as SizePreset,
        ...settings,
      };
      const result = await exportSvgToPdf(svgElement, viewportPx, exportOptions, patternPieces, liveSvgContent);
      
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
  }, [svgElement, viewportPx, settings, exportSvgToPdf, onClose, patternPieces, liveSvgContent]);

  const estimatedPages = getEstimatedPageCount(viewportPx, {
    sizePreset: "M",
    paper: settings.paper,
    orientation: settings.orientation,
    marginMm: settings.marginMm,
    overlapMm: settings.overlapMm,
    includeCropMarks: settings.includeCropMarks,
  });
  
  const paperInfo = ISO_PAPER_SIZES_MM[settings.paper];
  const paperDimensions = settings.orientation === "portrait" 
    ? `${paperInfo.width} × ${paperInfo.height}mm`
    : `${paperInfo.height} × ${paperInfo.width}mm`;

  const hoodieDimensions = HOODIE_FRONT_PANEL_DIMENSIONS[settings.hoodieSize];
  const scaleFromXXS = hoodieDimensions.widthCm / HOODIE_FRONT_PANEL_DIMENSIONS.XXS.widthCm;

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
              value={settings.hoodieSize}
              onChange={(e) => handleSettingChange("hoodieSize", e.target.value as HoodieSize)}
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

          <div>
            <label className="block text-white font-mana text-xs mb-2">
              Paper Size
            </label>
            <select
              value={settings.paper}
              onChange={(e) => handleSettingChange("paper", e.target.value as PaperSize)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 font-mana text-sm"
            >
              <option value="A4">A4 (210 × 297mm)</option>
              <option value="A3">A3 (297 × 420mm)</option>
              <option value="A2">A2 (420 × 594mm)</option>
              <option value="A1">A1 (594 × 841mm)</option>
              <option value="A0">A0 (841 × 1189mm)</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-mana text-xs mb-2">
              Orientation
            </label>
            <select
              value={settings.orientation}
              onChange={(e) => handleSettingChange("orientation", e.target.value as Orientation)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 font-mana text-sm"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-mana text-xs mb-2">
                Margin (mm)
              </label>
              <input
                type="number"
                min="5"
                max="50"
                step="1"
                value={settings.marginMm}
                onChange={(e) => handleSettingChange("marginMm", parseFloat(e.target.value))}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 font-mana text-sm"
              />
            </div>
            
            <div>
              <label className="block text-white font-mana text-xs mb-2">
                Overlap (mm)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="1"
                value={settings.overlapMm}
                onChange={(e) => handleSettingChange("overlapMm", parseFloat(e.target.value))}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 font-mana text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="cropMarks"
              checked={settings.includeCropMarks}
              onChange={(e) => handleSettingChange("includeCropMarks", e.target.checked)}
              className="rounded"
            />
            <label htmlFor="cropMarks" className="text-white font-mana text-xs">
              Include crop marks
            </label>
          </div>
        </div>

        <div className="bg-gray-800 rounded p-4 mb-6">
          <h3 className="text-ama font-mana text-xs mb-2">Export Preview</h3>
          <div className="space-y-1 text-white/70 font-mana text-xxs">
            <div>Paper: {paperDimensions}</div>
            <div>Hoodie Size: {settings.hoodieSize} ({hoodieDimensions.widthCm} × {hoodieDimensions.heightCm} cm)</div>
            <div>Scale Factor: {scaleFromXXS.toFixed(2)}x from XXS</div>
            <div>Estimated pages: {estimatedPages}</div>
            <div>Canvas: {viewportPx.width} × {viewportPx.height}px</div>
          </div>
        </div>

        {exportStatus && (
          <div className={`mb-4 p-3 rounded font-mana text-xs ${
            exportStatus.includes("successful") 
              ? "bg-verde/20 border border-verde/50 text-verde"
              : "bg-red-500/20 border border-red-500/50 text-red-300"
          }`}>
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