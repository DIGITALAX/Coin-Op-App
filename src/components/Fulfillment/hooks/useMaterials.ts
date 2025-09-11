import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChildData, Material } from "../types/fulfillment.types";

const useMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const childrenData = await invoke<ChildData[]>("fetch_children_materials");
      
      const materialsData: Material[] = childrenData.map((child) => ({
        title: child.metadata?.title || "Unknown Material",
        description: child.metadata?.description,
        price: parseFloat(child.price) / 1e18,
        type: child.childType,
        tags: child.metadata?.tags || [],
        childId: child.childId,
        childContract: child.childContract
      }));
      
      setMaterials(materialsData);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const filterMaterialsByTag = (templateType: string) => {
    const targetTag = templateType === "poster" || templateType === "sticker" 
      ? "print" 
      : "apparel";
    
    return materials.filter(material => 
      material.tags?.includes(targetTag)
    );
  };

  return {
    materials,
    loading,
    error,
    fetchMaterials,
    filterMaterialsByTag,
  };
};

export default useMaterials;