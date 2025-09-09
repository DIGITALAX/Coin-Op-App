import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { ExportOptions } from "../types/synth.types";

export const usePatternExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const exportPattern = async (
    canvasDataUrl: string,
    options: ExportOptions,
    fileName: string,
    folderPath: string
  ) => {
    try {
      setExportProgress(`Exporting at ${options.dpi} DPI...`);
      const filePath = `${folderPath}/${fileName}`;
      const result = await invoke("export_pattern_to_pdf", {
        imageData: canvasDataUrl,
        filePath,
        widthInches: options.widthInches,
        heightInches: options.heightInches,
        dpi: options.dpi,
      });
      return result;
    } catch (error) {
      throw error;
    }
  };
  const exportPatternSet = async (
    frontCanvasDataUrl: string,
    backCanvasDataUrl: string | null,
    baseName: string,
    options: ExportOptions
  ) => {
    try {
      setIsExporting(true);
      setExportProgress("Select folder for export...");
      const folderPath = await open({
        directory: true,
        multiple: false,
        title: "Select Export Folder",
      });
      if (!folderPath) {
        setIsExporting(false);
        return [];
      }
      const results = [];

      results.push(
        await exportPattern(
          frontCanvasDataUrl,
          options,
          `${baseName}_front.pdf`,
          folderPath
        )
      );
      if (backCanvasDataUrl) {
        results.push(
          await exportPattern(
            backCanvasDataUrl,
            options,
            `${baseName}_back.pdf`,
            folderPath
          )
        );
      }
      setExportProgress("");
      return results;
    } catch (error) {
      throw error;
    } finally {
      setIsExporting(false);
    }
  };
  return {
    exportPattern,
    exportPatternSet,
    isExporting,
    exportProgress,
  };
};
