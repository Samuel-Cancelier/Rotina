import React from 'react';
import {
  CheckCircle2,
  CalendarDays,
  FileText,
  Settings,
  Sparkles,
  Calendar
} from 'lucide-react';

export type AppTab = 'hoje' | 'semana' | 'relatorio' | 'config';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  pendenciasCount: number;
  scoreSemana: number | null;
  googleConectado: boolean;
  onConectarGoogle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendenciasCount,
  scoreSemana,
  googleConectado,
  onConectarGoogle
}) => {
  const tabs = [
    {
      id: 'hoje' as const,
      label: 'Hoje (Check-in)',
      icon: CheckCircle2,
      badge: pendenciasCount > 0 ? `${pendenciasCount}` : undefined,
      badgeCor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      id: 'semana' as const,
      label: 'Semana & Metas',
      icon: CalendarDays,
      badge: scoreSemana !== null ? `${scoreSemana} pts` : undefined,
      badgeCor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'relatorio' as const,
      label: 'Relatório & Gemini',
      icon: FileText
    },
    {
      id: 'config' as const,
      label: 'Configurações',
      icon: Settings
    }
  ];

  return (
    <header className="border-b border-[#222] bg-[#0d0d0d] sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[11px] text-amber-500 font-mono font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-white font-serif italic text-base sm:text-lg block leading-tight">
                Rotina & Prestação de Contas
              </span>
              <span className="text-[10px] text-[#666] font-mono hidden sm:inline">
                Google Agenda • Check-in • Gemini
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Status Google Agenda */}
            <button
              type="button"
              onClick={onConectarGoogle}
              className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                googleConectado
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/40'
                  : 'bg-[#181818] text-[#888] border-[#333] hover:text-white hover:bg-[#222]'
              }`}
              title={googleConectado ? 'Google Agenda conectado' : 'Conectar Google Agenda'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  googleConectado ? 'bg-emerald-400 shadow-xs shadow-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className="hidden sm:inline">
                {googleConectado ? 'Google Agenda Ativo' : 'Conectar Google'}
              </span>
            </button>

            {/* Score Semanal */}
            <div className="flex items-center gap-2 text-xs font-mono bg-[#141414] px-3 py-1.5 rounded-lg border border-[#222]">
              <span className="text-[#888]">Score:</span>
              <span className="text-amber-400 font-bold">
                {scoreSemana !== null ? `${scoreSemana}/100` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="flex overflow-x-auto space-x-1.5 py-1.5 no-scrollbar border-t border-[#1a1a1a]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#181818] text-white border border-[#333] shadow-xs'
                    : 'text-[#888] hover:text-white hover:bg-[#121212] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-[#666]'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                      tab.badgeCor || 'bg-[#202020] text-[#777] border-[#2a2a2a]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
