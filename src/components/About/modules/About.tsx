import { useTranslation } from "react-i18next";
import { INFURA_GATEWAY } from "../../../lib/constants";
import { useLanguageContext } from "../../../context/LanguageContext";

export default function About() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, isLoading } = useLanguageContext();
  
  const languages = [
    { code: 'en', name: t('english') },
    { code: 'es', name: t('spanish')},
    { code: 'pt', name: t('portuguese') }
  ];


  return (
    <div className="relative w-full h-full flex py-5 justify-center">
      <div className="relative max-w-3/4 items-center flex justify-between flex-col gap-5">
        <div
          className="font-monu text-white text-5xl flex flex-col items-center justify-center w-3/4 h-fit break-words text-center pt-0"
          draggable={false}
        >
          {t('made_for_world')}
        </div>
        <div className="relative w-full h-fit flex flex-col text-white gap-4">
          <div className="font-monu text-2xl text-left w-fit h-fit flex justify-start items-center">
            {t('tutorial')}
          </div>
          <div
            className={`relative w-fit h-fit text-left justify-center break-all items-center text-sm whitespace-pre-line font-mana`}
          >
            {t('view_tutorial')}
          </div>
        </div>
        
        <div className="relative w-full h-fit flex flex-col text-white gap-4">
          <div className="font-monu text-2xl text-left w-fit h-fit flex justify-start items-center">
            {t('language')}.
          </div>
          <div className="relative w-fit h-fit flex flex-col gap-3">
            <div className="text-sm font-mana text-left">
              {t('select_language')}
            </div>
            {!isLoading && (
              <div className="flex gap-2">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => changeLanguage(language.code)}
                    className={`px-4 py-2 rounded-md font-satB text-sm transition-colors ${
                      currentLanguage === language.code
                        ? 'bg-ama text-black'
                        : 'bg-oscuro border border-oscurazul text-white hover:border-ama'
                    }`}
                  >
                    {language.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="relative w-full h-fit flex flex-col text-white gap-4">
          <div className="font-monu text-2xl text-left w-fit h-fit flex justify-start items-center">
            {t('shipping_returns')}
          </div>
          <div
            className={`relative w-fit h-fit text-left justify-center break-all items-center text-sm whitespace-pre-line font-mana`}
          >
            {t('shipping_info')}
          </div>
        </div>
        <div className="relative w-3/4 h-fit items-center justify-center flex">
          <div className="relative w-fit px-4 py-2 h-full rounded-sm bg-oscurazul font-sat text-white flex flex-row items-center justify-center gap-5">
            <div className="relative w-14 h-11 items-center justify-center flex">
              <img
                src={`${INFURA_GATEWAY}/ipfs/QmfVta8TP8BmZqo6Pvh6PgosRBM9mm71txukUxQp9fri17`}
                className="object-cover h-full w-full"
                draggable={false}
              />
            </div>
            <div
              className="relative w-full h-full overflow-y-scroll flex"
              id="xScroll"
            >
              <div className="relative w-fit h-fit break-words items-center justify-center">
                {t('know_keep_up')}
              </div>
            </div>
            <div className="relative w-1.5 h-full bg-black"></div>
            <div className="relative w-fit h-fit items-center justify-center flex flex-col text-center">
              <div className="relative w-fit h-fit items-center justify-center flex font-satB whitespace-nowrap">
                {t('ask_machine')}
              </div>
              <div className="relative w-fit h-fit items-center justify-center flex text-sm">
                {t('start_here')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
