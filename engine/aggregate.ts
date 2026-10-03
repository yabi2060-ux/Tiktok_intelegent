import type { NormalizedRecord, NormalizedStatus, ReportModel, StatusFileSummary, StatusSummary } from './types';
import { formatCurrency, formatDate, formatNumber } from './utils';
import { statusLabel } from './normalize';

const KNOWN_STATUSES: NormalizedStatus[] = ['paid', 'in_process', 'awaiting_buyer', 'not_eligible'];

function rowCommission(record: NormalizedRecord): number {
  return record.actualCommission > 0 ? record.actualCommission : record.estimatedCommission;
}

function estimatedCommission(record: NormalizedRecord): number {
  return record.estimatedCommission > 0 ? record.estimatedCommission : record.actualCommission;
}

function uniqueOrderCount(records: NormalizedRecord[]): number {
  return new Set(records.map((record) => record.orderId).filter(Boolean)).size;
}

function uniqueProductCount(records: NormalizedRecord[]): number {
  return new Set(records.map((record) => `${record.sku || ''}|${record.productName.trim().toLowerCase()}`)).size;
}

function topValue<T extends { units: number; gmv: number; commission: number }>(items: T[], key: 'units' | 'gmv' | 'commission') {
  return items.slice().sort((a, b) => b[key] - a[key])[0];
}

function rankProducts(records: NormalizedRecord[]): ReportModel['topProducts'] {
  const map = new Map<string, { name: string; units: number; orders: Set<string>; gmv: number; commission: number }>();
  records.forEach((record) => {
    const key = `${record.sku || ''}|${record.productName.trim().toLowerCase()}`;
    const existing = map.get(key) ?? { name: record.productName, units: 0, orders: new Set<string>(), gmv: 0, commission: 0 };
    existing.units += record.units;
    existing.orders.add(record.orderId);
    existing.gmv += record.gmv;
    existing.commission += estimatedCommission(record);
    map.set(key, existing);
  });
  return [...map.values()]
    .map((item) => ({ name: item.name, units: item.units, orders: item.orders.size, gmv: item.gmv, commission: item.commission }))
    .sort((a, b) => b.units - a.units || b.commission - a.commission)
    .slice(0, 5);
}

function rankSellers(records: NormalizedRecord[]): ReportModel['topSellers'] {
  const map = new Map<string, { units: number; orders: Set<string>; gmv: number; commission: number }>();
  records.forEach((record) => {
    const key = record.seller || 'Unknown Store';
    const existing = map.get(key) ?? { units: 0, orders: new Set<string>(), gmv: 0, commission: 0 };
    existing.units += record.units;
    existing.orders.add(record.orderId);
    existing.gmv += record.gmv;
    existing.commission += estimatedCommission(record);
    map.set(key, existing);
  });
  return [...map.entries()]
    .map(([seller, item]) => ({ seller, units: item.units, orders: item.orders.size, gmv: item.gmv, commission: item.commission }))
    .sort((a, b) => b.commission - a.commission || b.gmv - a.gmv)
    .slice(0, 5);
}

function buildStatusSummary(records: NormalizedRecord[], status: NormalizedStatus): StatusSummary {
  const rows = records.filter((record) => record.status === status);
  const products = rankProducts(rows);
  const sellers = rankSellers(rows);
  const uniqueProductKeys = new Set(rows.map((row) => `${row.sku || ''}|${row.productName.toLowerCase()}`));
  const uniqueSellerKeys = new Set(rows.map((row) => row.seller.trim().toLowerCase()).filter(Boolean));
  return {
    status,
    label: statusLabel(status),
    orders: uniqueOrderCount(rows),
    units: rows.reduce((sum, row) => sum + row.units, 0),
    gmv: rows.reduce((sum, row) => sum + row.gmv, 0),
    commission: rows.reduce((sum, row) => sum + rowCommission(row), 0),
    uniqueProducts: uniqueProductKeys.size,
    uniqueSellers: uniqueSellerKeys.size,
    skuRows: rows.length,
    topSeller: sellers[0]?.seller ?? '—',
    topProduct: products[0]?.name ?? '—',
  };
}

function buildStatusFileSummaries(records: NormalizedRecord[]): StatusFileSummary[] {
  const map = new Map<string, NormalizedRecord[]>();
  records.forEach((record) => {
    const key = `${record.sourceFile}||${record.status}`;
    const rows = map.get(key) ?? [];
    rows.push(record);
    map.set(key, rows);
  });
  return [...map.entries()]
    .map(([key, rows]) => {
      const [sourceFile, rawStatus] = key.split('||');
      const status = rawStatus as NormalizedStatus;
      const summary = buildStatusSummary(rows, status);
      return { ...summary, sourceFile };
    })
    .sort((a, b) => a.sourceFile.localeCompare(b.sourceFile) || a.label.localeCompare(b.label));
}

function buildDaily(records: NormalizedRecord[]) {
  const map = new Map<string, { orders: Set<string>; units: number; gmv: number; commission: number }>();
  records.forEach((record) => {
    const existing = map.get(record.orderDate) ?? { orders: new Set<string>(), units: 0, gmv: 0, commission: 0 };
    existing.orders.add(record.orderId);
    existing.units += record.units;
    existing.gmv += record.gmv;
    existing.commission += estimatedCommission(record);
    map.set(record.orderDate, existing);
  });
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, item]) => ({
      date,
      label: formatDate(date),
      orders: item.orders.size,
      units: item.units,
      gmv: item.gmv,
      commission: item.commission,
    }));
}

function peak(daily: ReportModel['daily'], key: 'orders' | 'units' | 'gmv' | 'commission', label: string) {
  if (!daily.length) return null;
  const row = daily.slice().sort((a, b) => b[key] - a[key])[0];
  return { label, value: row[key], date: row.date };
}

export function aggregateReport(records: NormalizedRecord[], fileCount: number): ReportModel {
  const known = records.filter((record) => KNOWN_STATUSES.includes(record.status));
  const daily = buildDaily(known.length ? known : records);
  const dates = records.map((record) => record.orderDate).filter(Boolean).sort();
  const estimatedCommission = records.reduce((sum, row) => sum + row.estimatedCommission, 0);
  const paidCommission = records.filter((row) => row.status === 'paid').reduce((sum, row) => sum + rowCommission(row), 0);
  const inProcessCommission = records.filter((row) => row.status === 'in_process').reduce((sum, row) => sum + rowCommission(row), 0);
  const awaitingBuyerCommission = records.filter((row) => row.status === 'awaiting_buyer').reduce((sum, row) => sum + rowCommission(row), 0);
  const notEligibleCommission = records.filter((row) => row.status === 'not_eligible').reduce((sum, row) => sum + rowCommission(row), 0);
  const statusSummaries = KNOWN_STATUSES.map((status) => buildStatusSummary(records, status));
  const topRiskProducts = rankProducts(records.filter((row) => row.status === 'not_eligible')).slice(0, 3);
  const totalRiskBase = estimatedCommission || paidCommission + inProcessCommission + awaitingBuyerCommission + notEligibleCommission;
  const riskPercentage = totalRiskBase > 0 ? (notEligibleCommission / totalRiskBase) * 100 : 0;
  const distributions = KNOWN_STATUSES.map((status) => {
    const summary = statusSummaries.find((item) => item.status === status)!;
    const denominator = statusSummaries.reduce((sum, item) => sum + item.commission, 0);
    return {
      status,
      label: summary.label,
      amount: summary.commission,
      percentage: denominator > 0 ? (summary.commission / denominator) * 100 : 0,
    };
  });

  const peakOrders = peak(daily, 'orders', 'Puncak order');
  const peakUnits = peak(daily, 'units', 'Puncak unit');
  const peakGMV = peak(daily, 'gmv', 'Puncak GMV');
  const peakCommission = peak(daily, 'commission', 'Puncak komisi estimasi');

  const insightParts = [
    peakOrders ? `${formatDate(peakOrders.date)} = puncak order (${formatNumber(peakOrders.value)})` : null,
    peakUnits ? `${formatDate(peakUnits.date)} = puncak unit (${formatNumber(peakUnits.value)})` : null,
    peakCommission ? `puncak komisi ${formatCurrency(peakCommission.value)}` : null,
  ].filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    fileCount,
    dateStart: dates[0] ?? '',
    dateEnd: dates[dates.length - 1] ?? '',
    totalUnits: records.reduce((sum, row) => sum + row.units, 0),
    uniqueOrders: uniqueOrderCount(records),
    uniqueProducts: uniqueProductCount(records),
    totalGMV: records.reduce((sum, row) => sum + row.gmv, 0),
    estimatedCommission,
    paidCommission,
    inProcessCommission,
    awaitingBuyerCommission,
    notEligibleCommission,
    statusSummaries,
    statusFileSummaries: buildStatusFileSummaries(records),
    daily,
    topProducts: rankProducts(records),
    topSellers: rankSellers(records),
    peaks: {
      orders: peakOrders,
      units: peakUnits,
      gmv: peakGMV,
      commission: peakCommission,
    },
    commissionDistribution: distributions,
    risk: { amount: notEligibleCommission, percentage: riskPercentage, topProducts: topRiskProducts },
    insight: insightParts.length ? `Insight: ${insightParts.join(' • ')}.` : 'Insight: belum cukup data terverifikasi untuk merangkum pola.',
  };
}
