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
import {
  PILARES_INICIAIS,
  CATEGORIAS_INICIAIS,
  CORES_PILARES
} from './data/initialData';
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

// Wrapper para requisições na API local ou remota
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
  const [activeTab, setActiveTab] = useState<AppTab>('pilares');

  // Estado com persistência em LocalStorage: apenas Pilares e Categorias vêm pré-configurados
  const [pilares, setPilares] = useState<Pilar[]>(() => {
    const saved = localStorage.getItem('rotina_pilares');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return PILARES_INICIAIS;
  });

  const [categorias, setCategorias] = useState<Categoria[]>(() => {
    const saved = localStorage.getItem('rotina_categorias');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return CATEGORIAS_INICIAIS;
  });

  const [atividades, setAtividades] = useState<AtividadeCadastrada[]>(() => {
    const saved = localStorage.getItem('rotina_atividades');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [registrosMensais, setRegistrosMensais] = useState<RegistroMensalCategoria[]>(() => {
    const saved = localStorage.getItem('rotina_registros_mensais');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [agendamentos, setAgendamentos] = useState<AgendamentoItem[]>(() => {
    const saved = localStorage.getItem('rotina_agendamentos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [metas, setMetas] = useState<MetaCategoria[]>(() => {
    const saved = localStorage.getItem('rotina_metas');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [historico, setHistorico] = useState<HistoricoAtividade[]>(() => {
    const saved = localStorage.getItem('rotina_historico');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  // Salva no LocalStorage sempre que o estado muda
  useEffect(() => {
    localStorage.setItem('rotina_pilares', JSON.stringify(pilares));
  }, [pilares]);

  useEffect(() => {
    localStorage.setItem('rotina_categorias', JSON.stringify(categorias));
  }, [categorias]);

  useEffect(() => {
    localStorage.setItem('rotina_atividades', JSON.stringify(atividades));
  }, [atividades]);

  useEffect(() => {
    localStorage.setItem('rotina_registros_mensais', JSON.stringify(registrosMensais));
  }, [registrosMensais]);

  useEffect(() => {
    localStorage.setItem('rotina_agendamentos', JSON.stringify(agendamentos));
  }, [agendamentos]);

  useEffect(() => {
    localStorage.setItem('rotina_metas', JSON.stringify(metas));
  }, [metas]);

  useEffect(() => {
    localStorage.setItem('rotina_historico', JSON.stringify(historico));
  }, [historico]);

  // Sincronização resiliente com a API local / Firestore / Cloudflare Worker (se ativo)
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
        if (Array.isArray(a) && a.length > 0) setAtividades(a);
      }
      if (regsRes && regsRes.ok) {
        const r = await regsRes.json();
        if (Array.isArray(r) && r.length > 0) setRegistrosMensais(r);
      }
      if (agendsRes && agendsRes.ok) {
        const ag = await agendsRes.json();
        if (Array.isArray(ag) && ag.length > 0) setAgendamentos(ag);
      }
      if (histRes && histRes.ok) {
        const h = await histRes.json();
        if (Array.isArray(h) && h.length > 0) setHistorico(h);
      }
    } catch {
      // Ignora silenciosamente quando o backend local ainda não iniciou
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
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

      if (novoStatus && itemAlvo.categoria_id) {
        handleRegistrarFeito(itemAlvo.categoria_id, itemAlvo.titulo, 1);
      }
    }
  };

  const handleRegistrarFeito = (catNomeOrId: string, ativNome: string, valor: number) => {
    const term = catNomeOrId.toLowerCase().trim();
    const cat = categorias.find(
      (c) => c.id.toLowerCase() === term || c.nome.toLowerCase().includes(term)
    );
    const pilar = pilares.find((p) => p.id === cat?.pilar_id);
    const pilarNome = pilar?.nome || 'Geral';
    const pontos = cat ? Number((valor * cat.pontos_por_unidade).toFixed(1)) : Number((valor * 10).toFixed(1));
    const catId = cat ? cat.id : 'cat_diversos';
    const catNome = cat ? cat.nome : catNomeOrId;
    const unidade = cat ? cat.unidade_padrao : 'un';

    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth() + 1;
    const dataHoraStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Registra no Histórico
    const novoHist: HistoricoAtividade = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      categoria_id: catId,
      categoria_nome: catNome,
      atividade_nome: ativNome,
      valor: valor,
      valor_unidade: valor,
      unidade: unidade,
      pontos_gerados: pontos,
      data_registro: dataHoraStr,
      ano: ano,
      mes: mes
    };
    setHistorico((prev) => [novoHist, ...prev]);

    // 2. Atualiza registros mensais da categoria
    setRegistrosMensais((prev) => {
      const idx = prev.findIndex((r) => r.categoria_id === catId && r.ano === ano && r.mes === mes);
      if (idx >= 0) {
        const existente = prev[idx];
        const breakdown = { ...(existente.atividades_breakdown || {}) };
        breakdown[ativNome] = Number(((breakdown[ativNome] || 0) + valor).toFixed(1));
        const atualizado: RegistroMensalCategoria = {
          ...existente,
          valor_total: Number((existente.valor_total + valor).toFixed(1)),
          atividades_breakdown: breakdown,
          atualizado_em: now.toISOString().split('T')[0]
        };
        const copia = [...prev];
        copia[idx] = atualizado;
        return copia;
      } else {
        const novoReg: RegistroMensalCategoria = {
          id: `reg_${ano}_${mes}_${catId}`,
          ano,
          mes,
          categoria_id: catId,
          categoria_nome: catNome,
          pilar_id: cat?.pilar_id || 'pilar_diversos',
          valor_total: valor,
          unidade: unidade,
          atividades_breakdown: { [ativNome]: valor },
          atualizado_em: now.toISOString().split('T')[0]
        };
        return [novoReg, ...prev];
      }
    });

    apiFetch(`${API_BASE}/api/historico_atividades`, {
      method: 'POST',
      body: JSON.stringify(novoHist)
    }).catch(() => {});

    return { pontos, pilarNome };
  };

  const handleAgendarPontual = (hora: string, titulo: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const novo: AgendamentoItem = {
      id: `ag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tipo: 'pontual',
      titulo: titulo,
      data: todayStr,
      hora_inicio: hora,
      concluido: false
    };
    handleAddAgendamento(novo);
  };

  const handleLimparExemplos = () => {
    setAgendamentos([]);
  };

  const handleSyncGoogleCalendar = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const gEvent: AgendamentoItem = {
      id: `gcal_${Date.now()}`,
      tipo: 'google_agenda',
      titulo: 'Reunião com Diretoria (Google Agenda)',
      data: todayStr,
      hora_inicio: '10:00',
      hora_fim: '11:00',
      local: 'Google Meet',
      concluido: false
    };
    setAgendamentos((prev) => [gEvent, ...prev]);
  };

  const handleAddHistorico = async (dados: any) => {
    const now = new Date();
    const ano = dados.ano || now.getFullYear();
    const mes = dados.mes || (now.getMonth() + 1);
    const cat = categorias.find((c) => c.id === dados.categoria_id);
    const valor = parseFloat(dados.valor) || 1;
    const pontos = cat ? Number((valor * cat.pontos_por_unidade).toFixed(1)) : 0;
    const dataHoraStr = dados.data_registro || `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const novoHist: HistoricoAtividade = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      categoria_id: dados.categoria_id,
      categoria_nome: cat?.nome || 'Categoria',
      atividade_nome: dados.atividade_nome || 'Atividade',
      valor: valor,
      valor_unidade: valor,
      unidade: cat?.unidade_padrao || 'un',
      pontos_gerados: pontos,
      data_registro: dataHoraStr,
      ano: ano,
      mes: mes
    };

    setHistorico((prev) => [novoHist, ...prev]);

    setRegistrosMensais((prev) => {
      const idx = prev.findIndex((r) => r.categoria_id === dados.categoria_id && r.ano === ano && r.mes === mes);
      if (idx >= 0) {
        const existente = prev[idx];
        const breakdown = { ...(existente.atividades_breakdown || {}) };
        const ativNome = dados.atividade_nome || 'Atividade';
        breakdown[ativNome] = Number(((breakdown[ativNome] || 0) + valor).toFixed(1));
        const atualizado: RegistroMensalCategoria = {
          ...existente,
          valor_total: Number((existente.valor_total + valor).toFixed(1)),
          atividades_breakdown: breakdown,
          atualizado_em: now.toISOString().split('T')[0]
        };
        const copia = [...prev];
        copia[idx] = atualizado;
        return copia;
      } else {
        const novoReg: RegistroMensalCategoria = {
          id: `reg_${ano}_${mes}_${dados.categoria_id}`,
          ano,
          mes,
          categoria_id: dados.categoria_id,
          categoria_nome: cat?.nome || 'Categoria',
          pilar_id: cat?.pilar_id || 'pilar_diversos',
          valor_total: valor,
          unidade: cat?.unidade_padrao || 'un',
          atividades_breakdown: { [dados.atividade_nome || 'Atividade']: valor },
          atualizado_em: now.toISOString().split('T')[0]
        };
        return [novoReg, ...prev];
      }
    });

    apiFetch(`${API_BASE}/api/historico_atividades`, {
      method: 'POST',
      body: JSON.stringify(novoHist)
    }).catch(() => {});
  };

  const handleUpdateHistorico = async (id: string, dados: any) => {
    setHistorico((prev) => prev.map((h) => (h.id === id ? { ...h, ...dados } : h)));
    apiFetch(`${API_BASE}/api/historico_atividades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    }).catch(() => {});
  };

  const handleDeleteHistorico = async (id: string) => {
    setHistorico((prev) => prev.filter((h) => h.id !== id));
    apiFetch(`${API_BASE}/api/historico_atividades/${id}`, {
      method: 'DELETE'
    }).catch(() => {});
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
            onLimparExemplos={handleLimparExemplos}
            onSyncGoogleCalendar={handleSyncGoogleCalendar}
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
            onAgendarPontual={handleAgendarPontual}
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
