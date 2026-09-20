import React, { useState, useEffect } from 'react';
import { Navbar, AppTab } from './components/Navbar';
import { PilaresView } from './components/PilaresView';
import { CategoriasView } from './components/CategoriasView';
import { AtividadesView } from './components/AtividadesView';
import { CalendarView } from './components/CalendarView';
import { TelegramSimulator } from './components/TelegramSimulator';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { FirestoreSchemaView } from './components/FirestoreSchemaView';
import { HistoricoView, HistoricoAtividade } from './components/HistoricoView';
import { PILARES_INICIAIS, CATEGORIAS_INICIAIS, CORES_PILARES } from './data/initialData';
import {
  Pilar,
  Categoria,
  AtividadeCadastrada,
  RegistroMensalCategoria,
  AgendamentoItem,
  MetaCategoria,
  PilarId
} from './types';

// Base da API (vazio para caminhos relativos locais ou URL do Cloudflare Worker)
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');


// Wrapper para injetar o Token de Autenticação
const apiFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("API_SECRET_KEY");
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...options, headers });
};

export default function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("API_SECRET_KEY"));
  const [tokenInput, setTokenInput] = useState("");

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-[#d4d4d4] font-[Plus_Jakarta_Sans]">
        <div className="p-8 bg-[#171717] rounded-xl shadow-2xl border border-neutral-800 max-w-sm w-full">
          <h1 className="text-2xl font-semibold mb-4 text-white">Acesso Restrito</h1>
          <p className="text-sm text-neutral-400 mb-6">Por favor, insira a chave de acesso da API para continuar.</p>
          <input 
            type="password"
            className="w-full bg-[#262626] border border-neutral-700 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Sua chave secreta..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                localStorage.setItem("API_SECRET_KEY", tokenInput);
                setIsAuth(true);
              }
            }}
          />
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            onClick={() => {
              localStorage.setItem("API_SECRET_KEY", tokenInput);
              setIsAuth(true);
            }}
          >
            Acessar Painel
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<AppTab>('pilares');
  const [pilares, setPilares] = useState<Pilar[]>(PILARES_INICIAIS);
  const [categorias, setCategorias] = useState<Categoria[]>(CATEGORIAS_INICIAIS);
  const [atividades, setAtividades] = useState<AtividadeCadastrada[]>([]);
  const [registrosMensais, setRegistrosMensais] = useState<RegistroMensalCategoria[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoItem[]>([]);
  const [metas, setMetas] = useState<MetaCategoria[]>([]);
  const [historico, setHistorico] = useState<HistoricoAtividade[]>([]);

  // Sincronização periódica com a API local / Firestore / Cloudflare Worker
  const fetchData = async () => {
    try {
      const [pilaresRes, catsRes, ativsRes, regsRes, agendsRes, histRes] = await Promise.all([
        apiFetch(`${API_BASE}/api/pilares`).catch(() => null),
        apiFetch(`${API_BASE}/api/categorias`).catch(() => null),
        apiFetch(`${API_BASE}/api/atividades`).catch(() => null),
        apiFetch(`${API_BASE}/api/registros_mensais`).catch(() => null),
        apiFetch(`${API_BASE}/api/agendamentos`).catch(() => null),
        apiFetch(`${API_BASE}/api/historico_atividades`).catch(() => null)
      ]);

      if (pilaresRes && pilaresRes.ok) {
        const p = await pilaresRes.json();
        if (Array.isArray(p) && p.length > 0) setPilares(p);
      }
      if (catsRes && catsRes.ok) {
        const c = await catsRes.json();
        if (Array.isArray(c) && c.length > 0) {
          const comCorPilar = c.map((cat: Categoria) => ({
            ...cat,
            cor: CORES_PILARES[cat.pilar_id as PilarId] || cat.cor
          }));
          setCategorias(comCorPilar);
        }
      }
      if (ativsRes && ativsRes.ok) {
        const a = await ativsRes.json();
        if (Array.isArray(a)) setAtividades(a);
      }
      if (regsRes && regsRes.ok) {
        const r = await regsRes.json();
        if (Array.isArray(r)) setRegistrosMensais(r);
      }
      if (agendsRes && agendsRes.ok) {
        const ag = await agendsRes.json();
        if (Array.isArray(ag)) setAgendamentos(ag);
      }
      if (histRes && histRes.ok) {
        const h = await histRes.json();
        if (Array.isArray(h)) setHistorico(h);
      }
    } catch {
      // Ignora silenciosamente quando o backend local ainda não iniciou
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handlers sincronizados com o backend Python / Firestore / Cloudflare Worker
  const handleUpdatePilar = (updated: Pilar) => {
    setPilares((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    apiFetch(`${API_BASE}/api/pilares/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch((err) => console.error("Erro ao atualizar pilar:", err));
  };

  const handleUpdateCategoria = (updated: Categoria) => {
    const corPilar = CORES_PILARES[updated.pilar_id as PilarId] || updated.cor;
    const catComCorPilar = { ...updated, cor: corPilar };
    setCategorias((prev) => prev.map((c) => (c.id === updated.id ? catComCorPilar : c)));
    apiFetch(`${API_BASE}/api/categorias/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catComCorPilar)
    }).catch((err) => console.error("Erro ao atualizar categoria:", err));
  };

  const handleAddCategoria = (nova: Categoria) => {
    const tempId = nova.id || `cat_${Date.now()}`;
    const corPilar = CORES_PILARES[nova.pilar_id as PilarId] || nova.cor;
    const catCompleta = { ...nova, id: tempId, cor: corPilar };
    setCategorias((prev) => [...prev, catCompleta]);

    apiFetch(`${API_BASE}/api/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catCompleta)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id && data.id !== tempId) {
          setCategorias((prev) => prev.map((c) => (c.id === tempId ? { ...c, id: data.id } : c)));
        }
      })
      .catch((err) => console.error("Erro ao criar categoria:", err));
  };

  const handleDeleteCategoria = (id: string) => {
    setCategorias((prev) => prev.filter((c) => c.id !== id));
    apiFetch(`${API_BASE}/api/categorias/${id}`, {
      method: 'DELETE'
    }).catch((err) => console.error("Erro ao excluir categoria:", err));
  };

  const handleAddAtividade = (nova: Omit<AtividadeCadastrada, 'id' | 'criado_em'>) => {
    const tempId = `ativ_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const full: AtividadeCadastrada = { ...nova, id: tempId, criado_em: new Date().toISOString().split('T')[0] };
    setAtividades((prev) => [full, ...prev]);

    apiFetch(`${API_BASE}/api/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id && data.id !== tempId) {
          setAtividades((prev) => prev.map((a) => (a.id === tempId ? { ...a, id: data.id } : a)));
        }
      })
      .catch((err) => console.error("Erro ao criar atividade:", err));

    return tempId;
  };

  const handleUpdateAtividade = (updated: AtividadeCadastrada) => {
    setAtividades((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    apiFetch(`${API_BASE}/api/atividades/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch((err) => console.error("Erro ao atualizar atividade:", err));
  };

  const handleDeleteAtividade = (id: string) => {
    setAtividades((prev) => prev.filter((a) => a.id !== id));
    apiFetch(`${API_BASE}/api/atividades/${id}`, {
      method: 'DELETE'
    }).catch((err) => console.error("Erro ao excluir atividade:", err));
  };

  const handleAddAgendamento = (item: Omit<AgendamentoItem, 'id'>) => {
    const tempId = `ag_${Date.now().toString(36)}`;
    const novo: AgendamentoItem = { ...item, id: tempId };
    setAgendamentos((prev) => [novo, ...prev]);

    apiFetch(`${API_BASE}/api/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novo)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id && data.id !== tempId) {
          setAgendamentos((prev) => prev.map((it) => (it.id === tempId ? { ...it, id: data.id } : it)));
        }
      })
      .catch((err) => console.error("Erro ao criar agendamento:", err));
  };

  const handleUpdateAgendamento = (updated: AgendamentoItem) => {
    setAgendamentos((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    apiFetch(`${API_BASE}/api/agendamentos/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch((err) => console.error("Erro ao atualizar agendamento:", err));
  };

  const handleDeleteAgendamento = (id: string) => {
    setAgendamentos((prev) => prev.filter((it) => it.id !== id));
    apiFetch(`${API_BASE}/api/agendamentos/${id}`, {
      method: 'DELETE'
    }).catch((err) => console.error("Erro ao excluir agendamento:", err));
  };

  const handleToggleConcluido = (id: string) => {
    const itemAlvo = agendamentos.find((it) => it.id === id);
    if (itemAlvo) {
      const novoStatus = !itemAlvo.concluido;
      setAgendamentos((prev) => prev.map((it) => (it.id === id ? { ...it, concluido: novoStatus } : it)));
      apiFetch(`${API_BASE}/api/agendamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concluido: novoStatus })
      }).catch((err) => console.error("Erro ao atualizar status agendamento:", err));
    }
  };

  const handleRegistrarFeito = (catNomeOrId: string, ativNome: string, valor: number) => {
    return { pontos: 10, pilarNome: 'Registrado' };
  };

  const handleAddHistorico = async (dados: any) => {
    try {
      await apiFetch(`${API_BASE}/api/historico_atividades`, {
        method: 'POST',
        body: JSON.stringify(dados)
      });
      fetchData(); // Atualiza tudo
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateHistorico = async (id: string, dados: any) => {
    try {
      await apiFetch(`${API_BASE}/api/historico_atividades/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHistorico = async (id: string) => {
    try {
      await apiFetch(`${API_BASE}/api/historico_atividades/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Cálculo básico do Score Geral
  let scoreGeral = 0;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  pilares.forEach(pilar => {
    if (pilar.tem_meta && pilar.meta_pontos_mensal > 0 && pilar.peso_no_score_geral > 0) {
      // Somar pontos das categorias deste pilar neste mês
      const categoriasDoPilar = categorias.filter(c => c.pilar_id === pilar.id).map(c => c.id);
      const registrosDoMes = registrosMensais.filter(r => 
        r.ano === currentYear && r.mes === currentMonth && categoriasDoPilar.includes(r.categoria_id)
      );
      
      const pontosAtingidos = registrosDoMes.reduce((acc, reg) => {
        const cat = categorias.find(c => c.id === reg.categoria_id);
        return acc + (reg.valor_total * (cat?.pontos_por_unidade || 0));
      }, 0);

      const percentualAtingido = (pontosAtingidos / pilar.meta_pontos_mensal) * 100;
      scoreGeral += percentualAtingido * (pilar.peso_no_score_geral / 100);
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#d4d4d4] flex flex-col font-sans antialiased">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pilaresCount={pilares.length}
        categoriesCount={categorias.length}
        activitiesCount={atividades.length}
        scoreGeral={Math.round(scoreGeral)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'pilares' && (
          <PilaresView
            pilares={pilares}
            categorias={categorias}
            registrosMensais={registrosMensais}
            onUpdatePilar={handleUpdatePilar}
            onUpdateCategoria={handleUpdateCategoria}
          />
        )}
        {activeTab === 'categorias' && (
          <CategoriasView
            pilares={pilares}
            categorias={categorias}
            registrosMensais={registrosMensais}
            onUpdateCategoria={handleUpdateCategoria}
            onAddCategoria={handleAddCategoria}
            onDeleteCategoria={handleDeleteCategoria}
          />
        )}
        {activeTab === 'atividades' && (
          <AtividadesView
            pilares={pilares}
            categorias={categorias}
            atividades={atividades}
            onAddAtividade={handleAddAtividade}
            onUpdateAtividade={handleUpdateAtividade}
            onDeleteAtividade={handleDeleteAtividade}
          />
        )}
        {activeTab === 'calendario' && (
          <CalendarView
            agendamentos={agendamentos}
            atividades={atividades}
            categorias={categorias}
            onAddAgendamento={handleAddAgendamento}
            onUpdateAgendamento={handleUpdateAgendamento}
            onToggleConcluido={handleToggleConcluido}
            onDeleteAgendamento={handleDeleteAgendamento}
            onAddHistorico={handleAddHistorico}
          />
        )}
        {activeTab === 'historico' && (
          <HistoricoView
            historico={historico}
            categorias={categorias}
            atividades={atividades}
            onAddHistorico={handleAddHistorico}
            onUpdateHistorico={handleUpdateHistorico}
            onDeleteHistorico={handleDeleteHistorico}
          />
        )}
        {activeTab === 'simulador' && (
          <TelegramSimulator
            pilares={pilares}
            categorias={categorias}
            atividades={atividades}
            onAddAtividadeFromBot={handleAddAtividade}
            onRegistrarFeito={handleRegistrarFeito}
            onAgendarPontual={() => {}}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            categorias={categorias}
            atividades={atividades}
            metas={metas}
            registrosMensais={registrosMensais}
          />
        )}
        {activeTab === 'firestore' && (
          <FirestoreSchemaView />
        )}
      </main>
    </div>
  );
}
