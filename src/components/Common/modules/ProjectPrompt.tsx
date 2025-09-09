import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ProjectPrompt = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <div className="text-center space-y-6">
        <h2 className="text-xl font-satB text-white tracking-wider mb-4">
          {t("no_project_selected")}
        </h2>
        <p className="text-white/70 font-mana text-sm mb-8">
          {t("create_or_load_project")}
        </p>
        
        <div className="flex flex-col gap-3">
          <div
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-ama hover:opacity-70 text-black rounded font-mana text-xs cursor-pointer transition-opacity"
          >
            {t("create_new_project")}
          </div>
          
          <div
            onClick={() => navigate("/Activity")}
            className="px-6 py-3 bg-gris hover:opacity-70 text-white rounded font-mana text-xs cursor-pointer transition-opacity"
          >
            {t("load_project_from_activity")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPrompt;