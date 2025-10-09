import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ProjectPrompt = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <div className="text-center space-y-6">
        <h2 className="text-xl font-ark text-white tracking-wider mb-4">
          {t("no_project_selected")}
        </h2>
        <p className="text-white/70 font-agency text-sm mb-8">
          {t("create_or_load_project")}
        </p>
        
        <div className="flex flex-col gap-3">
          <div
            onClick={() => navigate("/")}
            className="px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-white text-black hover:opacity-80 cursor-pointer"
            style={{ transform: "skewX(-15deg)" }}
          >
            <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
              {t("create_new_project")}
            </span>
          </div>

          <div
            onClick={() => navigate("/Activity")}
            className="px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul bg-viol text-white hover:opacity-80 cursor-pointer"
            style={{ transform: "skewX(-15deg)" }}
          >
            <span style={{ transform: "skewX(15deg)" }} className="relative inline-block">
              {t("load_project_from_activity")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPrompt;