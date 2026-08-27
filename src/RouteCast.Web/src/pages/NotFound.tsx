import { MapPinOff, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-200 pt-[72px] px-4 text-center">
      
      {/* Ícone Temático */}
      <div className="bg-slate-800/50 p-6 rounded-full border border-slate-700 mb-6 shadow-lg">
        <MapPinOff className="w-16 h-16 text-blue-500" />
      </div>
      
      {/* Texto de Erro */}
      <h1 className="text-6xl md:text-8xl font-black text-white mb-2 tracking-tighter">
        404
      </h1>
      <h2 className="text-xl md:text-2xl font-semibold text-slate-300 mb-4">
        Coordenadas Perdidas
      </h2>
      <p className="text-sm text-slate-400 max-w-md mb-10 leading-relaxed">
        O ponto de destino que você está tentando acessar não existe no nosso mapeamento ou foi movido. Verifique o endereço e tente novamente.
      </p>
      
      {/* Botão de Retorno */}
      <a 
        href="/" 
        className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar à Rota Principal
      </a>

    </div>
  );
}