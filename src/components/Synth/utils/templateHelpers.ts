import { Template } from "../../Format/types/format.types";

export const getCurrentTemplate = (
  selectedLayer: {front: Template, back?: Template} | null,
  isBackSide: boolean
): Template | null => {
  if (!selectedLayer) return null;
  return isBackSide && selectedLayer.back ? selectedLayer.back : selectedLayer.front;
};

export const getCurrentTemplateId = (
  selectedLayer: {front: Template, back?: Template} | null,
  isBackSide: boolean
): string => {
  const template = getCurrentTemplate(selectedLayer, isBackSide);
  return template?.templateId || "";
};