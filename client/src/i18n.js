import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: en,
            },
            fr: {
                translation: fr,
            },
        },
        // Set default language to French as requested
        lng: 'fr',
        fallbackLng: 'fr',

        interpolation: {
            escapeValue: false, // react already safes from xss
        },
    });

export default i18n;
