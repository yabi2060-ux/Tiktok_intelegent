export function cleanKey(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/[._\-\/\\]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function cleanText(value: unknown): string {
  return String(value ?? '').trim();
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value === null || value === undefined || value === '') return 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  const negative = /^\(.*\)$/.test(raw) || /^-/.test(raw);
  const normalized = raw
    .replace(/[()]/g, '')
    .replace(/Rp|IDR|USD|\$|€|£/gi, '')
    .replace(/\s/g, '')
    .replace(/[^0-9,.-]/g, '');
  if (!normalized) return 0;

  const unsigned = normalized.replace(/^-/, '');
  const hasComma = unsigned.includes(',');
  const hasDot = unsigned.includes('.');
  let candidate = unsigned;

  if (hasComma && hasDot) {
    const lastComma = unsigned.lastIndexOf(',');
    const lastDot = unsigned.lastIndexOf('.');
    if (lastComma > lastDot) {
      candidate = unsigned.replace(/\./g, '').replace(',', '.');
    } else {
      candidate = unsigned.replace(/,/g, '');
    }
  } else if (hasDot) {
    const parts = unsigned.split('.');
    const looksLikeThousands = parts.length > 1 && parts.slice(1).every((part) => /^\d{3}$/.test(part));
    candidate = looksLikeThousands ? parts.join('') : unsigned;
  } else if (hasComma) {
    const parts = unsigned.split(',');
    const looksLikeThousands = parts.length > 1 && parts.slice(1).every((part) => /^\d{3}$/.test(part));
    candidate = looksLikeThousands ? parts.join('') : unsigned.replace(',', '.');
  }

  const number = Number(candidate);
  return Number.isFinite(number) ? (negative ? -Math.abs(number) : number) : 0;
}

export function excelSerialToDate(serial: number): Date | null {
  if (!Number.isFinite(serial)) return null;
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400 * 1000);
}

export function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number') {
    const excel = excelSerialToDate(value);
    if (excel && !Number.isNaN(excel.getTime())) return excel;
  }
  const raw = cleanText(value);
  if (!raw) return null;
  const ddmmyyyy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateKey(value: unknown): string {
  const date = parseDate(value);
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDate(value: string): string {
  if (!value) return '—';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(y, m - 1, d));
}

export function formatCurrency(value: number, compact = false): string {
  if (!Number.isFinite(value)) return 'Rp 0';
  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2).replace('.', ',')} M`; 
    if (abs >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(2).replace('.', ',')} jt`;
    if (abs >= 1_000) return `Rp ${(value / 1_000).toFixed(1).replace('.', ',')} rb`;
  }
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
}

export function truncate(text: string, max = 44): string {
  const value = text.trim();
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
