import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PageNavigation from "../../Common/modules/PageNavigation";
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
        <h2 className="text-lg font-satB text-white tracking-wider mb-2">
          {t("composite_preview")}
        </h2>
        {currentDesign && (
          <p className="text-ama font-mana text-xxxs mb-2">
            {t("project")}: {currentDesign.name}
          </p>
        )}
        {selectedLayer ? (
          <p className="text-white font-mana text-xxxs">
            {t("layer")}: TID-{currentTemplate?.templateId} | {t("price")}: $
            {parseFloat(currentTemplate?.price!) / 1e18} | {t("children")}:{" "}
            {currentTemplate?.childReferences?.length || 0}
          </p>
        ) : (
          <p className="text-red-400 font-mana text-xxxs">
            {t("no_layer_selected")}
          </p>
        )}
      </div>
      <div className="flex-1 flex flex-col overflow-y-scroll gap-6">
        <div className="flex flex-row items-center justify-center gap-6">
          <div className="flex-1 border border-ama rounded-lg p-4 bg-gray-800 max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-satB text-sm">{t("composite_canvas")}</h3>
              {generatedImage && (
                <button
                  onClick={deleteGeneratedImage}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                >
                  {t("clear_background")}
                </button>
              )}
            </div>
            <CompositeCanvas
              ref={compositeCanvasRef}
              backgroundImage={generatedImage || undefined}
            />
          </div>
          <div className="flex items-center justify-center">
            {selectedLayer ? (
              <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
                <h4 className="text-white font-satB text-sm mb-2">
                  {t("child_elements")}
                </h4>
                <p className="text-gray-400 text-xs mb-3">
                  {t("click_children_to_add")}
                </p>
                <InteractiveCanvas
                  templateChild={templateChild}
                  size="large"
                  onChildClick={handleChildClick}
                />
              </div>
            ) : (
              <div className="text-gray-400 font-sat text-sm">
                {t("select_layer_to_view")}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex w-full items-center flex-col gap-4">
          <div className="border border-oscurazul rounded p-4 bg-oscuro">
            <h3 className="text-white font-satB text-sm mb-2">
              {t("generate_background")}
            </h3>
            <Generator
              mode="composite"
              onImageGenerated={handleImageGenerated}
              getCanvasImage={async () =>
                compositeCanvasRef.current?.captureCanvas() || null
              }
            />
          </div>
        </div>
        <CompositeHistory onImageSelected={handleHistoryImageSelected} />
      </div>
      <PageNavigation currentPage="/Composite" />
    </div>
  );
}
