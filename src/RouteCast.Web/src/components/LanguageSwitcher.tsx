import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mapeamento de idiomas para códigos de bandeiras
    const flagCodes: Record<string, string> = {
        pt: 'br', // Código da bandeira do Brasil para português
        en: 'us', // Código da bandeira dos EUA para inglês
        es: 'es'  // Código da bandeira da Espanha para espanhol
    };

    // Mapeamento de idiomas para nomes
    const languageNames: Record<string, string> = {
        pt: 'Português',
        en: 'English',
        es: 'Español'
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1F3B86]/10 hover:bg-[#1F3B86]/20 text-[#193A84] transition-colors"
            >
                <Globe size={18} />
                <span className="text-sm font-medium flex items-center gap-2">
                    <span className={`fi fi-${flagCodes[i18n.language]} fis`}></span>
                    {languageNames[i18n.language]}
                </span>
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-[999999999] border border-gray-200">
                    {Object.entries(languageNames).map(([code, name]) => (
                        <button
                            key={code}
                            onClick={() => changeLanguage(code)}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-100 transition-colors ${i18n.language === code ? 'bg-blue-50' : ''}`}
                        >
                            <span className={`fi fi-${flagCodes[code]} fis`}></span>
                            <span className="text-sm font-medium text-gray-700">{name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}