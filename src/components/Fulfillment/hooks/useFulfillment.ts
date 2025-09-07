import { useState, useMemo } from "react";
import { useApp } from "../../../context/AppContext";
import {
  FulfillmentSelection,
  Fulfiller,
  Material,
} from "../types/fulfillment.types";
import { getCurrentTemplate } from "../../Synth/utils/templateHelpers";
import useMaterials from "./useMaterials";
const useFulfillment = () => {
  const { selectedLayer, isBackSide, selectedTemplate } = useApp();
  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const { materials, loading, filterMaterialsByTag } = useMaterials();

  const [fulfillmentSelection, setFulfillmentSelection] =
    useState<FulfillmentSelection>({
      fulfiller: null,
      baseColors: [],
      materials: [],
    });
  const selectFulfiller = (fulfiller: Fulfiller) => {
    setFulfillmentSelection((prev) => ({
      ...prev,
      fulfiller,
    }));
  };
  const toggleBaseColor = (color: string) => {
    setFulfillmentSelection((prev) => ({
      ...prev,
      baseColors: prev.baseColors.includes(color)
        ? prev.baseColors.filter(c => c !== color)
        : [...prev.baseColors, color],
    }));
  };
  const toggleMaterial = (material: Material) => {
    setFulfillmentSelection((prev) => ({
      ...prev,
      materials: prev.materials.find(m => m.title === material.title)
        ? prev.materials.filter(m => m.title !== material.title)
        : [...prev.materials, material],
    }));
  };
  const calculateBaseTotal = useMemo(() => {
    if (!selectedLayer) return 0;
    const basePrice = parseFloat(currentTemplate?.price!) / 1e18;
    const childrenPrice = (currentTemplate?.childReferences || []).reduce(
      (sum, child) => {
        return sum + parseFloat(child.price) / 1e18;
      },
      0
    );
    return basePrice + childrenPrice;
  }, [selectedLayer]);
  const calculateTotal = useMemo(() => {
    if (!selectedLayer) return 0;
    const baseTotal = calculateBaseTotal;
    const materialsPrice = fulfillmentSelection.materials.reduce(
      (sum, material) => sum + material.price, 0
    );
    return baseTotal + materialsPrice;
  }, [selectedLayer, fulfillmentSelection.materials, calculateBaseTotal]);
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };
  const getColorName = (hexColor: string) => {
    const colorMap: { [key: string]: string } = {
      "#fff": "White",
      "#000": "Black",
      "#ff0000": "Red",
      "#00ff00": "Green",
      "#0000ff": "Blue",
    };
    return colorMap[hexColor.toLowerCase()] || hexColor;
  };
  const getMaterialTypeForTemplate = (templateType: string) => {
    if (templateType === "poster") {
      return "print";
    }
    if (templateType === "sticker") {
      return "print";
    }
    return "apparel";
  };

  const getFilteredMaterials = () => {
    if (!selectedTemplate) return [];
    return filterMaterialsByTag(selectedTemplate.template_type);
  };
  const resetFulfillmentSelection = () => {
    setFulfillmentSelection({
      fulfiller: null,
      baseColors: [],
      materials: [],
    });
  };
  return {
    fulfillmentSelection,
    selectFulfiller,
    toggleBaseColor,
    toggleMaterial,
    calculateBaseTotal,
    calculateTotal,
    formatPrice,
    getColorName,
    resetFulfillmentSelection,
    loading,
    getFilteredMaterials,
  };
};
export default useFulfillment;
