import { useState, useCallback, useEffect } from "react";
import { Template } from "../../Format/types/format.types";
import { UseInteractiveCanvasReturn } from "../types/synth.types";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
import { useDesignContext } from "../../../context/DesignContext";
import { useApp } from "../../../context/AppContext";

export const useInteractiveCanvas = (
  initialTemplate: Template | null
): UseInteractiveCanvasReturn => {
  const { getItem, setItem } = useDesignStorage();
  const { currentDesign } = useDesignContext();
  const { isBackSide } = useApp();

  const [templateChild, setTemplate] = useState<Template | null>(
    initialTemplate
  );
  useEffect(() => {
    setTemplate(initialTemplate);
  }, [initialTemplate]);
  const updateChildCanvas = useCallback(
    (childIndex: number, newUri: string) => {
      setTemplate((prev) => {
        if (!prev || !prev.childReferences[childIndex]) return prev;
        const updatedChildren = [...prev.childReferences];
        updatedChildren[childIndex] = {
          ...updatedChildren[childIndex],
          child: {
            ...updatedChildren[childIndex].child,
            metadata: {
              ...updatedChildren[childIndex].child?.metadata,
              image: newUri,
            },
          },
        };
        const updated = {
          ...prev,
          childReferences: updatedChildren,
        };
        (async () => {
          await setItem(
            `interactiveCanvas_${currentDesign?.id}_${
              isBackSide ? "back" : "front"
            }`,
            updated
          );
          window.dispatchEvent(
            new CustomEvent("interactiveCanvasUpdate", {
              detail: { templateId: prev.templateId },
            })
          );
        })();
        return updated;
      });
    },
    [setItem, currentDesign?.id, isBackSide]
  );
  useEffect(() => {
    if (initialTemplate?.templateId) {
      const loadSaved = async () => {
        try {
          const saved = await getItem(
            `interactiveCanvas_${currentDesign?.id}_${
              isBackSide ? "back" : "front"
            }`
          );
          if (
            saved &&
            typeof saved === "object" &&
            "childReferences" in saved &&
            Array.isArray(saved.childReferences)
          ) {
            setTemplate(saved as Template);
          }
        } catch (error) {}
      };
      loadSaved();
    }
  }, [initialTemplate?.templateId, getItem, currentDesign?.id, isBackSide]);
  useEffect(() => {
    if (!initialTemplate?.templateId) return;
    const handleUpdate = (event: any) => {
      if (event.detail.templateId === initialTemplate.templateId) {
        const loadSaved = async () => {
          try {
            const saved = await getItem(
              `interactiveCanvas_${currentDesign?.id}_${
                isBackSide ? "back" : "front"
              }`
            );
            if (
              saved &&
              typeof saved === "object" &&
              "childReferences" in saved &&
              Array.isArray(saved.childReferences)
            ) {
              setTemplate(saved as Template);
            }
          } catch (error) {}
        };
        loadSaved();
      }
    };
    window.addEventListener("interactiveCanvasUpdate", handleUpdate);
    return () =>
      window.removeEventListener("interactiveCanvasUpdate", handleUpdate);
  }, [initialTemplate?.templateId, getItem, currentDesign?.id, isBackSide]);
  return {
    updateChildCanvas,
    templateChild,
  };
};
