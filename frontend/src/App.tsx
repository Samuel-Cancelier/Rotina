import React, { useState } from 'react';
import { Navbar, AppTab } from './components/Navbar';
import { CheckinView } from './components/CheckinView';
import { SemanaView } from './components/SemanaView';
import { RelatorioView } from './components/RelatorioView';
import { ConfigView } from './components/ConfigView';
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

  // Coleções com sincronização (offline-first localStorage + Cloudflare/Firestore opcional)
  const {
    itens: pilares,
    salvar: salvarPilar
  } = useColecao<Pilar>('pilares', PILARES_INICIAIS);

  const {
    itens: categorias,
    salvar: salvarCategoria,
    remover: removerCategoria
  } = useColecao<Categoria>('categorias', CATEGORIAS_INICIAIS);

  const {
    itens: registros,
    salvar: salvarRegistro,
    remover: removerRegistro
  } = useColecao<Registro>('registros', []);

  const {
    itens: objetivos,
    salvar: salvarObjetivo,
    remover: removerObjetivo
  } = useColecao<Objetivo>('objetivos', OBJETIVOS_INICIAIS);

  const {
    itens: configLista,
    salvar: salvarConfigItem
  } = useColecao<ConfigGeral>('config', [CONFIG_INICIAL]);

  const config = configLista[0] || CONFIG_INICIAL;

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] flex flex-col font-sans antialiased">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendenciasCount={statsSemana.aderencia.pendentes}
        scoreSemana={statsSemana.score}
        googleConectado={agenda.conectado}
        onConectarGoogle={() => {
          if (!agenda.conectado) {
            if (agenda.clientIdConfigurado) agenda.conectar();
            else setActiveTab('config');
          }
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </main>
    </div>
  );
}
