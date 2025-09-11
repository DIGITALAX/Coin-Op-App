import { useState, useCallback, useEffect } from "react";
import {
  Design,
  DesignMetadata,
  CreateDesignRequest,
} from "../types/design.types";
import { CanvasHistory } from "../../Synth/types/synth.types";
import { useFileStorage } from "../../Activity/hooks/useFileStorage";
import { useApp } from "../../../context/AppContext";
import { v4 as uuidv4 } from "uuid";

export const useDesigns = () => {
  const { getItem, setItem } = useFileStorage();
  const {
    selectTemplate,
    selectLayer,
    setSelectedPatternChild,
    groupedTemplates,
  } = useApp();
  const [currentDesign, setCurrentDesign] = useState<Design | null>(null);
  const [availableDesigns, setAvailableDesigns] = useState<DesignMetadata[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const refreshDesigns = useCallback(async () => {
    try {
      setIsLoading(true);
      const designsList = (await getItem("designs-list", "global")) || [];
      if (Array.isArray(designsList)) {
        const designsMetadata: DesignMetadata[] = [];
        const validDesignIds: string[] = [];
        for (const designId of designsList) {
          try {
            const designData = await getItem(`design-${designId}`, "global");
            if (designData && typeof designData === "object") {
              const design = designData as Design;
              validDesignIds.push(designId);
              const canvasHistory =
                (await getItem("canvasHistory", designId)) || [];
              const aiHistory =
                (await getItem("aiGenerationHistory", designId)) || [];
              const compositeHistory =
                (await getItem("composite_canvasHistory", designId)) || [];
              designsMetadata.push({
                design,
                stats: {
                  canvasHistoryCount: Array.isArray(canvasHistory)
                    ? canvasHistory.length
                    : 0,
                  aiGenerationCount: Array.isArray(aiHistory)
                    ? aiHistory.length
                    : 0,
                  compositeCount: Array.isArray(compositeHistory)
                    ? compositeHistory.length
                    : 0,
                },
              });
            }
          } catch (error) {}
        }
        if (validDesignIds.length !== designsList.length) {
          await setItem("designs-list", validDesignIds, "global");
        }
        designsMetadata.sort(
          (a, b) =>
            new Date(b.design.lastModified).getTime() -
            new Date(a.design.lastModified).getTime()
        );
        setAvailableDesigns(designsMetadata);
      }
    } catch (error) {
      setAvailableDesigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [getItem, setItem]);
  const createDesign = useCallback(
    async (request: CreateDesignRequest): Promise<Design> => {
      try {
        setIsLoading(true);
        const designId = uuidv4();
        const now = new Date();
        const design: Design = {
          id: designId,
          name: request.name,
          type: request.type,
          frontLayerTemplateId: request.frontLayerTemplateId,
          backLayerTemplateId: request.backLayerTemplateId,
          childUri: request.childUri,
          createdAt: now,
          lastModified: now,
          description: request.description,
        };
        await setItem(`design-${designId}`, design, "global");
        const designsList = (await getItem("designs-list", "global")) || [];
        const updatedList = Array.isArray(designsList)
          ? [...designsList, designId]
          : [designId];
        await setItem("designs-list", updatedList, "global");
        setCurrentDesign(design);
        window.dispatchEvent(
          new CustomEvent("newDesignCreated", { detail: { design } })
        );
        await refreshDesigns();
        return design;
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [getItem, setItem, refreshDesigns]
  );
  const loadDesign = useCallback(
    async (designId: string) => {
      try {
        setIsLoading(true);
        const designData = await getItem(`design-${designId}`, "global");
        if (designData && typeof designData === "object") {
          let design = designData as Design;

          design.lastModified = new Date();
          await setItem(`design-${designId}`, design, "global");
          setCurrentDesign(design);

          const groupedTemplate = groupedTemplates.find((gt) => {
            const hasMatch =
              gt.name.toLowerCase() === design.type.toLowerCase();
            return hasMatch;
          });
          if (groupedTemplate) {
            selectTemplate(groupedTemplate);
            const frontLayer = groupedTemplate.templates.find(
              (template) => template.templateId === design.frontLayerTemplateId
            );
            const backLayer = design.backLayerTemplateId
              ? groupedTemplate.templates.find(
                  (template) =>
                    template.templateId === design.backLayerTemplateId
                )
              : undefined;
            if (frontLayer) {
              selectLayer(frontLayer, backLayer);
              const patternChild = frontLayer.childReferences.find(
                (child) => child.uri === design.childUri
              );
              if (patternChild) {
                setSelectedPatternChild(patternChild);
              }
            }
          }
          window.dispatchEvent(
            new CustomEvent("designChanged", { detail: { design } })
          );
          setTimeout(async () => {
            try {
              const canvasHistory =
                ((await getItem(
                  "canvasHistory",
                  designId
                )) as CanvasHistory[]) || [];
              if (Array.isArray(canvasHistory) && canvasHistory.length > 0) {
                const currentChildHistory = canvasHistory
                  .filter((item) => item.childUri === design.childUri)
                  .sort((a, b) => b.timestamp - a.timestamp);
                if (currentChildHistory.length > 0) {
                  const mostRecentCanvas = currentChildHistory[0];
                  const loadFromHistoryFn = (window as any)
                    .canvasLoadFromHistory;
                  if (loadFromHistoryFn) {
                    loadFromHistoryFn(mostRecentCanvas);
                  }
                }
              }
            } catch (error) {}
          }, 500);
          await refreshDesigns();
        } else {
          throw new Error(`Design ${designId} not found`);
        }
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [
      getItem,
      setItem,
      refreshDesigns,
      selectTemplate,
      selectLayer,
      setSelectedPatternChild,
    ]
  );
  const deleteDesign = useCallback(
    async (designId: string) => {
      try {
        setIsLoading(true);
        const designsList = (await getItem("designs-list", "global")) || [];
        const updatedList = Array.isArray(designsList)
          ? designsList.filter((id) => id !== designId)
          : [];
        await setItem("designs-list", updatedList, "global");
        await setItem(`design-${designId}`, null, "global");

        const dataTypes = [
          "canvasHistory",
          "aiGenerationHistory",
          "aiCompositeHistory",
          "comfyuiSettings",
          "fulfillment",
          "pattern",
          "nestingSettings",
          "aiProvider",
          "openai_settings",
          "replicate_settings",
          "openai_selectedModel",
          "replicate_selectedModel",
          "comfyui_selectedModel",
          "openai_selectedLora",
          "replicate_selectedLora",
          "comfyui_selectedLora",
        ];

        for (const dataType of dataTypes) {
          try {
            await setItem(dataType, null, designId);
          } catch (error) {}
        }

        const designBasedKeys = [
          `compositeImage_${designId}_front`,
          `compositeImage_${designId}_back`,
          `compositeCanvasChildren_${designId}_front`,
          `compositeCanvasChildren_${designId}_back`,
          `interactiveCanvas_${designId}_front`,
          `interactiveCanvas_${designId}_back`,
        ];

        for (const key of designBasedKeys) {
          try {
            await setItem(key, null, designId);
          } catch (error) {}
        }
        if (currentDesign?.id === designId) {
          setCurrentDesign(null);
        }
        await refreshDesigns();
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [getItem, setItem, currentDesign, refreshDesigns]
  );
  const updateDesignThumbnail = useCallback(
    async (designId: string, thumbnail: string) => {
      try {
        const designData = await getItem(`design-${designId}`, "global");
        if (designData && typeof designData === "object") {
          const design = {
            ...(designData as Design),
            thumbnail,
            lastModified: new Date(),
          };
          await setItem(`design-${designId}`, design, "global");
          if (currentDesign?.id === designId) {
            setCurrentDesign(design);
          }
          await refreshDesigns();
        }
      } catch (error) {}
    },
    [getItem, setItem, currentDesign, refreshDesigns]
  );

  useEffect(() => {
    refreshDesigns();
  }, [refreshDesigns]);

  return {
    currentDesign,
    availableDesigns,
    isLoading,
    createDesign,
    loadDesign,
    deleteDesign,
    updateDesignThumbnail,
    refreshDesigns,
  };
};
