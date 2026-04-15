import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import ar from './locales/ar.json';
import ru from './locales/ru.json';

export const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'es', label: 'Español',    flag: '🇲🇽' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'zh', label: '中文',        flag: '🇨🇳' },
  { code: 'hi', label: 'हिन्दी',     flag: '🇮🇳' },
  { code: 'ar', label: 'العربية',    flag: '🇸🇦' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
];

const savedLang = localStorage.getItem('lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, es: { translation: es }, fr: { translation: fr },
                 pt: { translation: pt }, zh: { translation: zh }, hi: { translation: hi },
                 ar: { translation: ar }, ru: { translation: ru } },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
