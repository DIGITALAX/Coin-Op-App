import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { ExportOptions } from "../types/synth.types";

export const usePatternExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const exportPattern = async (
    canvasDataUrl: string,
    format: "tiff" | "pdf",
    options: ExportOptions,
    fileName: string,
    folderPath: string
  ) => {
    try {
      setExportProgress(`Exporting ${format.toUpperCase()} at ${options.dpi} DPI...`);
      const filePath = `${folderPath}/${fileName}`;
      const command = format === "tiff" 
        ? "export_pattern_to_tiff"
        : "export_pattern_to_pdf";
      const result = await invoke(command, {
        imageData: canvasDataUrl,
        filePath,
        widthInches: options.widthInches,
        heightInches: options.heightInches,
        dpi: options.dpi
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
        title: "Select Export Folder"
      });
      if (!folderPath) {
        setIsExporting(false);
        return [];
      }
      const results = [];
      results.push(
        await exportPattern(
          frontCanvasDataUrl,
          "tiff",
          options,
          `${baseName}_front.tiff`,
          folderPath
        )
      );
      results.push(
        await exportPattern(
          frontCanvasDataUrl,
          "pdf",
          options,
          `${baseName}_front.pdf`,
          folderPath
        )
      );
      if (backCanvasDataUrl) {
        results.push(
          await exportPattern(
            backCanvasDataUrl,
            "tiff",
            options,
            `${baseName}_back.tiff`,
            folderPath
          )
        );
        results.push(
          await exportPattern(
            backCanvasDataUrl,
            "pdf",
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
    exportProgress
  };
};