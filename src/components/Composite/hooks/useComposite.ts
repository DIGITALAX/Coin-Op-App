import { useCallback, useState, useEffect, RefObject } from "react";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useApp } from "../../../context/AppContext";
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
  const getStorageKey = useCallback(() => {
    const side = isBackSide ? "back" : "front";
    return `compositeImage_${selectedLayer?.templateId || "default"}_${side}`;
  }, [isBackSide, selectedLayer?.templateId]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  useEffect(() => {
    const loadGeneratedImage = async () => {
      try {
        const saved = await getItem(getStorageKey(), "composite");
        setGeneratedImage(typeof saved === "string" ? saved : null);
      } catch (error) {}
    };
    loadGeneratedImage();
  }, [getStorageKey, getItem]);
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        if (generatedImage) {
          await setItem(getStorageKey(), generatedImage, "composite");
        } else {
          await removeItem(getStorageKey(), "composite");
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


  const captureAndSaveComposite = useCallback(async () => {
    if (!selectedLayer || !compositeCanvasRef?.current) {
      return;
    }
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const canvasDataURL = await compositeCanvasRef.current.captureCanvas();
      if (canvasDataURL) {
        const side = isBackSide ? "back" : "front";
        const captureKey = `compositeCanvasCapture_${selectedLayer.templateId}_${side}`;
        await setItem(captureKey, canvasDataURL, "composite");
      }
    } catch (error) {}
  }, [selectedLayer, compositeCanvasRef, isBackSide, setItem]);

  const handleChildClick = useCallback(
    async (childUri: string) => {
   
      if (!selectedLayer || !compositeCanvasRef?.current) {
        return;
      }
      const saved = await getItem("canvasHistory", "synth", []);
      let childImageData: string | null = null;
      let originalChildUri = childUri;
      
      if (saved && saved.length > 0) {
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
      let childRef = templateChild?.childReferences.find(c => c.uri === originalChildUri);
      console.log({childRef, childImageData})
      if (childImageData) {
        imageToAdd = childImageData;
      } else {
        if (childRef?.child?.metadata?.image) {
          imageToAdd = getImageUrl(childRef.child.metadata.image);
          console.log({imageToAdd})
        } else {
          imageToAdd = getImageUrl(childUri);
        }
      }
      console.log({imageToAdd})
      const transforms = childRef?.metadata ? {
        x: childRef.metadata.x,
        y: childRef.metadata.y,
        scale: childRef.metadata.scale,
        rotation: childRef.metadata.rotation,
        flip: childRef.metadata.flip,
      } : {};
      
      if (compositeCanvasRef.current && childRef) {
        compositeCanvasRef.current.addChild(imageToAdd, originalChildUri, transforms);
      }
    },
    [selectedLayer, templateChild, compositeCanvasRef, getItem, selectedTemplate]
  );

  return {
    handleChildClick,
    generatedImage,
    handleImageGenerated,
    deleteGeneratedImage,
    setGeneratedImage,
    captureAndSaveComposite,
  };
};
export default useComposite;
