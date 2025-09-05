import { useState, useMemo } from "react";
import { useApp } from "../../../context/AppContext";
import {
  FulfillmentSelection,
  Fulfiller,
  Material,
} from "../types/fulfillment.types";
import { getCurrentTemplate } from "../../Synth/utils/templateHelpers";
const useFulfillment = () => {
  const { selectedLayer, isBackSide } = useApp();
  const currentTemplate = getCurrentTemplate(selectedLayer, isBackSide);

  const [fulfillmentSelection, setFulfillmentSelection] =
    useState<FulfillmentSelection>({
      fulfiller: null,
      baseColor: null,
      material: null,
    });
  const selectFulfiller = (fulfiller: Fulfiller) => {
    setFulfillmentSelection((prev) => ({
      ...prev,
      fulfiller,
    }));
  };
  const selectBaseColor = (color: string) => {
    setFulfillmentSelection((prev) => ({
      ...prev,
      baseColor: color,
    }));
  };
  const selectMaterial = (material: Material) => {
    setFulfillmentSelection((prev) => ({
      ...prev,
      material,
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
    const materialPrice = fulfillmentSelection.material?.price || 0;
    return baseTotal + materialPrice;
  }, [selectedLayer, fulfillmentSelection.material, calculateBaseTotal]);
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
      return "poster";
    }
    if (templateType === "sticker") {
      return "sticker";
    }
    return "apparel";
  };
  const resetFulfillmentSelection = () => {
    setFulfillmentSelection({
      fulfiller: null,
      baseColor: null,
      material: null,
    });
  };
  return {
    fulfillmentSelection,
    selectFulfiller,
    selectBaseColor,
    selectMaterial,
    calculateBaseTotal,
    calculateTotal,
    formatPrice,
    getColorName,
    getMaterialTypeForTemplate,
    resetFulfillmentSelection,
  };
};
export default useFulfillment;
