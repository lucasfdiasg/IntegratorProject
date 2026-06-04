import React, { useState } from 'react';
import { 
  Droplets, 
  LayoutDashboard, 
  Settings, 
  Activity, 
  History,
  Menu,
  X
} from 'lucide-react';
import HistoryChart from "./features/telemetry/components/HistoryChart.jsx";

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Estado para controlar qual tela está ativa no dashboard
  const [currentTab, setCurrentTab] = useState('tempo-real'); 

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans relative transition-colors duration-300">
      
      {/* Overlay escuro para mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Responsiva */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-emerald-900 text-emerald-50 flex flex-col flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6 border-b border-emerald-800 flex justify-between items-center">
          <div className="flex items-center gap-3 font-bold text-xl">
            <Droplets className="text-emerald-400" />
            HortaSmart
          </div>
          <button className="md:hidden p-1 hover:bg-emerald-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6 text-emerald-400" />
          </button>
        </div>

       {/* Menu de Navegação Interativo - Tempo Real no Topo */}
        <nav className="flex-1 py-4 space-y-1">
          <button 
            type="button"
            onClick={() => { setCurrentTab('tempo-real'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left font-medium transition-all ${
              currentTab === 'tempo-real' 
                ? 'bg-emerald-800 text-white border-r-4 border-emerald-400' 
                : 'text-emerald-200 hover:bg-emerald-800/60 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5 flex-shrink-0" /> 
            <span>Tempo Real</span>
          </button>

          <button 
            type="button"
            onClick={() => { setCurrentTab('historico'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left font-medium transition-all ${
              currentTab === 'historico' 
                ? 'bg-emerald-800 text-white border-r-4 border-emerald-400' 
                : 'text-emerald-200 hover:bg-emerald-800/60 hover:text-white'
            }`}
          >
            <History className="w-5 h-5 flex-shrink-0" /> 
            <span>Histórico</span>
          </button>

          {/* Abas desativadas do MVP */}
          <div className="w-full flex items-center gap-3 px-6 py-3 text-emerald-200/50 opacity-50 cursor-not-allowed select-none">
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" /> 
            <span>Controle Manual</span>
          </div>
          
          <div className="w-full flex items-center gap-3 px-6 py-3 text-emerald-200/50 opacity-50 cursor-not-allowed select-none">
            <Settings className="w-5 h-5 flex-shrink-0" /> 
            <span>Configurações</span>
          </div>
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col w-full max-w-full overflow-hidden">
        
        {/* Header Mobile */}
        <header className="md:hidden bg-emerald-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-lg">
            <button 
              className="p-1 -ml-1 hover:bg-emerald-800 rounded transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6 text-emerald-400" />
            </button>
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-emerald-400" />
              HortaSmart
            </div>
          </div>
        </header>

        {/* View da Página */}
        <div className="p-4 md:p-8 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Cabeçalho que muda dinamicamente com base na aba ativa */}
            <header className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
                {currentTab === 'historico' ? 'Análise de Dados' : 'Monitoramento em Tempo Real'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                {currentTab === 'historico' 
                  ? 'Visualize o comportamento climático da horta ao longo do tempo.' 
                  : 'Leituras instantâneas atualizadas dos sensores instalados.'}
              </p>
            </header>

            {/* Enviamos a aba atual como uma propriedade (prop) para o componente decidir o que exibir */}
            <HistoryChart activeTab={currentTab} />

          </div>
        </div>
      </main>
    </div>
  );
}