import {
  writeTextFile,
  readTextFile,
  exists,
  remove,
  mkdir,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { useCallback } from "react";

let directoriesInitialized = false;

const safeMkdir = async (directory: string) => {
  try {
    await mkdir(directory, {
      baseDir: BaseDirectory.AppData,
      recursive: true,
    });
  } catch (error: any) {
    const message = error?.message || "";
    if (!/File exists|os error 17/i.test(message)) {
      throw error;
    }
  }
};

const initializeDirectories = async () => {
  if (directoriesInitialized) return;
  
  try {
    await safeMkdir("global");
    await safeMkdir("global/images");
    await safeMkdir("designs");
    
    directoriesInitialized = true;
  } catch (error) {
  }
};

export const useFileStorage = () => {
  const setItem = useCallback(
    async (key: string, value: any, mode: string, designName?: string): Promise<void> => {
      try {
        await initializeDirectories();
        
        let filePath: string;

        if (mode === "global") {
          filePath = `global/${key}.json`;
        } else {
          if (!designName) {
            throw new Error("Design name is required for design files");
          }
          const folderName = `design-${mode}-${designName.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
          filePath = `designs/${folderName}/${key}.json`;
        }

        if (value === null || value === undefined) {
          const fileExists = await exists(filePath, {
            baseDir: BaseDirectory.AppData,
          });
          if (fileExists) {
            await remove(filePath, { baseDir: BaseDirectory.AppData });
          }
          return;
        }

        if (mode !== "global") {
          const folderName = `design-${mode}-${designName!.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
          
          await safeMkdir(`designs/${folderName}`);
          await safeMkdir(`designs/${folderName}/images`);
        }

        const data = JSON.stringify(value, null, 2);
        await writeTextFile(filePath, data, {
          baseDir: BaseDirectory.AppData,
        });
      } catch (error) {
        throw error;
      }
    },
    []
  );
  const getItem = useCallback(
    async <T>(key: string, mode: string, designName?: string): Promise<T | null> => {
      try {
        await initializeDirectories();
        
        let filePath: string;
        
        if (mode === "global") {
          filePath = `global/${key}.json`;
        } else {
          if (!designName) {
            const oldFileName = `design-${mode}_${key}.json`;
            const oldFileExists = await exists(oldFileName, {
              baseDir: BaseDirectory.AppData,
            });
            if (oldFileExists) {
              const data = await readTextFile(oldFileName, {
                baseDir: BaseDirectory.AppData,
              });
              return JSON.parse(data);
            }
            return null;
          }
          const folderName = `design-${mode}-${designName.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
          filePath = `designs/${folderName}/${key}.json`;
        }

        const fileExists = await exists(filePath, {
          baseDir: BaseDirectory.AppData,
        });
        if (!fileExists) {
          return null;
        }
        const data = await readTextFile(filePath, {
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
    async (key: string, mode: string, designName?: string): Promise<void> => {
      try {
        let filePath: string;
        
        if (mode === "global") {
          filePath = `global/${key}.json`;
        } else {
          if (!designName) {
            const oldFileName = `design-${mode}_${key}.json`;
            const oldFileExists = await exists(oldFileName, {
              baseDir: BaseDirectory.AppData,
            });
            if (oldFileExists) {
              await remove(oldFileName, {
                baseDir: BaseDirectory.AppData,
              });
            }
            return;
          }
          const folderName = `design-${mode}-${designName.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
          filePath = `designs/${folderName}/${key}.json`;
        }
        
        const fileExists = await exists(filePath, {
          baseDir: BaseDirectory.AppData,
        });
        if (fileExists) {
          await remove(filePath, {
            baseDir: BaseDirectory.AppData,
          });
        }
      } catch (error) {
        throw error;
      }
    },
    []
  );
  const removeDesignFolder = useCallback(
    async (designId: string, designName: string): Promise<void> => {
      try {
        const folderName = `design-${designId}-${designName.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
        const folderPath = `designs/${folderName}`;
        
        await invoke('remove_directory_recursive', {
          path: folderPath
        });
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const saveBinaryFile = useCallback(
    async (fileName: string, blob: Blob, mode: string, designName?: string): Promise<string> => {
      try {
        await initializeDirectories();
        
        let filePath: string;
        
        if (mode === "global") {
          filePath = `global/images/${fileName}`;
        } else {
          if (!designName) {
            throw new Error("Design name is required for design binary files");
          }
          const folderName = `design-${mode}-${designName.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
          filePath = `designs/${folderName}/images/${fileName}`;
          
          const designFolderExists = await exists(`designs/${folderName}`, {
            baseDir: BaseDirectory.AppData,
          });
          if (!designFolderExists) {
            await mkdir(`designs/${folderName}`, {
              baseDir: BaseDirectory.AppData,
            });
            await mkdir(`designs/${folderName}/images`, {
              baseDir: BaseDirectory.AppData,
            });
          } else {
            const imagesFolderExists = await exists(`designs/${folderName}/images`, {
              baseDir: BaseDirectory.AppData,
            });
            if (!imagesFolderExists) {
              await mkdir(`designs/${folderName}/images`, {
                baseDir: BaseDirectory.AppData,
              });
            }
          }
        }

        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        await invoke('save_binary_file', {
          path: filePath,
          data: Array.from(uint8Array)
        });
        
        return filePath;
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const getBinaryFileUrl = useCallback(
    async (filePath: string): Promise<string> => {
      try {
        const base64Data = await invoke<string>('read_binary_file_as_base64', {
          path: filePath
        });
        
        const extension = filePath.split('.').pop()?.toLowerCase();
        const mimeType = extension === 'png' ? 'image/png' : 
                        extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 
                        'application/octet-stream';
        
        return `data:${mimeType};base64,${base64Data}`;
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const removeBinaryFile = useCallback(
    async (filePath: string): Promise<void> => {
      try {
        const fileExists = await exists(filePath, {
          baseDir: BaseDirectory.AppData,
        });
        if (fileExists) {
          await remove(filePath, {
            baseDir: BaseDirectory.AppData,
          });
        }
      } catch (error) {
        throw error;
      }
    },
    []
  );

  return { 
    setItem, 
    getItem, 
    removeItem, 
    removeDesignFolder,
    saveBinaryFile,
    getBinaryFileUrl,
    removeBinaryFile
  };
};
