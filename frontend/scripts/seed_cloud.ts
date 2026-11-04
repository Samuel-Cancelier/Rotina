import { PILARES_INICIAIS, CATEGORIAS_INICIAIS, OBJETIVOS_INICIAIS, CONFIG_INICIAL } from '../src/data/initialData';

const API_BASE = 'https://rotina-metas-api.rotinas.workers.dev';
const API_KEY = 'rotina_sec_samuel_2026';

async function seed() {
  console.log('Sincronizando pilares...');
  for (const p of PILARES_INICIAIS) {
    const res = await fetch(`${API_BASE}/api/pilares/${encodeURIComponent(p.id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(p)
    });
    console.log(`Pilar ${p.id}: ${res.status}`);
  }

  console.log('Sincronizando categorias...');
  for (const c of CATEGORIAS_INICIAIS) {
    const res = await fetch(`${API_BASE}/api/categorias/${encodeURIComponent(c.id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(c)
    });
    console.log(`Categoria ${c.id}: ${res.status}`);
  }

  console.log('Sincronizando objetivos...');
  for (const o of OBJETIVOS_INICIAIS) {
    const res = await fetch(`${API_BASE}/api/objetivos/${encodeURIComponent(o.id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(o)
    });
    console.log(`Objetivo ${o.id}: ${res.status}`);
  }

  console.log('Sincronização concluída com sucesso!');
}

seed().catch(console.error);
