import {
  writeTextFile,
  readTextFile,
  exists,
  remove,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { useCallback } from "react";
export const useFileStorage = () => {
  const setItem = useCallback(
    async (key: string, value: any, mode: string): Promise<void> => {
      try {
        let fileName: string;

        if (mode == "global") {
          fileName = `${key}.json`;
        } else {
          fileName = `design-${mode}_${key}.json`;
        }

        if (value === null || value === undefined) {
          const fileExists = await exists(fileName, {
            baseDir: BaseDirectory.AppData,
          });
          if (fileExists) {
            await remove(fileName, { baseDir: BaseDirectory.AppData });
          }
          return;
        }
        const data = JSON.stringify(value, null, 2);
        await writeTextFile(fileName, data, {
          baseDir: BaseDirectory.AppData,
        });
      } catch (error) {
        throw error;
      }
    },
    []
  );
  const getItem = useCallback(
    async <T>(key: string, mode: string): Promise<T | null> => {
      try {
        let fileName: string;
        if (mode == "global") {
          fileName = `${key}.json`;
        } else {
          fileName = `design-${mode}_${key}.json`;
        }

        const fileExists = await exists(fileName, {
          baseDir: BaseDirectory.AppData,
        });
        if (!fileExists) {
          return null;
        }
        const data = await readTextFile(fileName, {
          baseDir: BaseDirectory.AppData,
        });
        return JSON.parse(data);
      } catch (error) {
        return null;
      }
    },
    []
  );
  const removeItem = useCallback(
    async (key: string, mode: string): Promise<void> => {
      try {
        let fileName: string;
        
        if (mode == "global") {
          fileName = `${key}.json`;
        } else {
          fileName = `design-${mode}_${key}.json`;
        }
        
        const fileExists = await exists(fileName, {
          baseDir: BaseDirectory.AppData,
        });
        if (fileExists) {
          await remove(fileName, {
            baseDir: BaseDirectory.AppData,
          });
        }
      } catch (error) {
        throw error;
      }
    },
    []
  );
  return { setItem, getItem, removeItem };
};
