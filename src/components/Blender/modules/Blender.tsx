import { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { useBlender } from "../hooks/useBlender";

const Blender: FunctionComponent = () => {
  const { t } = useTranslation();
  const { isApplicableItem, handleDownloadPlugin, selectedTemplate } =
    useBlender();

  if (!isApplicableItem) {
    return (
      <div className="relative w-full h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
              <h1 className="font-ark text-white text-lg tracking-wider mb-4">
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
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="max-w-2xl justify-center items-center flex flex-col gap-8">
          <div className="space-y-4">
            <h1 className="font-ark text-white text-3xl tracking-wider mb-4">
              {t("blender_integration")}
            </h1>
            <p className="font-agency text-crema text-xs opacity-70">
              {t("in_development")}
            </p>
            <p className="font-agency text-crema text-lg mb-2">
              {t("blender_export_description", {
                itemType: selectedTemplate?.template_type,
              })}
            </p>
          </div>
          <div className="relative w-fit h-fit flex flex-row gap-1">
            <div className="relative w-fit h-fit flex">
              <img draggable={false} src="/images/arrow.png" className="relative w-10 h-6 object-contain flex rotate-90" />
            </div>
            <button
              onClick={handleDownloadPlugin}
              className="relative font-slim text-2xl tracking-wider hover:opacity-80 transition-opacity"
            >
              <span className="absolute inset-0 text-azul translate-x-[3px] translate-y-[3px]">
                {t("download_blender_plugin")}
              </span>
              <span className="absolute inset-0 text-amarillo translate-x-[2px] translate-y-[2px]">
                {t("download_blender_plugin")}
              </span>
              <span className="absolute inset-0 text-turq translate-x-[1px] translate-y-[1px]">
                {t("download_blender_plugin")}
              </span>
              <span className="relative text-white">
                {t("download_blender_plugin")}
              </span>
            </button>
          </div>

          <div className="space-y-4 text-left">
            <h2 className="font-agency text-white text-sm tracking-wider">
              {t("installation_instructions")}:
            </h2>
            <ol className="font-dos text-white opacity-80 text-xs space-y-2 list-decimal list-inside">
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
