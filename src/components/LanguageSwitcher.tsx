import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languageOptions = [
    { code: "nl", name: "Nederlands" },
    { code: "en", name: "English" },
    { code: "tr", name: "Türkçe" },
  ];

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-5 w-5 text-stone-400" />
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="bg-stone-900/50 border border-stone-700 rounded-md px-2 py-1 text-stone-300 focus:ring-amber-500"
      >
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-stone-800">
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;