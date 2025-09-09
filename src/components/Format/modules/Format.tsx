import { useTranslation } from "react-i18next";
import { INFURA_GATEWAY } from "../../../lib/constants";
import { useApp } from "../../../context/AppContext";
import useFormat from "../hooks/useFormat";
import PageNavigation from "../../Common/modules/PageNavigation";
import { Link } from "react-router-dom";
import { TemplateChoice } from "../types/format.types";
export default function Format() {
  const { t } = useTranslation();
  const { selectedTemplate, selectTemplate, groupedTemplates, isLoadingTemplates } = useApp();
  const { getTemplateCategory, getTemplateTypeName } = useFormat();

  if (isLoadingTemplates) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ama"></div>
          <div className="text-white font-satB text-lg tracking-wider">
            {t('loading_templates')}
          </div>
        </div>
        <PageNavigation currentPage="/" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="mb-6">
        <h2 className="text-lg font-satB text-white tracking-wider mb-4">
          {t('select_template')}
        </h2>
        <div className="flex gap-4 pb-2">
          {groupedTemplates.map((template) => (
            <Link
              to={"/Layer"}
              key={template.name}
              className={`relative h-full flex-1 rounded-md bg-black ${
                selectedTemplate?.name === template.name
                  ? "border border-white opacity-60"
                  : "border-ama border"
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
                <div className="relative flex w-4/5 md:w-3/5 h-fit bg-black p-2 rounded-md border border-ama text-white font-mana text-xs flex-col break-all">
                  <div className="relative w-fit h-fit flex items-start justify-center text-left break-all">
                    {getTemplateCategory(
                      template.template_type as TemplateChoice["type"]
                    )}
                  </div>
                  <div className="relative w-full h-fit flex items-center justify-end text-right break-all">
                    <div className="relative w-fit h-fit flex">
                      {"> " + getTemplateTypeName(template.template_type as TemplateChoice["type"]).toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <PageNavigation currentPage="/" />
    </div>
  );
}
