import { useCallback, useState, useEffect, RefObject } from "react";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useApp } from "../../../context/AppContext";
import { useDesignContext } from "../../../context/DesignContext";
import { Template } from "../../Format/types/format.types";
import { CompositeCanvasRef } from "../types/composite.types";
import { getImageUrl } from "../../../lib/imageUtils";

const useComposite = (
  selectedLayer: Template,
  templateChild: Template | null,
  compositeCanvasRef?: RefObject<CompositeCanvasRef | null>
) => {
  const { getItem, setItem, removeItem } = useDesignStorage();
  const { isBackSide, selectedTemplate } = useApp();
  const { currentDesign } = useDesignContext();
  const getStorageKey = useCallback(() => {
    const side = isBackSide ? "back" : "front";
    return `compositeImage_${currentDesign?.id || "default"}_${side}`;
  }, [isBackSide, currentDesign?.id]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  useEffect(() => {
    const loadGeneratedImage = async () => {
      try {
        const saved = await getItem(getStorageKey());
        setGeneratedImage(typeof saved === "string" ? saved : null);
      } catch (error) {}
    };
    loadGeneratedImage();
  }, [getStorageKey, getItem]);
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        if (generatedImage) {
          await setItem(getStorageKey(), generatedImage);
        } else {
          await removeItem(getStorageKey());
        }
      } catch (error) {}
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [generatedImage, getStorageKey, setItem, removeItem]);
  const handleImageGenerated = useCallback((imageUrl: string) => {
    setGeneratedImage(imageUrl);
  }, []);
  const deleteGeneratedImage = useCallback(() => {
    setGeneratedImage(null);
  }, []);

  const handleChildClick = useCallback(
    async (childUri: string) => {
      if (!selectedLayer || !compositeCanvasRef?.current) {
        return;
      }
      const saved: any[] = (await getItem("canvasHistory")) || [];
      let childImageData: string | null = null;
      let originalChildUri = childUri;

      if (saved && (saved).length > 0) {
        if (childUri.startsWith("data:")) {
          const childIndex = templateChild?.childReferences.findIndex(
            (c) => c.uri === childUri
          );
          if (childIndex !== undefined && childIndex >= 0) {
            const originalTemplate = selectedTemplate?.templates.find(
              (t) => t.templateId === selectedLayer.templateId
            );
            if (
              originalTemplate &&
              originalTemplate.childReferences[childIndex]
            ) {
              originalChildUri =
                originalTemplate.childReferences[childIndex].uri;
            }
          }
        }
        const historyItem = saved.find(
          (item: any) =>
            item.childUri === originalChildUri &&
            item.layerTemplateId === selectedLayer.templateId
        ) as any;
        if (historyItem && historyItem.canvasData) {
          childImageData = historyItem.canvasData;
        }
      }
      let imageToAdd: string;
      let childRef = templateChild?.childReferences.find(
        (c) => c.uri === originalChildUri
      );
      if (childImageData) {
        imageToAdd = childImageData;
      } else {
        if (childRef?.child?.metadata?.image) {
          imageToAdd = getImageUrl(childRef.child.metadata.image);
        } else {
          imageToAdd = getImageUrl(childUri);
        }
      }
      const transforms = childRef?.metadata
        ? {
            x: childRef.metadata.x,
            y: childRef.metadata.y,
            scale: childRef.metadata.scale,
            rotation: childRef.metadata.rotation,
            flip: childRef.metadata.flip,
          }
        : {};

      if (compositeCanvasRef.current && childRef) {
        compositeCanvasRef.current.addChild(
          imageToAdd,
          originalChildUri,
          transforms
        );
      }
    },
    [
      selectedLayer,
      templateChild,
      compositeCanvasRef,
      getItem,
      selectedTemplate,
    ]
  );

  return {
    handleChildClick,
    generatedImage,
    handleImageGenerated,
    deleteGeneratedImage,
    setGeneratedImage,
  };
};
export default useComposite;
