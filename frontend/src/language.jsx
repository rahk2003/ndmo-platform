/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";

const LanguageContext = createContext({
  language: "en",
  isArabic: false,
});

export function LanguageProvider({ language, children }) {
  return (
    <LanguageContext.Provider value={{ language, isArabic: language === "ar" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
