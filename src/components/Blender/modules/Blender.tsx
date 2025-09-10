import { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import PageNavigation from "../../Common/modules/PageNavigation";

const Blender: FunctionComponent = () => {
  const { t } = useTranslation();
  
  return (
   <div className="relative w-full h-full flex flex-col">
       
        <PageNavigation currentPage="/Blender" />
      </div>
  );
};
export default Blender;
