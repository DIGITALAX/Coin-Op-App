import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
export const useComfyUIModels = (comfyUrl: string, modelType: string) => {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchModels = async () => {
      if (!comfyUrl || !modelType) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await invoke<string[]>('comfyui_get_models', {
          comfyUrl,
          modelType
        });
        setModels(result);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, [comfyUrl, modelType]);
  return { models, loading, error };
};