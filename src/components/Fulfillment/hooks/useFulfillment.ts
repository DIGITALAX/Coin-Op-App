import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../context/AppContext";
import {
  FulfillmentSelection,
  Material,
} from "../types/fulfillment.types";
import { getCurrentTemplate } from "../../Synth/utils/templateHelpers";
import useMaterials from "./useMaterials";
import { useDesignContext } from "../../../context/DesignContext";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
const useFulfillment = () => {
  const { t } = useTranslation();
  const { selectedLayer, isBackSide, selectedTemplate } = useApp();
  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const { loading, filterMaterialsByTag } = useMaterials();
  const { currentDesign } = useDesignContext();
  const { getItem, setItem } = useDesignStorage();

  const [fulfillmentSelection, setFulfillmentSelection] =
    useState<FulfillmentSelection>({
      fulfiller: null,
      baseColors: [],
      materials: [],
    });

  useEffect(() => {
    const loadFulfillmentData = async () => {
      if (currentDesign?.id) {
        const savedFulfillment = await getItem("fulfillment", currentDesign.id, null) as FulfillmentSelection | null;
        if (savedFulfillment) {
          setFulfillmentSelection(savedFulfillment);
        }
      }
    };
    loadFulfillmentData();
  }, [currentDesign?.id, getItem]);

  useEffect(() => {
    const saveFulfillmentData = async () => {
      if (currentDesign?.id && (fulfillmentSelection.baseColors.length > 0 || fulfillmentSelection.materials.length > 0)) {
        await setItem("fulfillment", fulfillmentSelection, currentDesign.id);
      }
    };
    saveFulfillmentData();
  }, [fulfillmentSelection, currentDesign?.id, setItem]);
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
      "#fff": t("white"),
      "#000": t("black"),
    };
    return colorMap[hexColor.toLowerCase()] || hexColor;
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
    toggleBaseColor,
    toggleMaterial,
    calculateTotal,
    formatPrice,
    getColorName,
    resetFulfillmentSelection,
    loading,
    getFilteredMaterials,
  };
};
export default useFulfillment;
