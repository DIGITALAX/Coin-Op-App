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
      const designsList = (await getItem("designs-list", undefined, [])) || [];
      if (Array.isArray(designsList)) {
        const designsMetadata: DesignMetadata[] = [];
        const validDesignIds: string[] = [];
        for (const designId of designsList) {
          try {
            const designData = await getItem(
              `design-${designId}`,
              undefined,
              null
            );
            if (designData && typeof designData === "object") {
              const design = designData as Design;
              validDesignIds.push(designId);
              const canvasHistory =
                (await getItem("canvasHistory", designId, [])) || [];
              const aiHistory =
                (await getItem("aiGenerationHistory", designId, [])) || [];
              const compositeHistory =
                (await getItem("composite_canvasHistory", designId, [])) || [];
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
          await setItem("designs-list", validDesignIds);
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
          templateId: request.templateId,
          layerTemplateId: request.layerTemplateId,
          childUri: request.childUri,
          createdAt: now,
          lastModified: now,
          description: request.description,
        };
        await setItem(`design-${designId}`, design);
        const designsList =
          (await getItem("designs-list", undefined, [])) || [];
        const updatedList = Array.isArray(designsList)
          ? [...designsList, designId]
          : [designId];
        await setItem("designs-list", updatedList);
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
        const designData = await getItem(`design-${designId}`, undefined, null);
        if (designData && typeof designData === "object") {
          const design = designData as Design;
          design.lastModified = new Date();
          await setItem(`design-${designId}`, design);
          setCurrentDesign(design);
          const groupedTemplate = groupedTemplates.find(
            (gt) => gt.templates.some(t => t.templateId === design.templateId)
          );
          if (groupedTemplate) {
            selectTemplate(groupedTemplate);
            const layer = groupedTemplate.templates.find(
              (template) => template.templateId === design.layerTemplateId
            );
            if (layer) {
              selectLayer(layer);
              const patternChild = layer.childReferences.find(
                (child) => child.uri === design.childUri
              );
              if (patternChild) {
                setSelectedPatternChild(patternChild as any);
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
                  designId,
                  []
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
        const designsList =
          (await getItem("designs-list", undefined, [])) || [];
        const updatedList = Array.isArray(designsList)
          ? designsList.filter((id) => id !== designId)
          : [];
        await setItem("designs-list", updatedList);
        await setItem(`design-${designId}`, null);
        const dataTypes = [
          "canvasHistory",
          "aiGenerationHistory",
          "composite_canvasHistory",
          "comfyui-settings",
        ];
        for (const dataType of dataTypes) {
          try {
            await setItem(dataType, null, designId);
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
        const designData = await getItem(`design-${designId}`, undefined, null);
        if (designData && typeof designData === "object") {
          const design = {
            ...(designData as Design),
            thumbnail,
            lastModified: new Date(),
          };
          await setItem(`design-${designId}`, design);
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
  useEffect(() => {
    const loadLastDesign = async () => {
      try {
        const lastDesignId = await getItem("last-design-id", undefined, null);
        if (lastDesignId && typeof lastDesignId === "string") {
          await loadDesign(lastDesignId);
        }
      } catch (error) {}
    };
    if (availableDesigns.length > 0 && !currentDesign) {
      loadLastDesign();
    }
  }, [availableDesigns, currentDesign, loadDesign, getItem]);
  useEffect(() => {
    if (currentDesign) {
      setItem("last-design-id", currentDesign.id);
    }
  }, [currentDesign, setItem]);
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
