import { useCallback } from "react";
import { useDesignContext } from "../../../context/DesignContext";
import { useFileStorage } from "./useFileStorage";
export const useDesignStorage = () => {
  const { currentDesign } = useDesignContext();
  const {
    getItem: fileGetItem,
    setItem: fileSetItem,
    removeItem,
  } = useFileStorage();
  const getItem = useCallback(
    async <T>(
      key: string,
      mode?: "synth" | "composite" | string,
      defaultValue?: T
    ): Promise<T | null> => {
      if (currentDesign) {
        return fileGetItem<T>(key, currentDesign.id, defaultValue);
      }
      return fileGetItem<T>(key, mode, defaultValue);
    },
    [currentDesign, fileGetItem]
  );
  const setItem = useCallback(
    async (
      key: string,
      value: any,
      mode?: "synth" | "composite" | string
    ): Promise<void> => {
      if (currentDesign) {
        return fileSetItem(key, value, currentDesign.id);
      }
      return fileSetItem(key, value, mode);
    },
    [currentDesign, fileSetItem]
  );
  const removeItemDesign = useCallback(
    async (
      key: string,
      mode?: "synth" | "composite" | string
    ): Promise<void> => {
      if (currentDesign) {
        return removeItem(key, currentDesign.id);
      }
      return removeItem(key, mode);
    },
    [currentDesign, removeItem]
  );
  return { getItem, setItem, removeItem: removeItemDesign };
};
