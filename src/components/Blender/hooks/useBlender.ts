import { useApp } from "../../../context/AppContext";
import { openUrl } from "@tauri-apps/plugin-opener";

export const useBlender = () => {
  const { selectedTemplate } = useApp();

  const isApplicableItem = selectedTemplate?.template_type === "shirt" || selectedTemplate?.template_type === "hoodie";

  const handleDownloadPlugin = async () => {
    try {
      await openUrl("https://github.com/F3Manifesto/fashionsynth_blender");
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  };

  return {
    isApplicableItem,
    handleDownloadPlugin,
    selectedTemplate,
  };
};
