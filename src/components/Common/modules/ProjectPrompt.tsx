import React from "react";
import { useNavigate } from "react-router-dom";

const ProjectPrompt = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <div className="text-center space-y-6">
        <h2 className="text-xl font-satB text-white tracking-wider mb-4">
          NO PROJECT SELECTED
        </h2>
        <p className="text-white/70 font-mana text-sm mb-8">
          Please create a new project or load an existing one to continue
        </p>
        
        <div className="flex flex-col gap-3">
          <div
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-ama hover:opacity-70 text-black rounded font-mana text-xs cursor-pointer transition-opacity"
          >
            CREATE NEW PROJECT
          </div>
          
          <div
            onClick={() => navigate("/Activity")}
            className="px-6 py-3 bg-gris hover:opacity-70 text-white rounded font-mana text-xs cursor-pointer transition-opacity"
          >
            LOAD PROJECT FROM ACTIVITY
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPrompt;