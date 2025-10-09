import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { addImageToCanvas } from "../utils/addImageToCanvas";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useDesignContext } from "../../../context/DesignContext";
export default function GenerationHistory() {
  const { t } = useTranslation();
  const { getItem, setItem } = useDesignStorage();
  const { currentDesign } = useDesignContext();
  const [generationHistory, setGenerationHistory] = useState<
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
      try {
        const history = (await getItem("aiGenerationHistory")) || [];
        if (Array.isArray(history)) {
          setGenerationHistory(history);
        } else {
          setGenerationHistory([]);
        }
      } catch (error) {
        setGenerationHistory([]);
      }
    };
    loadHistory();
  }, [getItem, currentDesign?.id]);
  const handleDeleteFromHistory = async (itemId: string) => {
    const updatedHistory = generationHistory.filter((h) => h.id !== itemId);
    setGenerationHistory(updatedHistory);
    await setItem("aiGenerationHistory", updatedHistory);
  };
  return (
    generationHistory.length > 0 && (
      <div className="mt-6">
        <h2 className="text-ligero font-dos text-xs tracking-wider mb-4">
          {t("ai_generation_history")}
        </h2>
        <div className="bg-turq1 border border-aqua rounded p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
            {generationHistory.map((item) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square bg-turq rounded border border-aqua overflow-hidden hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
                  <img
                    src={item.imageData}
                    alt={item.prompt.slice(0, 30)}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                    draggable={false}
                    onClick={() => addImageToCanvas(item.imageData, false)}
                    title={`${t("click_to_add_to_canvas")}: ${item.prompt}`}
                  />
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addImageToCanvas(item.imageData, false);
                    }}
                    className="w-5 h-5 bg-white hover:opacity-80 text-black rounded-sm flex items-center justify-center font-agency text-xs cursor-pointer transition-opacity shadow-lg"
                    title={t("load_to_canvas")}
                  >
                    +
                  </div>
                  <div
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const filePath = await save({
                          defaultPath: `ai-generated-${
                            item.model
                          }-${Date.now()}.png`,
                          filters: [
                            {
                              name: "PNG Images",
                              extensions: ["png"],
                            },
                            {
                              name: "JPEG Images",
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
                    className="w-5 h-5 bg-white hover:opacity-80 text-black rounded-sm flex items-center justify-center font-agency text-xs cursor-pointer transition-opacity shadow-lg"
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
                    className="w-5 h-5 bg-rosa hover:opacity-80 text-white rounded-sm flex items-center justify-center font-agency text-xs cursor-pointer transition-opacity shadow-lg"
                    title={t("delete_image")}
                  >
                    ×
                  </div>
                </div>
                <div
                  className="mt-2 text-xs font-dos text-ligero truncate"
                  title={item.prompt}
                >
                  {item.prompt.slice(0, 20)}...
                </div>
                <div className="text-xs font-dos text-ligero">
                  {item.model} • {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-aqua">
            <span className="text-xs font-dos text-ligero">
              {generationHistory.length} {t("generations_saved")}
            </span>
            <div
              onClick={async () => {
                setGenerationHistory([]);
                await setItem("aiGenerationHistory", []);
              }}
              className="lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-rosa text-white hover:opacity-80 cursor-pointer"
              style={{ transform: "skewX(-15deg)" }}
            >
              <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
                {t("clear_history")}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
