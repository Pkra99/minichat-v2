
import { useI18n, languageNames, type Language } from '../i18n';

const languages: Language[] = ['en', 'es', 'he'];

export function LanguageToggle() {
    const { language, setLanguage } = useI18n();

    return (
        <select
            className="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            title="Select language"
        >
            {languages.map((lang) => (
                <option key={lang} value={lang}>
                    🌐 {languageNames[lang]}
                </option>
            ))}
        </select>
    );
}
