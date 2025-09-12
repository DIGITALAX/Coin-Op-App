import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../context/AppContext";
import {
  Color,
  FulfillmentSelection,
  Material,
} from "../types/fulfillment.types";
import { getCurrentTemplate } from "../../Synth/utils/templateHelpers";
import useMaterialsAndColors from "./useMaterialsAndColors";
import { useDesignContext } from "../../../context/DesignContext";
import { useDesignStorage } from "../../Activity/hooks/useDesignStorage";
const useFulfillment = () => {
  const { t } = useTranslation();
  const { selectedLayer, isBackSide, selectedTemplate } = useApp();
  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);
  const { loading, filterMaterialsColorsByTag } = useMaterialsAndColors();
  const { currentDesign } = useDesignContext();
  const { getItem, setItem } = useDesignStorage();

  const [fulfillmentSelection, setFulfillmentSelection] =
    useState<FulfillmentSelection>({
      color: null,
      material: null,
    });

  useEffect(() => {
    const loadFulfillmentData = async () => {
      if (currentDesign?.id) {
        const savedFulfillment = (await getItem(
          "fulfillment"
        )) as FulfillmentSelection | null;
        if (savedFulfillment) {
          setFulfillmentSelection(savedFulfillment);
        }
      }
    };
    loadFulfillmentData();
  }, [currentDesign?.id, getItem]);

  useEffect(() => {
    const saveFulfillmentData = async () => {
      if (
        currentDesign?.id &&
        (fulfillmentSelection.color || fulfillmentSelection.material)
      ) {
        await setItem("fulfillment", fulfillmentSelection);
      }
    };
    saveFulfillmentData();
  }, [fulfillmentSelection, currentDesign?.id, setItem]);
  const toggleColor = (color: Color) => {
    setFulfillmentSelection((prev) => ({
      ...prev,
      color: prev.color?.title == color.title ? null : color,
    }));
  };
  const toggleMaterial = (material: Material) => {
    setFulfillmentSelection((prev) => ({
      ...prev,
      material: prev.material?.title == material.title ? null : material,
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
    const materialPrice = Number(fulfillmentSelection.material?.price);
    return baseTotal + materialPrice;
  }, [selectedLayer, fulfillmentSelection.material, calculateBaseTotal]);
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

  const getFilteredMaterialsColors = () => {
    if (!selectedTemplate) return [];
    return filterMaterialsColorsByTag(selectedTemplate.template_type);
  };

  return {
    fulfillmentSelection,
    toggleColor,
    toggleMaterial,
    calculateTotal,
    formatPrice,
    getColorName,
    loading,
    getFilteredMaterialsColors,
  };
};
export default useFulfillment;
