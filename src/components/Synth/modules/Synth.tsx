import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SynthCanvas from "./SynthCanvas";
import { useApp } from "../../../context/AppContext";
import { Child } from "../../Format/types/format.types";
import { useDesignContext } from "../../../context/DesignContext";
import GenerationHistory from "./GenerationHistory";
import { CanvasHistory } from "./CanvasHistory";
import Generator from "./Generator";
import ComfyUINodeEditor from "../../ComfyUI/modules/ComfyUINodeEditor";
import InteractiveCanvas from "./InteractiveCanvas";
import { useInteractiveCanvas } from "../hooks/useInteractiveCanvas";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useLibrary } from "../../../context/LibraryContext";
import { getCurrentTemplate } from "../utils/templateHelpers";

export default function Synth() {
  const { t } = useTranslation();
  const {
    selectedLayer,
    selectLayer,
    selectTemplate,
    selectedTemplate,
    selectedPatternChild,
    setSelectedPatternChild,
    groupedTemplates,
    isBackSide,
  } = useApp();

  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const { currentDesign } = useDesignContext();
  const { getItem, setItem } = useDesignStorage();
  const { loadWorkflow, loadSynthPrompt } = useLibrary();
  const [showNodeEditor, setShowNodeEditor] = useState<boolean>(false);
  const [generatorState, setGeneratorState] = useState<{
    aiProvider: string;
    comfySettings: any;
  }>({
    aiProvider: "openai",
    comfySettings: { workflowJson: null },
  });
  const [setComfySettingsRef, setSetComfySettingsRef] = useState<
    ((updateFn: (prev: any) => any) => void) | null
  >(null);
  const { templateChild, updateChildCanvas } =
    useInteractiveCanvas(currentTemplate);
  useEffect(() => {
    const loadLibraryItem = async () => {
      const workflowId = localStorage.getItem("loadWorkflowId");
      const synthPromptId = localStorage.getItem("loadSynthPromptId");
      const shouldSwitchToComfyUI = localStorage.getItem("switchToComfyUI");
      if (workflowId) {
        const workflow = loadWorkflow(workflowId);
        if (workflow) {
          (window as any).libraryWorkflowToLoad = {
            workflow,
            shouldSwitchProvider: shouldSwitchToComfyUI === "true",
          };
        }
        localStorage.removeItem("loadWorkflowId");
        localStorage.removeItem("switchToComfyUI");
      }
      if (synthPromptId) {
        const synthPrompt = loadSynthPrompt(synthPromptId);
        if (synthPrompt) {
          (window as any).libraryPromptToLoad = synthPrompt;
        }
        localStorage.removeItem("loadSynthPromptId");
      }
    };
    loadLibraryItem();
  }, [loadWorkflow, loadSynthPrompt]);
  useEffect(() => {
    const syncCanvas = async () => {
      if (!currentDesign || !selectedPatternChild) return;
      try {
        const canvasHistory =
          (await getItem("canvasHistory")) || [];
        if (Array.isArray(canvasHistory) && canvasHistory.length > 0) {
          const currentChildHistory = canvasHistory
            .filter((item: any) => item.childUri === selectedPatternChild.uri)
            .sort((a: any, b: any) => b.timestamp - a.timestamp);
          if (currentChildHistory.length > 0) {
            const mostRecentCanvas = currentChildHistory[0];
            setTimeout(() => {
              const loadFromHistoryFn = (window as any).canvasLoadFromHistory;
              if (loadFromHistoryFn) {
                loadFromHistoryFn(mostRecentCanvas);
              }
              if (
                mostRecentCanvas.layerTemplateId &&
                currentTemplate &&
                mostRecentCanvas.layerTemplateId !== currentTemplate.templateId
              ) {
                return;
              }
              if (
                currentTemplate?.childReferences &&
                mostRecentCanvas.thumbnailPath
              ) {
                const childIndex = currentTemplate.childReferences.findIndex(
                  (child) => child.uri === mostRecentCanvas.childUri
                );
                if (childIndex >= 0) {
                  updateChildCanvas(childIndex, mostRecentCanvas.thumbnailPath);
                }
              }
            }, 100);
          }
        }
      } catch (error) {}
    };
    const timeoutId = setTimeout(syncCanvas, 100);
    return () => clearTimeout(timeoutId);
  }, [selectedPatternChild, currentDesign, getItem, currentTemplate, updateChildCanvas]);
  const handleChildClick = useCallback(
    async (childUri: string) => {
      if (!selectedLayer) return;
      let originalChildUri = childUri;
      if (childUri?.startsWith("data:")) {
        const childIndex = templateChild?.childReferences.findIndex(
          (c) => c.uri === childUri
        );
        if (childIndex !== undefined && childIndex >= 0) {
          const originalTemplate = selectedTemplate?.templates.find(
            (t) => t.templateId === currentTemplate?.templateId
          );
          if (
            originalTemplate &&
            originalTemplate.childReferences[childIndex]
          ) {
            originalChildUri = originalTemplate.childReferences[childIndex].uri;
          }
        }
      }
      const canvasHistory = await getItem("canvasHistory");
   
      if (canvasHistory && Array.isArray(canvasHistory)) {
        try {
          const historyItem = canvasHistory.find(
            (item) =>
              item.childUri === originalChildUri &&
              item.layerTemplateId === currentTemplate?.templateId
          );
          if (historyItem) {
            const child = currentTemplate?.childReferences.find(
              (c: Child) =>
                c.uri === originalChildUri ||
                (c.metadata &&
                  currentTemplate?.childReferences.findIndex(
                    (ch) => ch.uri === originalChildUri
                  ) ===
                    currentTemplate?.childReferences.findIndex((ch) => ch === c))
            );
            if (child) {
              setSelectedPatternChild(child);
              const tryLoadFromHistory = (attempts = 0) => {
                const loadFromHistoryFn = (window as any).canvasLoadFromHistory;
                if (loadFromHistoryFn) {
                  loadFromHistoryFn(historyItem);
                  if (
                    historyItem.thumbnailPath &&
                    currentTemplate?.childReferences
                  ) {
                    const historyChildIndex =
                      currentTemplate.childReferences.findIndex(
                        (childRef) => childRef.uri === historyItem.childUri
                      );
                    if (historyChildIndex >= 0) {
                      updateChildCanvas(
                        historyChildIndex,
                        historyItem.thumbnailPath
                      );
                    }
                  }
                } else if (attempts < 10) {
                  setTimeout(() => tryLoadFromHistory(attempts + 1), 100);
                } else {
                }
              };
              setTimeout(() => tryLoadFromHistory(), 500);
            }
          } else {
            const child = currentTemplate?.childReferences.find(
              (c: Child) =>
                c.uri === originalChildUri ||
                (c.metadata &&
                  currentTemplate?.childReferences.findIndex(
                    (ch) => ch.uri === originalChildUri
                  ) ===
                    currentTemplate?.childReferences.findIndex((ch) => ch === c))
            );
            if (child) {
              setSelectedPatternChild(child);
              const clearCanvasFn = (window as any).clearCanvas;
              const loadChildSvgFn = (window as any).loadChildSvg;
              
          
              if (clearCanvasFn) {
                clearCanvasFn();
              }
              
              if (loadChildSvgFn && child.child?.metadata?.image) {
                loadChildSvgFn(child.child.metadata.image);
              }
            }
          }
        } catch (error) {}
      } else {
        const child = currentTemplate?.childReferences.find(
          (c: Child) =>
            c.uri === originalChildUri ||
            (c.metadata &&
              currentTemplate?.childReferences.findIndex(
                (ch) => ch.uri === originalChildUri
              ) ===
                currentTemplate?.childReferences.findIndex((ch) => ch === c))
        );
        if (child) {
          setSelectedPatternChild(child);
          const clearCanvasFn = (window as any).clearCanvas;
          const loadChildSvgFn = (window as any).loadChildSvg;
        
          
          if (clearCanvasFn) {
            clearCanvasFn();
          }
          
          if (loadChildSvgFn && child.child?.metadata?.image) {
            loadChildSvgFn(child.child.metadata.image);
          }
        }
      }
    },
    [
      selectedLayer,
      setSelectedPatternChild,
      templateChild,
      getItem,
      currentTemplate,
      selectedTemplate,
      updateChildCanvas,
    ]
  );
  const handleGeneratorStateChange = useCallback(
    (state: { aiProvider: string; comfySettings: any }) => {
      setGeneratorState(state);
    },
    []
  );
  const handleWorkflowChange = useCallback(
    async (workflow: any) => {
      setGeneratorState((prev) => ({
        ...prev,
        comfySettings: {
          ...prev.comfySettings,
          workflowJson: workflow,
        },
      }));
      if (workflow === null || workflow === undefined) {
        await setItem("comfyuiSettings", {});
      } else {
        const currentSettings = (await getItem("comfyuiSettings")) || {};
        if (typeof currentSettings !== "object") {
          await setItem("comfyuiSettings", {});
          return;
        }
        const updatedSettings = {
          ...currentSettings,
          workflowJson: workflow,
        };
        await setItem("comfyuiSettings", updatedSettings);
      }
      if (setComfySettingsRef) {
        setComfySettingsRef((prev) => ({
          ...prev,
          workflowJson: workflow,
          ...(workflow === null && {
            workflowFileName: "",
            promptNodes: [],
            hasImageInput: false,
          }),
        }));
      }
    },
    [setComfySettingsRef, getItem, setItem]
  );
  const handleComfySettingsUpdate = useCallback((setComfySettingsFn: any) => {
    setSetComfySettingsRef(() => setComfySettingsFn);
  }, []);
  const memoizedWorkflowJson = useMemo(() => {
    if (!generatorState.comfySettings.workflowJson) return undefined;
    const workflowData = generatorState.comfySettings.workflowJson;
    return typeof workflowData === "string"
      ? workflowData
      : JSON.stringify(workflowData);
  }, [generatorState.comfySettings.workflowJson]);

  const getSynthCanvasImage = async () => {
    const canvas = document.querySelector("canvas#synth-canvas-id") as HTMLCanvasElement;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let minX = canvas.width, maxX = 0;
    let minY = canvas.height, maxY = 0;
    let hasContent = false;

    const step = 4;
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const index = (y * canvas.width + x) * 4;
        if (data[index + 3] > 0) {
          hasContent = true;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (!hasContent) return canvas.toDataURL("image/png");

    minX = Math.max(0, minX - step);
    maxX = Math.min(canvas.width - 1, maxX + step);
    minY = Math.max(0, minY - step);
    maxY = Math.min(canvas.height - 1, maxY + step);

    const boundsWidth = maxX - minX + 1;
    const boundsHeight = maxY - minY + 1;

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = boundsWidth;
    croppedCanvas.height = boundsHeight;
    const croppedCtx = croppedCanvas.getContext("2d");
    if (!croppedCtx) return null;

    croppedCtx.drawImage(canvas, minX, minY, boundsWidth, boundsHeight, 0, 0, boundsWidth, boundsHeight);
    return croppedCanvas.toDataURL("image/png");
  };
  return (
    <div className="relative w-full h-full flex flex-col p-4 bg-black">
      <div className="mb-6">
        <h2 className="text-xs font-pixel text-white tracking-wider mb-4">
          {t("synth_canvas")}
        </h2>
        {currentDesign && (
          <p className="text-white font-agency text-xs mb-2">
            {t("project")}: {currentDesign.name}
          </p>
        )}
        {selectedLayer ? (
          <p className="text-crema font-agency text-xs">
            {t("layer")}: TID-{selectedLayer.front.templateId} | {t("price")}: $
            {(
              (Number(selectedLayer.front.price) +
                selectedLayer.front.childReferences.reduce((acc) => acc, 0)) /
              10 ** 18
            ).toFixed(2)}{" "}
            | {t("children")}: {selectedLayer.front.childReferences?.length || 0}
            {selectedLayer.back && ` + ${t("back")}: TID-${selectedLayer.back.templateId}`}
          </p>
        ) : (
          <p className="text-crema font-agency text-xs">
            {t("no_layer_selected")}
          </p>
        )}
      </div>
      <div className="flex-1 p-6 flex flex-col h-full overflow-hidden">
        <InteractiveCanvas
          templateChild={templateChild}
          onChildClick={handleChildClick}
        />
        <div className="flex-1 overflow-y-auto">
          <Generator
            showNodeEditor={showNodeEditor}
            setShowNodeEditor={setShowNodeEditor}
            onStateChange={handleGeneratorStateChange}
            onComfySettingsUpdate={handleComfySettingsUpdate}
            getCanvasImage={getSynthCanvasImage}
          />
          <div className="bg-white border border-crema rounded p-6 h-[600px]">
            {showNodeEditor &&
            generatorState.aiProvider === "comfy" &&
            generatorState.comfySettings.workflowJson ? (
              <ComfyUINodeEditor
                workflowJson={memoizedWorkflowJson}
                onWorkflowChange={handleWorkflowChange}
                comfyUrl={generatorState.comfySettings.url}
              />
            ) : selectedTemplate && selectedLayer ? (
              <SynthCanvas onCanvasSave={updateChildCanvas} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-crema font-agency text-sm">
                  {!selectedTemplate
                    ? t("select_template_to_start")
                    : t("select_layer_to_enable")}
                </p>
              </div>
            )}
          </div>
          <CanvasHistory
            onHistoryLoad={(historyItem) => {
              const template = groupedTemplates.find(
                (t) => t.name === historyItem.templateName
              );
              if (template) {
                selectTemplate(template);

                const layer = selectedTemplate?.templates.find(
                  (template) =>
                    template.templateId === historyItem.layerTemplateId
                );

                if (layer) {
                  selectLayer(layer);
                  const child = layer.childReferences.find(
                    (c) => c.uri === historyItem.childUri
                  );
                  if (child) {
                    setSelectedPatternChild(child);
                    setTimeout(() => {
                      const loadFromHistoryFn = (window as any)
                        .canvasLoadFromHistory;
                      if (loadFromHistoryFn) {
                        loadFromHistoryFn(historyItem);
                      }
                    }, 200);
                  }
                }
              }
            }}
          />
          <GenerationHistory />
        </div>
      </div>
    </div>
  );
}
