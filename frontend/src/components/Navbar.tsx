import React from 'react';
import {
  ShieldCheck,
  Layers,
  Calendar,
  ListTodo,
  Bot,
  Sparkles,
  Target,
  BarChart3,
  Database
} from 'lucide-react';

export type AppTab = 'pilares' | 'categorias' | 'atividades' | 'calendario' | 'historico' | 'simulador' | 'analytics' | 'firestore';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  pilaresCount: number;
  categoriesCount: number;
  activitiesCount: number;
  scoreGeral: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pilaresCount,
  categoriesCount,
  activitiesCount,
  scoreGeral
}) => {
  const tabs = [
    {
      id: 'pilares' as const,
      label: 'Pilares',
      icon: ShieldCheck,
      badge: 'Metas'
    },
    {
      id: 'categorias' as const,
      label: 'Categorias',
      icon: Layers,
      badge: `${categoriesCount}`
    },
    {
      id: 'atividades' as const,
      label: 'Atividades',
      icon: ListTodo,
      badge: `${activitiesCount}`
    },
    {
      id: 'calendario' as const,
      label: 'Calendário',
      icon: Calendar
    },
    {
      id: 'historico' as const,
      label: 'Lançamentos',
      icon: ListTodo
    },
    {
      id: 'simulador' as const,
      label: 'Telegram Bot',
      icon: Bot,
      badge: '/feito'
    },
    {
      id: 'analytics' as const,
      label: 'Analytics',
      icon: BarChart3
    },
    {
      id: 'firestore' as const,
      label: 'Banco (Schema)',
      icon: Database
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
              <div className="flex items-center gap-2">
                <span className="text-white font-serif italic text-base sm:text-lg">
                  Gestão de Rotina & Metas
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 text-xs font-mono text-[#888] bg-[#121212] px-3.5 py-1.5 rounded-lg border border-[#222]">
              <span className="flex items-center gap-1.5 text-xs text-amber-400 font-bold font-mono">
                Score: {scoreGeral}/100
              </span>
            </div>
          </div>
        </div>
        <div className="flex overflow-x-auto space-x-1.5 py-1.5 no-scrollbar border-t border-[#1a1a1a]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
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
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-[#202020] text-[#777] border border-[#2a2a2a]'
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
