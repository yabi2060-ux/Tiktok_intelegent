import type { NormalizedStatus, NormalizedRecord } from './types';
import { cleanKey, cleanText, dateKey, toNumber } from './utils';

export const FIELD_ALIASES = {
  orderId: ['order id', 'order number', 'order no', 'order no.', 'id pesanan', 'nomor pesanan', 'no pesanan'],
  productName: ['product', 'product name', 'nama produk', 'produk', 'item', 'item name'],
  sku: ['sku', 'sku id', 'kode sku', 'product sku'],
  seller: ['store', 'shop', 'seller', 'toko', 'nama toko', 'shop name'],
  orderDate: ['date', 'order date', 'tanggal pesanan', 'tanggal order', 'created at', 'order time'],
  status: ['status', 'order status', 'status pesanan', 'order state'],
  units: ['units', 'quantity', 'qty', 'jumlah', 'unit terjual', 'terjual'],
  gmv: ['gmv', 'sales', 'gross merchandise value', 'nilai penjualan', 'nilai transaksi', 'total sales'],
  estimatedCommission: ['commission', 'estimated commission', 'komisi', 'estimasi komisi', 'komisi estimasi'],
  actualCommission: ['actual commission', 'paid commission', 'actual paid commission', 'realisasi komisi', 'komisi dibayar', 'komisi aktual'],
  commissionStatus: ['commission status', 'status komisi'],
  eligibilityStatus: ['eligibility status', 'status eligibility', 'kelayakan komisi', 'eligibility'],
} as const;

type FieldKey = keyof typeof FIELD_ALIASES;

type StatusHint = { status: NormalizedStatus; confidence: 'explicit' | 'filename' } | null;

const statusMatchers: Array<[NormalizedStatus, string[]]> = [
  ['not_eligible', ['tidak memenuhi syarat', 'tidak memenuhi', 'not eligible', 'ineligible', 'tidak eligible']],
  ['awaiting_buyer', ['belum dibayar pembeli', 'menunggu pembayaran pembeli', 'awaiting buyer payment', 'buyer unpaid']],
  ['paid', ['sudah dibayar', 'sudah terbayar', 'paid', 'payment completed', 'dibayar']],
  ['in_process', ['dalam proses', 'in process', 'processing', 'diproses']],
];

export function normalizeStatus(rawValue: unknown): NormalizedStatus {
  const raw = cleanKey(rawValue);
  if (!raw) return 'unknown';
  for (const [status, aliases] of statusMatchers) {
    if (aliases.some((alias) => raw === cleanKey(alias) || raw.includes(cleanKey(alias)))) return status;
  }
  return 'unknown';
}

export function inferStatusFromFilename(fileName: string): StatusHint {
  const raw = cleanKey(fileName.replace(/\.[^.]+$/, ''));
  for (const [status, aliases] of statusMatchers) {
    if (aliases.some((alias) => raw.includes(cleanKey(alias)))) return { status, confidence: 'filename' };
  }
  if (raw.includes('selesai') || raw === 'completed') return null;
  return null;
}

function canonicalHeader(value: unknown): string {
  return cleanKey(value);
}

export function mapHeaders(headers: string[]): Partial<Record<FieldKey, number>> {
  const cleaned = headers.map(canonicalHeader);
  const mapping: Partial<Record<FieldKey, number>> = {};
  (Object.keys(FIELD_ALIASES) as FieldKey[]).forEach((field) => {
    const aliases = FIELD_ALIASES[field].map(cleanKey);
    let matchIndex = cleaned.findIndex((h) => aliases.includes(h));
    if (matchIndex < 0) {
      matchIndex = cleaned.findIndex((h) => aliases.some((alias) => h.includes(alias) || alias.includes(h)));
    }
    if (matchIndex >= 0) mapping[field] = matchIndex;
  });
  return mapping;
}

export function requiredFieldWarnings(mapping: Partial<Record<FieldKey, number>>): string[] {
  const warnings: string[] = [];
  if (mapping.orderId === undefined) warnings.push('Kolom Order ID tidak ditemukan; deduplikasi lintas file akan terbatas.');
  if (mapping.productName === undefined) warnings.push('Kolom produk tidak ditemukan.');
  if (mapping.orderDate === undefined) warnings.push('Kolom tanggal pesanan tidak ditemukan.');
  if (mapping.gmv === undefined) warnings.push('Kolom GMV/penjualan tidak ditemukan.');
  if (mapping.estimatedCommission === undefined && mapping.actualCommission === undefined) {
    warnings.push('Kolom komisi tidak ditemukan.');
  }
  return warnings;
}

function cell(row: unknown[], index: number | undefined): unknown {
  return index === undefined ? undefined : row[index];
}

export function normalizeRows(
  rows: unknown[][],
  headers: string[],
  fileName: string,
  sheetName: string,
  headerRowIndex: number,
): { records: NormalizedRecord[]; warnings: string[] } {
  const mapping = mapHeaders(headers);
  const warnings = requiredFieldWarnings(mapping);
  const fileHint = inferStatusFromFilename(fileName);
  const records: NormalizedRecord[] = [];

  rows.forEach((row, index) => {
    const productName = cleanText(cell(row, mapping.productName));
    const rawDate = cell(row, mapping.orderDate);
    const orderDate = dateKey(rawDate);
    const rawStatus = cleanText(cell(row, mapping.status));
    const explicitStatus = normalizeStatus(rawStatus);
    const status = explicitStatus !== 'unknown' ? explicitStatus : (fileHint?.status ?? 'unknown');
    const orderId = cleanText(cell(row, mapping.orderId));
    const sku = cleanText(cell(row, mapping.sku));
    const seller = cleanText(cell(row, mapping.seller)) || 'Unknown Store';
    const units = toNumber(cell(row, mapping.units)) || 1;
    const gmv = toNumber(cell(row, mapping.gmv));
    const estimatedCommission = toNumber(cell(row, mapping.estimatedCommission));
    const actualCommission = toNumber(cell(row, mapping.actualCommission));
    const commissionStatus = cleanText(cell(row, mapping.commissionStatus));
    const eligibilityStatus = cleanText(cell(row, mapping.eligibilityStatus));

    const hasUsefulValue = Boolean(orderId || productName || sku || gmv || estimatedCommission || actualCommission);
    if (!hasUsefulValue) return;

    if (!orderDate) return;
    if (!productName && !sku) return;

    records.push({
      orderId: orderId || `ROW-${headerRowIndex + index + 1}`,
      productName: productName || sku || 'Produk tanpa nama',
      sku,
      seller,
      orderDate,
      statusRaw: rawStatus,
      status,
      units: Math.max(0, units),
      gmv: Math.max(0, gmv),
      estimatedCommission: Math.max(0, estimatedCommission),
      actualCommission: Math.max(0, actualCommission),
      commissionStatus,
      eligibilityStatus,
      sourceFile: fileName,
      sourceSheet: sheetName,
      sourceRow: headerRowIndex + index + 1,
    });
  });

  if (fileHint?.confidence === 'filename' && mapping.status === undefined) {
    warnings.push(`Status file diambil dari nama file: ${statusLabel(fileHint.status)}.`);
  }
  if (records.length === 0) warnings.push('Tidak ada baris data yang bisa dipakai setelah normalisasi.');
  return { records, warnings };
}

export function statusLabel(status: NormalizedStatus): string {
  switch (status) {
    case 'paid': return 'Sudah Dibayar';
    case 'in_process': return 'Dalam Proses';
    case 'awaiting_buyer': return 'Menunggu Pembayaran Pembeli';
    case 'not_eligible': return 'Tidak Memenuhi Syarat';
    default: return 'Status Tidak Terverifikasi';
  }
}
