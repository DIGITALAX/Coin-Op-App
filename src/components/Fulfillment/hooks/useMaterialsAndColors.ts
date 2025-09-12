import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChildData, Color, Material } from "../types/fulfillment.types";

const useMaterialsAndColors = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMaterialsColors = async () => {
    setLoading(true);

    try {
      const childrenData = await invoke<{
        materials: ChildData[];
        colors: ChildData[];
      }>("fetch_children_materials_colors");

      const materialsData: Material[] = childrenData.materials.map((child) => ({
        title: child.metadata?.title || "Unknown Material",
        description: child.metadata?.description,
        price: parseFloat(child.price) / 1e18,
        type: child.childType,
        tags: child.metadata?.tags || [],
        childId: child.childId,
        childContract: child.childContract,
      }));
      const colorsData: Color[] = childrenData.colors.map((child) => ({
        title: child.metadata?.title || "Unknown Color",
        description: child.metadata?.description,
        price: parseFloat(child.price) / 1e18,
        type: child.childType,
        tags: child.metadata?.tags || [],
        childId: child.childId,
        childContract: child.childContract,
      }));

      setMaterials(materialsData);
      setColors(colorsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterialsColors();
  }, []);

  const filterMaterialsColorsByTag = (templateType: string) => {
    const targetTag =
      templateType === "poster" || templateType === "sticker"
        ? "print"
        : "apparel";

    return {
      materials: materials.filter((material) =>
        material.tags?.includes(targetTag)
      ),
      colors: colors.filter((color) => color.tags?.includes(targetTag)),
    };
  };

  return {
    loading,
    filterMaterialsColorsByTag,
  };
};

export default useMaterialsAndColors;
