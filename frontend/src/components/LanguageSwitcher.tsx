import { useTranslation } from "react-i18next";
import { LANG_STORAGE_KEY } from "../i18n/config";

const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिं" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const setLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem(LANG_STORAGE_KEY, code);
  };

  return (
    <div className="flex items-center rounded-md border border-slate-200 overflow-hidden text-xs">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLang(lang.code)}
          className={`px-2 py-1.5 font-medium ${
            i18n.language === lang.code
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
