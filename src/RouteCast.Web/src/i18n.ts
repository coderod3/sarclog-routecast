import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
    // Carrega traduções usando http (pode ser usado em produção)
    .use(Backend)
    // Detecta o idioma do usuário
    .use(LanguageDetector)
    // Passa o i18n para react-i18next
    .use(initReactI18next)
    // Inicializa i18next
    .init({
        fallbackLng: 'pt',
        lng: 'pt', // Define português como idioma padrão

        interpolation: {
            escapeValue: false, // não é necessário para React
        },

        // Configuração para carregar traduções - corrigindo o caminho
        backend: {
            loadPath: './locales/{{lng}}/{{ns}}.json',
        },

        // Namespaces padrão
        defaultNS: 'common',
        ns: ['common'],

        react: {
            useSuspense: false // Desativando suspense para evitar problemas de carregamento
        }
    });

export default i18n;