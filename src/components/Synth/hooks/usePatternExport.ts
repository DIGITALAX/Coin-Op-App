import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export const usePatternExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const exportPattern = async (
    canvasDataUrl: string,
    fileName: string,
    folderPath: string
  ) => {
    try {
      setExportProgress(`Exporting...`);
      const filePath = `${folderPath}/${fileName}`;
      const result = await invoke("export_pattern_to_pdf", {
        imageData: canvasDataUrl,
        filePath,
      });
      return result;
    } catch (error) {
      throw error;
    }
  };
  const exportPatternSet = async (
    frontCanvasDataUrl: string,
    backCanvasDataUrl: string | null,
    baseName: string
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
          `${baseName}_front.pdf`,
          folderPath
        )
      );
      if (backCanvasDataUrl) {
        results.push(
          await exportPattern(
            backCanvasDataUrl,
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
