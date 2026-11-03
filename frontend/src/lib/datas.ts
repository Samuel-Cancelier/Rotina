// Utilitários de data (sempre no fuso local do navegador)

export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDias(s: string, n: number): string {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export function hoje(): string {
  return ymd(new Date());
}

/** Segunda-feira da semana que contém a data */
export function inicioSemana(s: string): string {
  const d = parseYmd(s);
  const dow = d.getDay(); // 0=Dom
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return ymd(d);
}

export function diasDaSemana(inicio: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDias(inicio, i));
}

export function diaSemana(s: string): number {
  return parseYmd(s).getDay();
}

/** "Seg 02/11" */
export function rotuloDia(s: string): string {
  const d = parseYmd(s);
  return `${DIAS_CURTOS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** "02/11" */
export function ddmm(s: string): string {
  const d = parseYmd(s);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function rotuloRelativo(s: string): string {
  const h = hoje();
  if (s === h) return 'Hoje';
  if (s === addDias(h, -1)) return 'Ontem';
  if (s === addDias(h, 1)) return 'Amanhã';
  return rotuloDia(s);
}

export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function novoId(prefixo: string): string {
  return `${prefixo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
