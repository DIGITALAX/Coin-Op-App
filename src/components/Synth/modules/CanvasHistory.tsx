import { useState, useEffect, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import {
  CanvasHistoryProps,
  CanvasHistory as CanvasHistoryType,
} from "./../types/synth.types";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useApp } from "../../../context/AppContext";
import { useDesignContext } from "../../../context/DesignContext";
export const CanvasHistory = ({ onHistoryLoad }: CanvasHistoryProps) => {
  const { t } = useTranslation();
  const { getItem, setItem } = useDesignStorage();
  const { selectedTemplate, isBackSide } = useApp();
  const { currentDesign } = useDesignContext();
  const [canvasHistory, setCanvasHistory] = useState<CanvasHistoryType[]>([]);
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = (await getItem("canvasHistory")) || [];
        if (Array.isArray(history)) {
          setCanvasHistory(history);
        } else {
          setCanvasHistory([]);
        }
      } catch (error) {
        setCanvasHistory([]);
      }
    };
    loadHistory();
    const interval = setInterval(loadHistory, 1000);
    return () => clearInterval(interval);
  }, [getItem, currentDesign?.id]);
  const downloadThumbnail = async (
    historyItem: CanvasHistoryType,
    e: MouseEvent
  ) => {
    e.stopPropagation();

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `canvas_thumbnail_${historyItem.id}_${timestamp}.png`;

      const filePath = await save({
        defaultPath: filename,
        filters: [
          {
            name: "PNG Image",
            extensions: ["png"],
          },
        ],
        title: "Save Canvas Thumbnail",
      });

      if (!filePath) {
        return;
      }

      await invoke("write_image_file", {
        imageData: historyItem.thumbnail,
        filePath: filePath,
      });
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const deleteFromHistory = async (historyId: string, e: MouseEvent) => {
    e.stopPropagation();
    const deletedItem = canvasHistory.find((item) => item.id === historyId);
    const updatedHistory = canvasHistory.filter(
      (item) => item.id !== historyId
    );
    setCanvasHistory(updatedHistory);
    await setItem("canvasHistory", updatedHistory);
    if (deletedItem) {
      const interactiveCanvasKey = `interactiveCanvas_${currentDesign?.id}_${
        isBackSide ? "back" : "front"
      }`;
      const saved = await getItem(interactiveCanvasKey);
      if (saved && typeof saved === "object" && "childReferences" in saved) {
        try {
          const templateChild = saved as any;
          const originalTemplate = selectedTemplate?.templates.find(
            (t) => t.templateId === deletedItem.layerTemplateId
          );
          if (originalTemplate) {
            const childIndex = originalTemplate.childReferences.findIndex(
              (child) => child.uri === deletedItem.childUri
            );
            if (childIndex >= 0 && templateChild.childReferences[childIndex]) {
              const originalChild =
                originalTemplate.childReferences[childIndex];
              if (originalChild.metadata) {
                templateChild.childReferences[childIndex].child.metadata.image =
                  originalChild.child.metadata.image;
              } else {
                templateChild.childReferences.splice(childIndex, 1);
              }
              await setItem(interactiveCanvasKey, templateChild);
              window.dispatchEvent(
                new CustomEvent("interactiveCanvasUpdate", {
                  detail: { templateId: deletedItem.layerTemplateId },
                })
              );
            }
          }
        } catch (error) {}
      }
    }
  };
  if (canvasHistory.length === 0) return null;
  return (
    <div className="mt-6">
      <h3 className="text-white font-sat text-sm mb-3 tracking-wider">
        {t("canvas_history")}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 pt-2 px-2">
        {canvasHistory.map((historyItem) => (
          <div
            key={historyItem.id}
            onClick={() => {
              onHistoryLoad(historyItem);
            }}
            className="flex-shrink-0 w-24 h-24 border border-oscurazul rounded cursor-pointer hover:opacity-70 bg-oscuro p-1 relative group overflow-visible"
          >
            <img
              src={historyItem.thumbnail}
              alt="canvas history"
              draggable={false}
              className="w-full h-full object-contain rounded"
              style={{
                imageRendering: "crisp-edges",
              }}
            />
            <div
              onClick={(e) => downloadThumbnail(historyItem, e)}
              className="absolute cursor-pointer -top-1 -left-1 w-4 h-4 bg-ama hover:bg-ama/80 text-black rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              ↓
            </div>
            <div
              onClick={(e) => deleteFromHistory(historyItem.id, e)}
              className="absolute cursor-pointer -top-1 -right-1 w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              X
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
