import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useDesignContext } from "../../../context/DesignContext";
import { CompositeHistoryProps } from "../types/composite.types";

export default function CompositeHistory({ onImageSelected }: CompositeHistoryProps) {
  const { t } = useTranslation();
  const { getItem, setItem } = useDesignStorage();
  const { refreshDesigns } = useDesignContext();
  const [compositeHistory, setCompositeHistory] = useState<
    Array<{
      id: string;
      imageData: string;
      prompt: string;
      model: string;
      provider: string;
      timestamp: Date;
      settings: any;
    }>
  >([]);
  useEffect(() => {
    const loadHistory = async () => {
      const saved = await getItem("aiCompositeHistory", "composite", []);
      if (Array.isArray(saved)) {
        const parsedHistory = saved.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setCompositeHistory(parsedHistory);
      } else {
        setCompositeHistory([]);
      }
    };
    loadHistory();
  }, [getItem]);
  useEffect(() => {
    const handleCompositeGenerated = async () => {
      const saved = await getItem("aiCompositeHistory", "composite", []);
      if (Array.isArray(saved)) {
        const parsedHistory = saved.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setCompositeHistory(parsedHistory);
      }
    };
    window.addEventListener("compositeImageGenerated", handleCompositeGenerated);
    return () => {
      window.removeEventListener("compositeImageGenerated", handleCompositeGenerated);
    };
  }, [getItem]);
  const handleDeleteFromHistory = async (itemId: string) => {
    const updatedHistory = compositeHistory.filter((h) => h.id !== itemId);
    setCompositeHistory(updatedHistory);
    await setItem("aiCompositeHistory", updatedHistory, "composite");
    await refreshDesigns();
  };
  const handleClearHistory = async () => {
    setCompositeHistory([]);
    await setItem("aiCompositeHistory", [], "composite");
    await refreshDesigns();
  };
  return (
    compositeHistory.length > 0 && (
      <div className="mt-6">
        <h2 className="text-lg font-sat text-white tracking-wider mb-4">
          {t("composite_generation_history")}
        </h2>
        <div className="bg-oscuro border border-gray-600 rounded p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
            {compositeHistory.map((item) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square bg-gray-700 rounded border border-gray-600 overflow-hidden">
                  <img
                    src={item.imageData}
                    alt={item.prompt.slice(0, 30)}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                    onClick={() => onImageSelected?.(item.imageData)}
                    title={`${t("click_to_use_as_background")}: ${item.prompt}`}
                  />
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onImageSelected?.(item.imageData);
                    }}
                    className="w-4 h-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center font-sat cursor-pointer transition-colors shadow-lg"
                    title={t("use_as_background")}
                  >
                    ↑
                  </div>
                  <div
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const filePath = await save({
                          defaultPath: `composite-${item.model}-${Date.now()}.png`,
                          filters: [
                            {
                              name: t("png_images"),
                              extensions: ["png"],
                            },
                            {
                              name: t("jpeg_images"), 
                              extensions: ["jpg", "jpeg"],
                            },
                            {
                              name: "All Images",
                              extensions: [
                                "png",
                                "jpg", 
                                "jpeg",
                                "gif",
                                "bmp",
                                "webp",
                              ],
                            },
                          ],
                        });
                        if (filePath) {
                          await invoke("write_image_file", {
                            imageData: item.imageData,
                            filePath: filePath,
                          });
                        }
                      } catch (error) {
                        alert(`${t("save_failed")}: ${error}`);
                      }
                    }}
                    className="w-4 h-4 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center font-sat cursor-pointer transition-colors shadow-lg"
                    title={t("save_image")}
                  >
                    ↓
                  </div>
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteFromHistory(item.id);
                    }}
                    className="w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center font-sat cursor-pointer transition-colors shadow-lg"
                    title={t("delete_image")}
                  >
                    ×
                  </div>
                </div>
                <div
                  className="mt-2 text-xs font-sat text-gray-400 truncate"
                  title={item.prompt}
                >
                  {item.prompt.slice(0, 20)}...
                </div>
                <div className="text-xs font-sat text-gray-500">
                  {item.model} • {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-600">
            <span className="text-sm font-sat text-gray-400">
              {compositeHistory.length} {t("composite_generations_saved")}
            </span>
            <div
              onClick={handleClearHistory}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-sat text-xs cursor-pointer"
            >
              {t("clear_history")}
            </div>
          </div>
        </div>
      </div>
    )
  );
}