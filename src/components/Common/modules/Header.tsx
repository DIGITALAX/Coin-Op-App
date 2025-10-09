import { useTranslation } from "react-i18next";
import PageNavigation from "./PageNavigation";
import { useState } from "react";

export default function Header() {
  const { t } = useTranslation();
  const [hideHeader, setHideHeader] = useState<boolean>(false);
  return (
    <div className="relative w-full h-fit flex flex-row items-start justify-between z-0">
      {!hideHeader && (
        <div className="relative w-fit h-fit flex justify-start">
          <div className="relative w-48 h-fit flex flex-col gap-2">
            <div
              className="text-white font-agency relative flex w-fit h-fit"
              dangerouslySetInnerHTML={{ __html: t("future") }}
            ></div>
            <div className="text-rosa relative text-3xl flex w-fit h-fit font-bobby">
              {t("media")}
            </div>
          </div>
        </div>
      )}
      {!hideHeader && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-fit h-fit flex justify-center z-0">
          <img
            draggable={false}
            src="/images/runway.png"
            className="relative flex w-[27rem] h-32 rounded-md border-2 border-oscurazul object-cover"
          />
        </div>
      )}
      <PageNavigation setHideHeader={setHideHeader} />
    </div>
  );
}
