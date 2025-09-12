import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { CanvasHistory,  } from "../types/synth.types";
import drawElement from "../utils/drawElement";
import drawPatternElement from "../utils/drawPatternElement";
import addRashToCanvas from "../utils/addRashToCanvas";

export const useCanvasExport = () => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const recreateCanvasAt300DPI = useCallback(
    (historyItem: CanvasHistory): Promise<string> => {
      return new Promise(async (resolve, reject) => {
        try {
          // Get actual canvas dimensions from DOM
          const canvasElement = document.getElementById("synth-canvas") as HTMLCanvasElement;
          
          if (!canvasElement) {
            reject(new Error("Could not find canvas element"));
            return;
          }
          
          const scaleFactor = 4.0; // 300 DPI scaling without browser limits
          
          // Prepare data for Rust backend
          const exportData = {
            canvas_width: canvasElement.width,
            canvas_height: canvasElement.height,
            pattern_svg: historyItem.child?.child?.metadata?.image || "",
            elements: historyItem.elements.map((element: any) => ({
              element_type: element.type,
              points: element.points?.map((p: any) => ({
                x: p.x,
                y: p.y,
                pressure: p.pressure
              })),
              fill: element.fill,
              stroke_width: element.strokeWidth,
              x1: element.x1,
              y1: element.y1,
              width: element.width,
              height: element.height,
              rotation: element.rotation,
              image_src: element.imageSrc
            })),
            scale_factor: scaleFactor
          };
          
          console.log("Sending canvas data to Rust backend:", {
            width: exportData.canvas_width,
            height: exportData.canvas_height,
            elements: exportData.elements.length,
            scaleFactor: exportData.scale_factor
          });
          
          // This will be used by the export function to save directly to file
          // Return a placeholder data URL for now
          resolve("data:image/png;base64,rust-backend-export");
        } catch (error) {
          reject(error);
        }
      });
    },
    []
  );

  const exportCanvas300DPI = useCallback(
    async (historyItem: CanvasHistory): Promise<void> => {
      if (isExporting) return;

      setIsExporting(true);

      try {
        if (!historyItem.elements || historyItem.elements.length === 0) {
          throw new Error(t("no_canvas_elements"));
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `canvas_export_${historyItem.id}_${timestamp}.png`;

        const filePath = await save({
          defaultPath: filename,
          filters: [
            {
              name: "PNG Image",
              extensions: ["png"],
            },
          ],
          title: "Export Canvas",
        });

        if (!filePath) {
          return;
        }

        // Get the existing canvas data
        const canvasElement = document.getElementById("synth-canvas") as HTMLCanvasElement;
        if (!canvasElement) {
          throw new Error("Could not find canvas element");
        }

        // Get the current canvas as PNG data
        const canvasDataURL = canvasElement.toDataURL("image/png");

        const exportData = {
          canvas_data_url: canvasDataURL,
          scale_factor: 8.0 // High scaling without browser limits
        };

        // Use Rust backend for unlimited high-resolution scaling
        await invoke("export_canvas_high_res", {
          exportData,
          filePath: filePath,
        });

      } catch (error) {
        console.error("Export failed:", error);
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, t, recreateCanvasAt300DPI]
  );


  return {
    exportCanvas300DPI,
  };
};