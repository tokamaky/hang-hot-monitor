import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { en, zh, type Language, type Translations } from './translations';

const translations: Record<Language, Translations> = { en, zh };

interface I18nContextValue {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'hotpulse_language';

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') return stored;
  } catch {}
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  }, [language, setLanguage]);

  return (
    <I18nContext.Provider value={{ language, t: translations[language], setLanguage, toggleLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}
