import { TemplateChoice } from "../types/format.types";
const useFormat = () => {
  const getTemplateCategory = (type: TemplateChoice["type"]): string => {
    switch (type) {
      case "hoodie":
        return "Apparel";
      case "shirt":
        return "Apparel";
      case "poster":
        return "Print";
      case "sticker":
        return "Print";
      default:
        return "Item";
    }
  };

  return {
    getTemplateCategory,
  };
};
export default useFormat;
