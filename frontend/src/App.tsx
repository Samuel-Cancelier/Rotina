import React, { useState } from 'react';
import { Navbar, AppTab } from './components/Navbar';
import { CheckinView } from './components/CheckinView';
import { SemanaView } from './components/SemanaView';
import { RelatorioView } from './components/RelatorioView';
import { ConfigView } from './components/ConfigView';
import { AuthLockScreen } from './components/AuthLockScreen';
import { ErrorBoundary } from './components/ui';
import {
  PILARES_INICIAIS,
  CATEGORIAS_INICIAIS,
  OBJETIVOS_INICIAIS,
  CONFIG_INICIAL
} from './data/initialData';
import { Pilar, Categoria, Registro, Objetivo, ConfigGeral } from './types';
import { useColecao } from './lib/api';
import { useAgenda } from './lib/agenda';
import { hoje, inicioSemana } from './lib/datas';
import { calcularSemana } from './lib/metricas';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('hoje');

  // Controle de Bloqueio Seguro (PIN / Senha)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    // Se o usuário já autenticou nesta sessão, libera direto
    return sessionStorage.getItem('rotina2_autenticado') !== 'true';
  });

  // Coleções com sincronização (offline-first localStorage + Cloudflare/Firestore em tempo real)
  const {
    itens: pilares,
    salvar: salvarPilar,
    recarregar: recarregarPilares
  } = useColecao<Pilar>('pilares', PILARES_INICIAIS);

  const {
    itens: categorias,
    salvar: salvarCategoria,
    remover: removerCategoria,
    recarregar: recarregarCategorias
  } = useColecao<Categoria>('categorias', CATEGORIAS_INICIAIS);

  const {
    itens: registros,
    salvar: salvarRegistro,
    remover: removerRegistro,
    status: statusRegistros,
    recarregar: recarregarRegistros
  } = useColecao<Registro>('registros', []);

  const {
    itens: objetivos,
    salvar: salvarObjetivo,
    remover: removerObjetivo,
    recarregar: recarregarObjetivos
  } = useColecao<Objetivo>('objetivos', OBJETIVOS_INICIAIS);

  const {
    itens: configLista,
    salvar: salvarConfigItem,
    status: statusConfig,
    recarregar: recarregarConfig
  } = useColecao<ConfigGeral>('config', [CONFIG_INICIAL]);

  const handleForcarSync = () => {
    recarregarPilares();
    recarregarCategorias();
    recarregarRegistros();
    recarregarObjetivos();
    recarregarConfig();
  };

  const config = configLista[0] || CONFIG_INICIAL;
  const localPinHash = localStorage.getItem('rotina2_pin_hash') || undefined;
  const cloudPinHash = config.pin_hash || localPinHash;

  // Sincroniza o PIN com a nuvem Firestore se ele já existir localmente
  React.useEffect(() => {
    if (localPinHash && !config.pin_hash && statusConfig === 'online') {
      salvarConfigItem({ ...config, pin_hash: localPinHash });
    }
  }, [localPinHash, config, statusConfig, salvarConfigItem]);

  // Google Agenda (leitura client-side com GIS)
  const agenda = useAgenda(categorias, config.nome_calendario || 'Rotina');

  // Métricas da semana corrente para o Navbar
  const semanaAtual = inicioSemana(hoje());
  const statsSemana = calcularSemana(
    semanaAtual,
    pilares,
    categorias,
    registros,
    agenda.eventos,
    agenda.conectado
  );

  // Se o aplicativo estiver bloqueado, exibe a tela de PIN
  if (isLocked) {
    if (statusConfig === 'carregando' && !localPinHash) {
      return (
        <div className="min-h-screen bg-[#070707] text-[#d4d4d4] flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#888]">Verificando credenciais...</p>
          </div>
        </div>
      );
    }

    return (
      <AuthLockScreen
        onUnlock={() => setIsLocked(false)}
        cloudPinHash={cloudPinHash}
        onSaveCloudPin={(hash) => {
          salvarConfigItem({ ...config, pin_hash: hash });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] flex flex-col font-sans antialiased">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendenciasCount={statsSemana.aderencia.pendentes}
        scoreSemana={statsSemana.score}
        googleConectado={agenda.conectado}
        cloudStatus={statusRegistros}
        onForcarSync={handleForcarSync}
        onConectarGoogle={() => {
          if (!agenda.conectado) {
            if (agenda.clientIdConfigurado) agenda.conectar();
            else setActiveTab('config');
          }
        }}
        onLock={() => {
          sessionStorage.removeItem('rotina2_autenticado');
          setIsLocked(true);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary fallbackTitle="Erro ao carregar o módulo">
          {activeTab === 'hoje' && (
            <CheckinView
              pilares={pilares}
              categorias={categorias}
              registros={registros}
              eventos={agenda.eventos}
              agendaConectada={agenda.conectado}
              onSalvarRegistro={salvarRegistro}
              onRemoverRegistro={removerRegistro}
            />
          )}

          {activeTab === 'semana' && (
            <SemanaView
              pilares={pilares}
              categorias={categorias}
              registros={registros}
              eventos={agenda.eventos}
              agendaConectada={agenda.conectado}
            />
          )}

          {activeTab === 'relatorio' && (
            <RelatorioView
              pilares={pilares}
              categorias={categorias}
              registros={registros}
              eventos={agenda.eventos}
              agendaConectada={agenda.conectado}
              objetivos={objetivos}
              config={config}
            />
          )}

          {activeTab === 'config' && (
            <ConfigView
              pilares={pilares}
              categorias={categorias}
              objetivos={objetivos}
              config={config}
              agenda={agenda}
              onSalvarPilar={salvarPilar}
              onSalvarCategoria={salvarCategoria}
              onRemoverCategoria={removerCategoria}
              onSalvarObjetivo={salvarObjetivo}
              onRemoverObjetivo={removerObjetivo}
              onSalvarConfig={(novaCfg) => salvarConfigItem(novaCfg)}
            />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}
