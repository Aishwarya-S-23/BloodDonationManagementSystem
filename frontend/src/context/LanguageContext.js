import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('appLanguage');
    return savedLanguage || 'en';
  });

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
  };

  // Translation function (placeholder for future i18n implementation)
  const t = (key, params = {}) => {
    // For now, return the key as-is
    // In future, this will use i18n library (react-i18next, etc.)
    return key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    // Future: isRTL, locale, etc.
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
