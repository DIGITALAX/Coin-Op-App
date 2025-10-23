import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import InteractiveCanvas from "../../Synth/modules/InteractiveCanvas";
import Generator from "../../Synth/modules/Generator";
import CompositeHistory from "./CompositeHistory";
import { useInteractiveCanvas } from "../../Synth/hooks/useInteractiveCanvas";
import { useApp } from "../../../context/AppContext";
import { useDesignContext } from "../../../context/DesignContext";
import { useLibrary } from "../../../context/LibraryContext";
import useComposite from "../hooks/useComposite";
import { CompositeCanvasRef } from "../types/composite.types";
import CompositeCanvas from "./CompositeCanvas";
import { getCurrentTemplate } from "../../Synth/utils/templateHelpers";

export default function Composite() {
  const { t } = useTranslation();
  const { selectedLayer, isBackSide } = useApp();
  const { currentDesign } = useDesignContext();
  const { loadCompositePrompt } = useLibrary();
  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const { templateChild } = useInteractiveCanvas(currentTemplate);
  const compositeCanvasRef = useRef<CompositeCanvasRef>(null);
  const {
    handleChildClick,
    generatedImage,
    handleImageGenerated,
    deleteGeneratedImage,
    setGeneratedImage,
  } = useComposite(currentTemplate!, templateChild, compositeCanvasRef);
  const handleHistoryImageSelected = (imageUrl: string) => {
    setGeneratedImage(imageUrl);
  };
  
  const handleDownloadCanvas = async () => {
    if (!compositeCanvasRef.current) return;
    
    const dataURL = await compositeCanvasRef.current.captureCanvas();
    if (!dataURL) return;
    
    const { save } = await import('@tauri-apps/plugin-dialog');
    
    const filePath = await save({
      defaultPath: `composite_${currentTemplate?.templateId}_${isBackSide ? 'back' : 'front'}_${Date.now()}.png`,
      filters: [
        {
          name: 'PNG Image',
          extensions: ['png']
        },
        {
          name: 'JPEG Image', 
          extensions: ['jpg', 'jpeg']
        }
      ]
    });
    
    if (filePath) {
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      const base64Data = dataURL.split(',')[1];
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      await writeFile(filePath, buffer);
    }
  };
  useEffect(() => {
    const loadLibraryItem = async () => {
      const compositePromptId = localStorage.getItem("loadCompositePromptId");
      if (compositePromptId) {
        const compositePrompt = loadCompositePrompt(compositePromptId);
        if (compositePrompt) {
          window.dispatchEvent(
            new CustomEvent("loadLibraryPrompt", {
              detail: { prompt: compositePrompt },
            })
          );
        }
        localStorage.removeItem("loadCompositePromptId");
      }
    };
    loadLibraryItem();
  }, [loadCompositePrompt]);
  return (
    <div className="relative w-full h-full flex flex-col p-4 bg-black">
      <div className="mb-6">
        <h2 className="text-xs font-pixel text-white tracking-wider mb-2">
          {t("composite_preview")}
        </h2>
        {currentDesign && (
          <p className="text-white font-agency text-xs mb-2">
            {t("project")}: {currentDesign.name}
          </p>
        )}
        {selectedLayer ? (
          <p className="text-white font-agency text-xs">
            {t("layer")}: TID-{currentTemplate?.templateId} | {t("price")}: $
            {parseFloat(currentTemplate?.price!) / 1e18} | {t("children")}:{" "}
            {currentTemplate?.childReferences?.length || 0}
          </p>
        ) : (
          <p className="text-rosa font-agency text-xs">
            {t("no_layer_selected")}
          </p>
        )}
      </div>
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto overflow-x-hidden">
        <InteractiveCanvas
          templateChild={templateChild}
          onChildClick={handleChildClick}
        />
        <div className="flex justify-between items-center w-full px-2">
          <h3 className="text-white font-agency text-xs">{t("composite_canvas")}</h3>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleDownloadCanvas}
              className="lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-white text-black hover:opacity-80"
              style={{ transform: "skewX(-15deg)" }}
            >
              <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
                {t("download_canvas")}
              </span>
            </button>
            {generatedImage && (
              <button
                onClick={deleteGeneratedImage}
                className="lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-white text-black hover:opacity-80"
                style={{ transform: "skewX(-15deg)" }}
              >
                <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
                  {t("clear_background")}
                </span>
              </button>
            )}
          </div>
        </div>
        <CompositeCanvas
          ref={compositeCanvasRef}
          backgroundImage={generatedImage || undefined}
        />
        <Generator
          mode="composite"
          onImageGenerated={handleImageGenerated}
          getCanvasImage={async () => {
            const result = await compositeCanvasRef.current?.captureCanvas();
            return result || null;
          }}
        />
        <CompositeHistory onImageSelected={handleHistoryImageSelected} />
      </div>
    </div>
  );
}
