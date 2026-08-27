import logo from "../assets/Logo_Diminuida.png";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm text-[#193A84] shadow-lg z-[10000] border-b border-blue-100">
      <div className="w-full mx-auto flex items-center justify-between px-12 py-4 max-lg:flex-col max-lg:items-center max-lg:justify-center">
        <div className="flex-1"></div>

        {/* Logo centralizado */}
        <div className="flex items-center justify-center">
          <img src={logo} alt={t('app.title')} className="h-12 scale-150 object-contain hover:scale-[1.8] transition-transform duration-300" />
        </div>

        {/* Language Switcher à direita */}
        <div className="flex-1 flex justify-end max-lg:mt-4 max-lg:w-max">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
