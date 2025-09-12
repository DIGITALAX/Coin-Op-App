import { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import PageNavigation from "../../Common/modules/PageNavigation";
import { useBlender } from "../hooks/useBlender";

const Blender: FunctionComponent = () => {
  const { t } = useTranslation();
  const { isApplicableItem, handleDownloadPlugin, selectedTemplate } = useBlender();
  
  if (!isApplicableItem) {
    return (
      <div className="relative w-full h-full flex flex-col">
        <PageNavigation currentPage="/Blender" />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
              <h1 className="font-satB text-white text-lg tracking-wider mb-4">
                {t("blender_integration")}
              </h1>
              <p className="font-mana text-red-400 text-sm">
                {t("blender_only_apparel")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
   <div className="relative w-full h-full flex flex-col">
        <PageNavigation currentPage="/Blender" />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
              <h1 className="font-satB text-white text-lg tracking-wider mb-4">
                {t("blender_integration")}
              </h1>
              <p className="font-mana text-ama text-xs mb-2">
                {t("blender_export_description", { itemType: selectedTemplate?.template_type })}
              </p>
            </div>
            
            <button
              onClick={handleDownloadPlugin}
              className="w-full border border-ama bg-black rounded-md p-4 hover:bg-ama/10 transition-colors text-white font-satB text-sm tracking-wider"
            >
              {t("download_blender_plugin")}
            </button>
            
            <div className="space-y-4 text-left">
              <h2 className="font-satB text-white text-sm tracking-wider">{t("installation_instructions")}:</h2>
              <ol className="font-mana text-white opacity-80 text-xs space-y-2 list-decimal list-inside">
                <li>{t("blender_step_1")}</li>
                <li>{t("blender_step_2")}</li>
                <li>{t("blender_step_3")}</li>
                <li>{t("blender_step_4")}</li>
                <li>{t("blender_step_5")}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
  );
};
export default Blender;
