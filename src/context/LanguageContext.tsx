import { createContext, useContext, useEffect, useState, FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { useFileStorage } from "../components/Activity/hooks/useFileStorage";
import { LanguageContextType, LanguageProviderProps } from "../components/Common/types/common.types";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: FunctionComponent<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const { getItem, setItem } = useFileStorage();
  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await getItem('appLanguage', 'global') as string;
        if (savedLanguage && savedLanguage !== i18n.language) {
          await i18n.changeLanguage(savedLanguage ?? "en");
          setCurrentLanguage(savedLanguage ?? "en");
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedLanguage();
  }, [getItem, i18n]);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const changeLanguage = async (language: string) => {
    try {
      await setItem('appLanguage', language, 'global');
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguageContext must be used within a LanguageProvider");
  }
  return context;
};