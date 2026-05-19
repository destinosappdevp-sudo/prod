"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useState, useEffect } from "react";

function LanguageSwitcher() {
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("language") as "es" | "en" | null;
    if (saved) setLanguage(saved);
    setMounted(true);
  }, []);

  const handleChange = (lang: "es" | "en") => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="rounded-full border px-3 py-2 flex items-center gap-x-2 hover:bg-gray-100 transition">
          <Globe className="w-5 h-5" />
          <span className="text-sm font-medium">{language.toUpperCase()}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleChange("es")}>
          {language === "es" && <span className="mr-2">✓</span>}
          Español
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleChange("en")}>
          {language === "en" && <span className="mr-2">✓</span>}
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;



