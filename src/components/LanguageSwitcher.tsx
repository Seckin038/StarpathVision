import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languageOptions = [
    { code: "nl", name: "Nederlands" },
    { code: "en", name: "English" },
    { code: "tr", name: "Türkçe" },
  ];

  const currentLanguage = languageOptions.find(lang => i18n.language.startsWith(lang.code)) || languageOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 border-stone-700 text-stone-300 hover:bg-stone-800">
          <Globe className="h-4 w-4" />
          <span>{currentLanguage.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-stone-900 border-stone-700 text-stone-200">
        {languageOptions.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className="cursor-pointer hover:bg-stone-800 focus:bg-stone-800"
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;