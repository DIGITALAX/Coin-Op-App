import { useTranslation } from "react-i18next";
import { TemplateChoice } from "../types/format.types";
const useFormat = () => {
  const { t } = useTranslation();
  
  const getTemplateCategory = (type: TemplateChoice["type"]): string => {
    switch (type) {
      case "hoodie":
        return t("apparel");
      case "shirt":
        return t("apparel");
      case "poster":
        return t("print");
      case "sticker":
        return t("print");
      default:
        return t("item");
    }
  };

  const getTemplateTypeName = (type: TemplateChoice["type"]): string => {
    switch (type) {
      case "hoodie":
        return t("hoodie");
      case "shirt":
        return t("shirt");
      case "poster":
        return t("poster");
      case "sticker":
        return t("sticker");
      default:
        return t("item");
    }
  };

  return {
    getTemplateCategory,
    getTemplateTypeName,
  };
};
export default useFormat;
