import { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import PageNavigation from "../../Common/modules/PageNavigation";

const Blender: FunctionComponent = () => {
  const { t } = useTranslation();
  
  return (
   <div className="relative w-full h-full flex flex-col">
        <PageNavigation currentPage="/Blender" />
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="font-manu text-white text-lg">
            {t("blender_compatibility_coming_soon")}
          </div>
        </div>
      </div>
  );
};
export default Blender;
