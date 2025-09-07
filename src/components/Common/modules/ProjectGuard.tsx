import { FunctionComponent } from "react";
import { useDesignContext } from "../../../context/DesignContext";
import ProjectPrompt from "./ProjectPrompt";
import { ProjectGuardProps } from "../types/common.types";

const ProjectGuard: FunctionComponent<ProjectGuardProps> = ({ children }) => {
  const { currentDesign } = useDesignContext();

  if (!currentDesign) {
    return <ProjectPrompt />;
  }

  return <>{children}</>;
};

export default ProjectGuard;
