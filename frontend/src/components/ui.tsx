import React from 'react';

export const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-amber-500/70';

export const btnPrimario =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

export const btnSecundario =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[#1a1a1a] hover:bg-[#222] text-[#ddd] border border-[#2a2a2a] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

export const btnFantasma =
  'inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer';

export function Card({
  children,
  className = '',
  style
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`bg-[#111] border border-[#222] rounded-xl ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Titulo({ icone, children, extra }: { icone?: React.ReactNode; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wide">
        {icone}
        {children}
      </h2>
      {extra}
    </div>
  );
}

export function Barra({ valor, cor = '#f59e0b', altura = 6 }: { valor: number | null; cor?: string; altura?: number }) {
  const v = valor === null ? 0 : Math.min(1, Math.max(0, valor));
  return (
    <div className="w-full bg-[#1c1c1c] rounded-full overflow-hidden" style={{ height: altura }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${v * 100}%`, background: cor }} />
    </div>
  );
}

export function Chip({
  ativo,
  onClick,
  children,
  cor
}: {
  ativo?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  cor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
        ativo ? 'text-black border-transparent' : 'bg-[#151515] text-[#bbb] border-[#2a2a2a] hover:border-[#444] hover:text-white'
      }`}
      style={ativo ? { background: cor || '#f59e0b' } : undefined}
    >
      {children}
    </button>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <div className="text-center text-sm text-[#666] py-8 border border-dashed border-[#222] rounded-xl">{children}</div>;
}

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = texto;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
