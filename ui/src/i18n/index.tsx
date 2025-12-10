import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { en } from './en';
import type { Translations } from './en';
import { es } from './es';
import { he } from './he';

type Language = 'en' | 'es' | 'he';

interface I18nContextType {
    language: Language;
    t: Translations;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
}

const translations: Record<Language, Translations> = { en, es, he };

// Language display names for the dropdown
export const languageNames: Record<Language, string> = {
    en: 'English',
    es: 'Español',
    he: 'עברית',
};

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
    children: ReactNode;
    defaultLanguage?: Language;
}

export function I18nProvider({ children, defaultLanguage = 'en' }: I18nProviderProps) {
    const [language, setLanguageState] = useState<Language>(defaultLanguage);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        document.documentElement.lang = lang;
        // Set RTL direction for Hebrew
        document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    }, []);

    const toggleLanguage = useCallback(() => {
        const languages: Language[] = ['en', 'es', 'he'];
        const currentIndex = languages.indexOf(language);
        const nextIndex = (currentIndex + 1) % languages.length;
        setLanguage(languages[nextIndex]);
    }, [language, setLanguage]);

    const value: I18nContextType = {
        language,
        t: translations[language],
        setLanguage,
        toggleLanguage,
    };

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n(): I18nContextType {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}

export type { Language, Translations };

