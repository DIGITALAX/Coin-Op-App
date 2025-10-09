import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useDesignContext } from "../../../context/DesignContext";
import { CompositeHistoryProps } from "../types/composite.types";

export default function CompositeHistory({
  onImageSelected,
}: CompositeHistoryProps) {
  const { t } = useTranslation();
  const { getItem, setItem } = useDesignStorage();
  const { refreshDesigns, currentDesign } = useDesignContext();
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
      const saved = await getItem("aiCompositeHistory");
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
  }, [getItem, currentDesign?.id]);
  useEffect(() => {
    const handleCompositeGenerated = async () => {
      const saved = await getItem("aiCompositeHistory");
      if (Array.isArray(saved)) {
        const parsedHistory = saved.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setCompositeHistory(parsedHistory);
      }
    };
    window.addEventListener(
      "compositeImageGenerated",
      handleCompositeGenerated
    );
    return () => {
      window.removeEventListener(
        "compositeImageGenerated",
        handleCompositeGenerated
      );
    };
  }, [getItem, currentDesign?.id]);
  const handleDeleteFromHistory = async (itemId: string) => {
    const updatedHistory = compositeHistory.filter((h) => h.id !== itemId);
    setCompositeHistory(updatedHistory);
    await setItem("aiCompositeHistory", updatedHistory);
    await refreshDesigns();
  };
  const handleClearHistory = async () => {
    setCompositeHistory([]);
    await setItem("aiCompositeHistory", []);
    await refreshDesigns();
  };
  return (
    compositeHistory.length > 0 && (
      <div>
        <h2 className="text-xs font-pixel text-white tracking-wider mb-4">
          {t("composite_generation_history")}
        </h2>
        <div className="bg-turq1 border border-aqua rounded p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {compositeHistory.map((item) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square bg-turq rounded border border-aqua overflow-hidden hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
                  <img
                    src={item.imageData}
                    draggable={false}
                    alt={item.prompt.slice(0, 30)}
                    className="w-full h-full object-cover cursor-pointer"
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
                    className="w-5 h-5 bg-white rounded-sm font-agency cursor-pointer transition-colors flex items-center justify-center"
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
                          defaultPath: `composite-${
                            item.model
                          }-${Date.now()}.png`,
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
                    className="w-5 h-5 bg-white rounded-sm font-agency cursor-pointer transition-colors flex items-center justify-center"
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
                    className="w-5 h-5 bg-white rounded-sm font-agency cursor-pointer transition-colors flex items-center justify-center"
                    title={t("delete_image")}
                  >
                    ×
                  </div>
                </div>
                <div
                  className="mt-2 text-xs font-agency text-white truncate"
                  title={item.prompt}
                >
                  {item.prompt.slice(0, 20)}...
                </div>
                <div className="text-xs font-agency text-ligero">
                  {item.model} • {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-aqua">
            <span className="text-xs font-agency text-white">
              {compositeHistory.length} {t("composite_generations_saved")}
            </span>
            <button
              onClick={handleClearHistory}
              className="lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-white text-black hover:opacity-80"
              style={{ transform: "skewX(-15deg)" }}
            >
              <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
                {t("clear_history")}
              </span>
            </button>
          </div>
        </div>
      </div>
    )
  );
}
