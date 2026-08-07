import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
  { code: "hi", label: "हिन्दी" },
  { code: "es", label: "Español" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

type Dict = Record<string, string>;

const en: Dict = {
  "nav.home": "Home",
  "nav.ai": "AI",
  "nav.hospitals": "Hospitals",
  "nav.medicines": "Medicines",
  "nav.profile": "Profile",
  "home.greeting": "Hello",
  "home.subtitle": "How are you feeling today?",
  "home.search": "Describe your symptoms",
  "home.analyze": "Analyze symptoms",
  "home.recent": "Recent searches",
  "home.tips": "Health tips",
  "home.quick": "Quick actions",
  "common.emergency": "Emergency SOS",
  "common.doctors": "Doctors",
  "common.appointments": "Appointments",
  "common.reminders": "Reminders",
  "common.records": "Records",
  "common.settings": "Settings",
};

const bn: Dict = {
  "nav.home": "হোম",
  "nav.ai": "এআই",
  "nav.hospitals": "হাসপাতাল",
  "nav.medicines": "ওষুধ",
  "nav.profile": "প্রোফাইল",
  "home.greeting": "হ্যালো",
  "home.subtitle": "আজ কেমন লাগছে?",
  "home.search": "আপনার উপসর্গ লিখুন",
  "home.analyze": "উপসর্গ বিশ্লেষণ করুন",
  "home.recent": "সাম্প্রতিক অনুসন্ধান",
  "home.tips": "স্বাস্থ্য পরামর্শ",
  "home.quick": "দ্রুত অ্যাকশন",
  "common.emergency": "জরুরি সহায়তা",
  "common.doctors": "ডাক্তার",
  "common.appointments": "অ্যাপয়েন্টমেন্ট",
  "common.reminders": "রিমাইন্ডার",
  "common.records": "রেকর্ড",
  "common.settings": "সেটিংস",
};

const hi: Dict = {
  "nav.home": "होम",
  "nav.ai": "एआई",
  "nav.hospitals": "अस्पताल",
  "nav.medicines": "दवाइयाँ",
  "nav.profile": "प्रोफ़ाइल",
  "home.greeting": "नमस्ते",
  "home.subtitle": "आज आप कैसा महसूस कर रहे हैं?",
  "home.search": "अपने लक्षण बताइए",
  "home.analyze": "लक्षण विश्लेषण करें",
  "home.recent": "हाल की खोजें",
  "home.tips": "स्वास्थ्य सुझाव",
  "home.quick": "त्वरित क्रियाएँ",
  "common.emergency": "आपातकालीन सहायता",
  "common.doctors": "डॉक्टर",
  "common.appointments": "अपॉइंटमेंट",
  "common.reminders": "रिमाइंडर",
  "common.records": "रिकॉर्ड",
  "common.settings": "सेटिंग्स",
};

const es: Dict = {
  "nav.home": "Inicio",
  "nav.ai": "IA",
  "nav.hospitals": "Hospitales",
  "nav.medicines": "Medicinas",
  "nav.profile": "Perfil",
  "home.greeting": "Hola",
  "home.subtitle": "¿Cómo te sientes hoy?",
  "home.search": "Describe tus síntomas",
  "home.analyze": "Analizar síntomas",
  "home.recent": "Búsquedas recientes",
  "home.tips": "Consejos de salud",
  "home.quick": "Acciones rápidas",
  "common.emergency": "SOS de emergencia",
  "common.doctors": "Médicos",
  "common.appointments": "Citas",
  "common.reminders": "Recordatorios",
  "common.records": "Historial",
  "common.settings": "Ajustes",
};

const DICTS: Record<LanguageCode, Dict> = { en, bn, hi, es };
const STORAGE_KEY = "mediguide-language";

type Ctx = {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<Ctx>({
  language: "en",
  setLanguage: () => {},
  t: (key) => en[key] ?? key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (stored && stored in DICTS) setLanguageState(stored);
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    window.localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      language,
      setLanguage,
      t: (key: string) => DICTS[language][key] ?? en[key] ?? key,
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}
