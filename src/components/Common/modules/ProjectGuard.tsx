import { FunctionComponent, ReactNode } from "react";
import { useDesignContext } from "../../../context/DesignContext";
import ProjectPrompt from "./ProjectPrompt";

interface ProjectGuardProps {
  children: ReactNode;
}

const ProjectGuard: FunctionComponent<ProjectGuardProps> = ({ children }) => {
  const { currentDesign } = useDesignContext();
  
  if (!currentDesign) {
    return <ProjectPrompt />;
  }
  
  return <>{children}</>;
};

export default ProjectGuard;