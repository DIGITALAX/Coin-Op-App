import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { addImageToCanvas } from "../utils/addImageToCanvas";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
export default function GenerationHistory() {
  const { getItem, setItem } = useDesignStorage();
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
        const history = (await getItem("aiGenerationHistory", "synth")) || [];
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
  }, [getItem]);
  const handleDeleteFromHistory = async (itemId: string) => {
    const updatedHistory = generationHistory.filter((h) => h.id !== itemId);
    setGenerationHistory(updatedHistory);
    await setItem("aiGenerationHistory", updatedHistory, "synth");
  };
  return (
    generationHistory.length > 0 && (
      <div className="mt-6">
        <h2 className="text-lg font-sat text-white tracking-wider mb-4">
          AI GENERATION HISTORY
        </h2>
        <div className="bg-oscuro border border-gray-600 rounded p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
            {generationHistory.map((item) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square bg-gray-700 rounded border border-gray-600 overflow-hidden">
                  <img
                    src={item.imageData}
                    alt={item.prompt.slice(0, 30)}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                    onClick={() => addImageToCanvas(item.imageData, false)}
                    title={`Click to add to canvas: ${item.prompt}`}
                  />
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addImageToCanvas(item.imageData, false);
                    }}
                    className="w-4 h-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center font-sat cursor-pointer transition-colors shadow-lg"
                    title="Load to canvas"
                  >
                    +
                  </div>{" "}
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
                        alert(`Save failed: ${error}`);
                      }
                    }}
                    className="w-4 h-4 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center font-sat cursor-pointer transition-colors shadow-lg"
                    title="Save image"
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
                    title="Delete image"
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
              {generationHistory.length} generations saved
            </span>
            <div
              onClick={async () => {
                setGenerationHistory([]);
                await setItem("aiGenerationHistory", [], "synth");
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-sat text-xs cursor-pointer"
            >
              CLEAR HISTORY
            </div>
          </div>
        </div>
      </div>
    )
  );
}
