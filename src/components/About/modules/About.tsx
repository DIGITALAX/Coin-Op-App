import { useTranslation } from "react-i18next";
import { useLanguageContext } from "../../../context/LanguageContext";

export default function About() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, isLoading } = useLanguageContext();

  const languages = [
    { code: "en", name: t("english") },
    { code: "es", name: t("spanish") },
    { code: "pt", name: t("portuguese") },
  ];

  return (
    <div className="relative w-full h-full flex py-5 justify-center">
      <div className="relative max-w-4xl items-center flex justify-between flex-col gap-5">
        <div
          className="font-ark text-white text-4xl flex flex-col items-center justify-center w-3/4 h-fit break-words text-center pt-0"
          draggable={false}
        >
          {t("made_for_world")}
        </div>
        <div className="relative cursor-pointer w-fit h-fit flex flex-row text-white gap-4">
          <div className="relative w-fit h-fit flex">
            <img
              className="w-6 h-4 object-contain relative flex"
              draggable={false}
              src="/images/arrow.png"
            />
          </div>
          <div className="relative w-fit h-fit text-left justify-center break-all items-center text-sm whitespace-pre-line font-slim">
            <span className="absolute inset-0 text-azul translate-x-[3px] translate-y-[3px]">
              {t("view_tutorial")}
            </span>
            <span className="absolute inset-0 text-amarillo translate-x-[2px] translate-y-[2px]">
              {t("view_tutorial")}
            </span>
            <span className="absolute inset-0 text-turq translate-x-[1px] translate-y-[1px]">
              {t("view_tutorial")}
            </span>
            <span className="relative text-white">{t("view_tutorial")}</span>
          </div>
        </div>

        <div className="relative w-full h-fit flex flex-row justify-between items-center text-white gap-4 font-count">
          <div className="relative w-fit h-fit flex flex-row items-center justify-center gap-2 text-2xl text-white">
            <div className="text-left">{t("select_language")}</div>
            <div className="relative w-20 h-fit border border-white flex"></div>
          </div>
          {!isLoading && (
            <div className="relative w-fit h-fit text-black flex flex-row gap-3">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={`relative lowercase px-2 py-1 text-xs font-count transition-all rounded-sm border-2 border-azul ${
                    currentLanguage === language.code ? "bg-white" : "bg-viol"
                  }`}
                  style={{ transform: "skewX(-15deg)" }}
                >
                  <span
                    style={{ transform: "skewX(15deg)" }}
                    className="relative inline-block"
                  >
                    {language.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative w-full h-fit flex flex-col text-white gap-4">
          <div className="font-count text-4xl text-left w-fit h-fit flex justify-start items-center">
            {t("shipping_returns")}
          </div>
          <div className="relative w-full h-fit justify-between flex items-start text-left gap-4 text-lg font-agency">
            <div
              className={`relative w-fit h-fit text-left justify-center break-words items-center whitespace-pre-line`}
              dangerouslySetInnerHTML={{ __html: t("shipping_info_1") }}
            ></div>
            <div
              className={`relative w-fit h-fit text-left justify-center break-words items-center whitespace-pre-line`}
            >
              {t("shipping_info_2")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
