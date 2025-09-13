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
  const { getItem, setItem, removeDesignFolder } = useFileStorage();
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
        
        try {
          await setItem(`design-${designId}`, design, "global");
        } catch (err) {
          throw new Error(`Failed to save design metadata: ${err instanceof Error ? err.message : String(err)}`);
        }
        
        try {
          const designsList = (await getItem("designs-list", "global")) || [];
          const updatedList = Array.isArray(designsList)
            ? [...designsList, designId]
            : [designId];
          await setItem("designs-list", updatedList, "global");
        } catch (err) {
          throw new Error(`Failed to update designs list: ${err instanceof Error ? err.message : String(err)}`);
        }
        
        setCurrentDesign(design);
        window.dispatchEvent(
          new CustomEvent("newDesignCreated", { detail: { design } })
        );
        
        try {
          await refreshDesigns();
        } catch (err) {
          throw new Error(`Failed to refresh designs: ${err instanceof Error ? err.message : String(err)}`);
        }
        
        return design;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(errorMessage.startsWith('Failed') ? errorMessage : `Failed to create design: ${errorMessage}`);
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

        const designData = await getItem(`design-${designId}`, "global");
        const designName = (designData as Design).name;

        const designsList = (await getItem("designs-list", "global")) || [];
        const updatedList = Array.isArray(designsList)
          ? designsList.filter((id) => id !== designId)
          : [];
        await setItem("designs-list", updatedList, "global");

        await setItem(`design-${designId}`, null, "global");

        await removeDesignFolder(designId, designName);
        
        await refreshDesigns();
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [getItem, setItem, removeDesignFolder, currentDesign, refreshDesigns]
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
    [getItem, setItem]
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
