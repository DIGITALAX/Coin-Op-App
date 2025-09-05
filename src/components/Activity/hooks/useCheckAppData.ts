import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const useCheckAppData = () => {
  const [appDataPath, setAppDataPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDirectory = async () => {
      try {
        const path = await invoke<string>('check_app_data_directory');
        setAppDataPath(path);
      } catch (err) {
        setError(String(err));
      }
    };

    checkDirectory();
  }, []);

  return { appDataPath, error };
};