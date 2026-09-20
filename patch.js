const fs = require('fs');
const file = 'frontend/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const hook = `
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pilaresRes, catsRes, ativsRes, regsRes] = await Promise.all([
          fetch('/api/pilares').catch(() => null),
          fetch('/api/categorias').catch(() => null),
          fetch('/api/atividades').catch(() => null),
          fetch('/api/registros_mensais').catch(() => null)
        ]);
        
        if (pilaresRes && pilaresRes.ok) {
          const p = await pilaresRes.json();
          if (p.length > 0) setPilares(p);
        }
        if (catsRes && catsRes.ok) {
          const c = await catsRes.json();
          if (c.length > 0) setCategorias(c);
        }
        if (ativsRes && ativsRes.ok) {
          const a = await ativsRes.json();
          setAtividades(a);
        }
        if (regsRes && regsRes.ok) {
          const r = await regsRes.json();
          setRegistrosMensais(r);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do servidor local:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);
`;

content = content.replace('// Handlers', hook + '\n  // Handlers');
fs.writeFileSync(file, content);
