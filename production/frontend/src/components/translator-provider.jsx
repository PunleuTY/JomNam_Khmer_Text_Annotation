"use client";

import React from "react";
import { dictionaries } from "@/lib/transtator-dictionaries";

const I18nContext = React.createContext({
  lang: "en",
  t: (key) => key,
  toggleLang: () => {},
  setLang: (l) => {},
});

export function I18nProvider({ children }) {
  const [lang, setLang] = React.useState("en");

  React.useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("lang")
        : null;
    if (saved) setLang(saved);
  }, []);

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === "en" ? "km" : "en";
      if (typeof window !== "undefined")
        window.localStorage.setItem("lang", next);
      return next;
    });
  };

  const t = (key) => {
    const dict = dictionaries[lang] || {};
    return (
      key
        .split(".")
        .reduce((acc, k) => (acc && acc[k] ? acc[k] : null), dict) || key
    );
  };

  const value = React.useMemo(() => ({ lang, t, toggleLang, setLang }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  return ctx;
}
