import { createContext, useContext,FunctionComponent } from "react";
import { DesignContextType } from "../components/Design/types/design.types";
import { useDesigns } from "../components/Design/hooks/useDesigns";
import { DesignProviderProps } from "../components/Common/types/common.types";
const DesignContext = createContext<DesignContextType | undefined>(undefined);

export const DesignProvider: FunctionComponent<DesignProviderProps> = ({
  children,
}) => {
  const designsHook = useDesigns();
  return (
    <DesignContext.Provider value={designsHook}>
      {children}
    </DesignContext.Provider>
  );
};
export const useDesignContext = (): DesignContextType => {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error("useDesignContext must be used within a DesignProvider");
  }
  return context;
};
