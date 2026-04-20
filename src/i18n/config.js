import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { logger } from '../utils/logger';

import esTranslation from '../locales/es/translation.json';
import enTranslation from '../locales/en/translation.json';
import frTranslation from '../locales/fr/translation.json';

const resources = {
  es: { translation: esTranslation },
  en: { translation: enTranslation },
  fr: { translation: frTranslation },
};

// BrowserLanguageDetector accede a window.location y localStorage —
// ambas APIs no existen en Node.js durante SSR. Solo se usa en el navegador.
const isBrowser = typeof window !== 'undefined' && typeof window.location !== 'undefined';

const i18nChain = isBrowser ? i18n.use(LanguageDetector) : i18n;

i18nChain.use(initReactI18next).init({
  resources,
  supportedLngs: ['es', 'en', 'fr'],
  fallbackLng: 'es',
  // La detección de idioma y el caché en localStorage solo aplican en el navegador
  detection: isBrowser ? {
    caches: ['localStorage'],
    lookupLocalStorage: 'chambing-language',
  } : {},
  debug: false,
  interpolation: {
    escapeValue: false,
  },
});

// Función simple para cambiar idioma
export const changeLanguage = (lng) => {
  logger.log(`🌐 Cambiando idioma a: ${lng}`);
  return i18n.changeLanguage(lng);
};

// Función para obtener idioma actual
export const getCurrentLanguage = () => i18n.language;

export default i18n;