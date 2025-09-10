import { createContext, useContext, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Child,
  Template,
  GroupedTemplate,
} from "../components/Format/types/format.types";
import {
  AppContextType,
  AppProviderProps,
} from "../components/Common/types/common.types";

const AppContext = createContext<AppContextType | undefined>(undefined);
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<GroupedTemplate>();
  const [groupedTemplates, setGroupedTemplates] = useState<GroupedTemplate[]>(
    []
  );
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(true);
  const [selectedPatternChild, setSelectedPatternChild] =
    useState<Child | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<{front: Template, back?: Template} | null>(null);
  const [isBackSide, setIsBackSide] = useState<boolean>(false);

  useEffect(() => {
    const fetchTemplatesData = async () => {
      try {
        setIsLoadingTemplates(true);
        const data = await invoke<GroupedTemplate[]>("fetch_template_children");

        setGroupedTemplates(data);
        setSelectedTemplate(data[0]);

        const templateWithData = data.find(group => group.templates.length > 0);
        if (templateWithData) {
          setSelectedTemplate(templateWithData);
          setSelectedLayer({front: templateWithData.templates[0]});
          if (templateWithData.templates[0].childReferences?.length > 0) {
            setSelectedPatternChild(
              templateWithData.templates[0].childReferences[0] as Child
            );
          }
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplatesData();
  }, []);

  const selectTemplate = (templateChoice: GroupedTemplate) => {
     setSelectedTemplate(templateChoice);

    if (templateChoice && templateChoice.templates.length > 0) {
      setSelectedLayer({front: templateChoice.templates[0]});
      if (templateChoice.templates[0].childReferences.length > 0) {
        setSelectedPatternChild(
          templateChoice.templates[0].childReferences[0] as Child
        );
      }
    }
    setIsBackSide(false);
  };

  const selectLayer = (front: Template, back?: Template) => {
    setSelectedLayer({front, back});
    if (front.childReferences.length > 0) {
      setSelectedPatternChild(front.childReferences[0] as Child);
    }
    setIsBackSide(false);
  };
  const flipCanvas = () => {
    if (canFlip) {
      setIsBackSide(!isBackSide);
    }
  };

  const canFlip = (() => {
    if (!selectedLayer?.back) return false;
    return true;
  })();
    
  return (
    <AppContext.Provider
      value={{
        selectedPatternChild: selectedPatternChild!,
        setSelectedPatternChild,
        selectedTemplate,
        selectTemplate,
        selectedLayer: selectedLayer!,
        selectLayer,
        isBackSide,
        flipCanvas,
        canFlip,
        groupedTemplates,
        isLoadingTemplates,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
