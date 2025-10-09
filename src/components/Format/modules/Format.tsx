import { useTranslation } from "react-i18next";
import { INFURA_GATEWAY } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import useFormat from "../hooks/useFormat";
import { Link } from "react-router-dom";
import { TemplateChoice } from "../types/format.types";
export default function Format() {
  const { t } = useTranslation();
  const {
    selectedTemplate,
    selectTemplate,
    groupedTemplates,
    isLoadingTemplates,
  } = useApp();
  const { getTemplateCategory, getTemplateTypeName } = useFormat();

  if (isLoadingTemplates) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/images/settings.png"
            className="w-6 h-6 animate-spin"
            draggable={false}
          />
          <div className="text-white relative w-fit h-fit flex font-slim text-sm tracking-wider">
            {" "}
            <span className="absolute inset-0 text-azul translate-x-[3px] translate-y-[3px]">
              {t("loading_templates")}
            </span>
            <span className="absolute inset-0 text-amarillo translate-x-[2px] translate-y-[2px]">
              {t("loading_templates")}
            </span>
            <span className="absolute inset-0 text-turq translate-x-[1px] translate-y-[1px]">
              {t("loading_templates")}
            </span>
            <span className="relative text-white">
              {t("loading_templates")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="mb-6">
        <h2 className="text-xs font-pixel text-white tracking-wider mb-4">
          {t("select_template")}
        </h2>
        <div className="flex gap-4 pb-2">
          {groupedTemplates.map((template) => (
            <Link
              to={"/Layer"}
              key={template.name}
              className={`relative w-44 h-full flex-1 rounded-md bg-black ${
                selectedTemplate?.name === template.name
                  ? "border border-rosa opacity-60"
                  : "border-mar border"
              } cursor-pointer hover:opacity-80`}
              onClick={() => selectTemplate(template)}
            >
              <img
                src={`${INFURA_GATEWAY}/ipfs/${template.image}`}
                alt={template.name}
                className="w-full h-full object-cover rounded-md"
                draggable={false}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex w-4/5 md:w-3/5 h-fit bg-black p-2 rounded-md border border-rosa text-white font-pixel text-xs flex-col break-all">
                  <div className="relative w-fit h-fit flex items-start justify-center text-left break-all">
                    {getTemplateCategory(
                      template.template_type as TemplateChoice["type"]
                    )}
                  </div>
                  <div className="relative w-full h-fit flex items-center justify-end text-right break-all">
                    <div className="relative w-fit h-fit flex">
                      {"> " +
                        getTemplateTypeName(
                          template.template_type as TemplateChoice["type"]
                        ).toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
