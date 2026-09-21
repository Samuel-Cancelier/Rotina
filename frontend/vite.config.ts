import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import http from 'http';

// Plugin de proxy resiliente: conecta no Python local (127.0.0.1:8080) quando disponível,
// mas responde silenciosamente caso esteja rodando no preview da nuvem do AI Studio,
// evitando erros de socket hang up no console.
function silentApiProxyPlugin(): Plugin {
  return {
    name: 'silent-api-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          const options: http.RequestOptions = {
            hostname: '127.0.0.1',
            port: 8080,
            path: req.url,
            method: req.method,
            headers: {
              ...req.headers,
              host: '127.0.0.1:8080'
            },
            timeout: 1500
          };

          const proxyReq = http.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            proxyRes.pipe(res);
          });

          proxyReq.on('timeout', () => {
            proxyReq.destroy();
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ status: 'offline', message: 'Backend local não ativo' }));
            }
          });

          proxyReq.on('error', () => {
            // Silencia a falha sem cuspir no console do Vite
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ status: 'offline', message: 'Backend local não ativo' }));
            }
          });

          req.pipe(proxyReq);
          return;
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), silentApiProxyPlugin()],
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
