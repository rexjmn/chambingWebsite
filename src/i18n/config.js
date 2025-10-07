import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traducciones
import esTranslation from '../locales/es/translation.json';
import enTranslation from '../locales/en/translation.json';
import frTranslation from '../locales/fr/translation.json';

// Configuración de recursos de traducción
const resources = {
  es: {
    translation: esTranslation,
  },
  en: {
    translation: enTranslation,
  },
  fr: {
    translation: frTranslation,
  },
};

// Inicializar i18next - CONFIGURACIÓN BÁSICA
i18n
  .use(LanguageDetector) // Detecta idioma automáticamente
  .use(initReactI18next) // Conecta con React
  .init({
    resources,
    
    // Idiomas soportados
    supportedLngs: ['es', 'en', 'fr'],
    
    // Idioma por defecto si no se puede detectar
    fallbackLng: 'es',
    
    // Configuración de detección
    detection: {
      // Dónde guardar la preferencia del usuario
      caches: ['localStorage'],
      // Clave en localStorage
      lookupLocalStorage: 'chambing-language',
    },
    
    // Configuración básica
    debug: true, // Para ver logs en desarrollo
    
    interpolation: {
      escapeValue: false, // React ya protege contra XSS
    },
  });

// Función simple para cambiar idioma
export const changeLanguage = (lng) => {
  console.log(`🌐 Cambiando idioma a: ${lng}`);
  return i18n.changeLanguage(lng);
};

// Función para obtener idioma actual
export const getCurrentLanguage = () => i18n.language;

export default i18n;