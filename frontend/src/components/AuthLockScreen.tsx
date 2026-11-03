import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AuthLockScreenProps {
  onUnlock: () => void;
}

// Utilitário para gerar hash SHA-256
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const AuthLockScreen: React.FC<AuthLockScreenProps> = ({ onUnlock }) => {
  const hashSalvo = localStorage.getItem('rotina2_pin_hash');
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const ehPrimeiroAcesso = !hashSalvo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      if (ehPrimeiroAcesso) {
        if (pinInput.length < 4) {
          setErro('O PIN/Senha deve ter pelo menos 4 caracteres.');
          setCarregando(false);
          return;
        }
        if (pinInput !== confirmPinInput) {
          setErro('As senhas não coincidem. Digite novamente.');
          setCarregando(false);
          return;
        }
        const hash = await sha256(pinInput);
        localStorage.setItem('rotina2_pin_hash', hash);
        sessionStorage.setItem('rotina2_autenticado', 'true');
        onUnlock();
      } else {
        const hashTentativa = await sha256(pinInput);
        if (hashTentativa === hashSalvo) {
          sessionStorage.setItem('rotina2_autenticado', 'true');
          onUnlock();
        } else {
          setErro('Senha incorreta. Tente novamente.');
          setPinInput('');
        }
      }
    } catch {
      setErro('Erro ao validar autenticação.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#d4d4d4] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-[#111] border border-[#222] rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4">
          {ehPrimeiroAcesso ? <KeyRound className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight">
          {ehPrimeiroAcesso ? 'Criar Chave de Acesso' : 'App Bloqueado'}
        </h1>
        <p className="text-xs text-[#888] mt-1.5 leading-relaxed">
          {ehPrimeiroAcesso
            ? 'Defina um PIN ou Senha pessoal para proteger seu histórico e seus hábitos no celular.'
            : 'Digite seu PIN ou senha para acessar seu painel de rotina.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5 text-left">
          <div>
            <label className="block text-[11px] font-mono text-[#aaa] uppercase tracking-wider mb-1">
              {ehPrimeiroAcesso ? 'Defina seu PIN ou Senha:' : 'PIN ou Senha de Acesso:'}
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                inputMode="text"
                autoComplete="current-password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Digite sua senha..."
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-amber-500 text-center tracking-widest font-mono pr-10"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-3 text-[#666] hover:text-[#bbb] p-0.5 cursor-pointer"
                title={mostrarSenha ? 'Ocultar' : 'Mostrar'}
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {ehPrimeiroAcesso && (
            <div>
              <label className="block text-[11px] font-mono text-[#aaa] uppercase tracking-wider mb-1">
                Confirme seu PIN ou Senha:
              </label>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value)}
                placeholder="Repita a senha..."
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-amber-500 text-center tracking-widest font-mono"
                required
              />
            </div>
          )}

          {erro && (
            <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs text-center">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando || !pinInput}
            className="w-full mt-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{ehPrimeiroAcesso ? 'Salvar e Entrar' : 'Desbloquear'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#1a1a1a] flex items-center justify-center gap-1.5 text-[11px] text-[#666]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Proteção criptografada local (SHA-256)</span>
        </div>
      </div>
    </div>
  );
};
