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
    async <T>(key: string): Promise<T | null> => {
      if (!currentDesign) {
        return null;
      }
      return fileGetItem<T>(key, currentDesign.id, currentDesign.name);
    },
    [currentDesign, fileGetItem]
  );
  const setItem = useCallback(
    async (key: string, value: any): Promise<void> => {
      if (!currentDesign) {
        return;
      }
      return fileSetItem(key, value, currentDesign.id, currentDesign.name);
    },
    [currentDesign, fileSetItem]
  );
  const removeItemDesign = useCallback(
    async (key: string): Promise<void> => {
      if (!currentDesign) {
        return;
      }
      return removeItem(key, currentDesign.id, currentDesign.name);
    },
    [currentDesign, removeItem]
  );
  return { getItem, setItem, removeItem: removeItemDesign };
};
