import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, formatDate, formatNumber, truncate } from '../engine/utils';
import type { ReportModel, ReportOptions, StatusSummary } from '../engine/types';
import { ReportChart } from '../components/ReportChart';

const statusTone: Record<string, string> = {
  paid: 'mint',
  in_process: 'violet',
  awaiting_buyer: 'amber',
  not_eligible: 'rose',
};

function MetricCard({ label, value, support, tone = 'neutral' }: { label: string; value: string; support: string; tone?: string }) {
  return <article className={`report-metric tone-${tone}`}><span>{label}</span><strong>{value}</strong><small>{support}</small></article>;
}

function StatusCard({ item, compact }: { item: StatusSummary; compact: boolean }) {
  return (
    <article className={`status-card tone-${statusTone[item.status] ?? 'neutral'} ${compact ? 'compact' : ''}`}>
      <div className="status-card-head"><span className="status-dot" /><span>{item.label}</span></div>
      <div className="status-grid">
        <div><small>Order unik</small><strong>{formatNumber(item.orders)}</strong></div>
        <div><small>Unit terjual</small><strong>{formatNumber(item.units)}</strong></div>
        <div><small>GMV</small><strong>{formatCurrency(item.gmv)}</strong></div>
        <div><small>Komisi</small><strong>{formatCurrency(item.commission)}</strong></div>
      </div>
      <div className="status-foot">
        <span>SKU rows <b>{formatNumber(item.skuRows)}</b></span>
        <span>Toko / Produk <b>{formatNumber(item.uniqueSellers)} / {formatNumber(item.uniqueProducts)}</b></span>
        <span className="status-product-main">Produk utama <b>{truncate(item.topProduct, 42)}</b></span>
      </div>
    </article>
  );
}

export function AffiliateMonthlyReport({ report, options }: { report: ReportModel; options: ReportOptions }) {
  const donutData = report.commissionDistribution.filter((item) => item.amount > 0);
  const colors = ['#59d6b1', '#8b5cf6', '#d8a74f', '#ef6f9d'];
  const maxCommission = Math.max(1, ...report.topProducts.map((item) => item.commission));
  const maxRisk = Math.max(1, ...report.risk.topProducts.map((item) => item.commission));
  const statusFiles = report.statusFileSummaries.length ? report.statusFileSummaries : report.statusSummaries.map((item) => ({ ...item, sourceFile: 'Gabungan data' }));
  const reportRatioStyle = useMemo(() => {
    const ratio = options.aspectRatio === 'custom' ? `${options.customWidth}/${options.customHeight}` : options.aspectRatio.replace(':', '/');
    return { aspectRatio: ratio };
  }, [options.aspectRatio, options.customWidth, options.customHeight]);
  const title = options.reportType === 'affiliate-monthly' ? 'Laporan Affiliate' : 'Affiliate Overview';

  return (
    <section id="report-canvas" className={`report-canvas ${options.visualizationMode === 'compact' ? 'is-compact' : ''}`} style={reportRatioStyle} aria-label="Laporan affiliate dinamis">
      <div className="report-grid-overlay" aria-hidden="true" />
      <header className="report-header">
        <div>
          <span className="eyebrow">AFFILIATE INTELLIGENCE</span>
          <h2>{title}</h2>
          <p>Ringkasan {formatNumber(report.fileCount)} status file • data {formatDate(report.dateStart)} – {formatDate(report.dateEnd)}</p>
        </div>
        <span className="report-micro">LIQUID GLASS • BLACK</span>
      </header>

      <div className="report-metrics">
        <MetricCard label="TOTAL KOMISI (ESTIMASI)" value={formatCurrency(report.estimatedCommission)} support={`${formatNumber(report.uniqueOrders)} order unik`} tone="neutral" />
        <MetricCard label="SUDAH DIBAYAR" value={formatCurrency(report.paidCommission)} support="Komisi terealisasi" tone="mint" />
        <MetricCard label="DALAM PROSES" value={formatCurrency(report.inProcessCommission)} support="Masih diproses" tone="violet" />
        <MetricCard label="BELUM DIBAYAR PEMBELI" value={formatCurrency(report.awaitingBuyerCommission)} support="Menunggu pembayaran" tone="amber" />
        <MetricCard label="TIDAK MEMENUHI SYARAT" value={formatCurrency(report.notEligibleCommission)} support={`${formatNumber(report.risk.percentage)}% dari estimasi`} tone="rose" />
        <MetricCard label="GMV TOTAL" value={formatCurrency(report.totalGMV)} support={`${formatNumber(report.totalUnits)} unit terjual`} tone="neutral" />
      </div>

      <section className="report-section">
        <div className="section-heading"><div><span className="eyebrow">RINGKASAN PER FILE</span><p>Setiap kotak membaca file aslinya sebagai satu status terpisah.</p></div><span className="section-count">{statusFiles.length} GROUP</span></div>
        <div className="status-grid-list">{statusFiles.map((item) => <div key={`${item.sourceFile}-${item.status}`} className="status-file-wrap"><StatusCard item={item} compact={options.visualizationMode === 'compact'} /><span className="file-chip">{truncate(item.sourceFile, 28)}</span></div>)}</div>
      </section>

      <section className="report-section trend-section">
        <div className="section-heading"><div><span className="eyebrow">TREN PESANAN & KOMISI</span><p>Order unik per hari + nilai komisi berdasarkan tanggal pesanan.</p></div></div>
        <ReportChart data={report.daily} />
      </section>

      <section className="peak-grid">
        {[report.peaks.orders, report.peaks.units, report.peaks.gmv, report.peaks.commission].map((peak, index) => (
          <article className="peak-card" key={peak?.label ?? index}><span>{peak?.label ?? 'Puncak'}</span><strong>{peak ? (index < 2 ? formatNumber(peak.value) : formatCurrency(peak.value)) : '—'}</strong><small>{peak ? formatDate(peak.date) : '—'}</small></article>
        ))}
      </section>

      <section className="split-section">
        <section className="report-panel">
          <div className="section-heading"><div><span className="eyebrow">PRODUK TERLARIS & SUMBANGAN KOMISI</span><p>Top 5 berdasarkan unit terjual • angka di kanan = estimasi komisi</p></div></div>
          <div className="product-list">
            {report.topProducts.map((product, index) => (
              <div className="product-row" key={`${product.name}-${index}`}>
                <span className="rank">{String(index + 1).padStart(2, '0')}</span>
                <div className="product-main"><strong title={product.name}>{truncate(product.name, 48)}</strong><span>{formatNumber(product.units)} unit · {formatNumber(product.orders)} order</span></div>
                <div className="product-value"><strong>{formatCurrency(product.commission)}</strong><div className="contribution"><span style={{ width: `${Math.max(5, (product.commission / maxCommission) * 100)}%` }} /></div></div>
              </div>
            ))}
          </div>
        </section>

        <section className="report-panel commission-panel">
          <div className="section-heading"><div><span className="eyebrow">DISTRIBUSI KOMISI</span></div></div>
          <div className="donut-wrap">
            <div className="donut-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="amount" nameKey="label" innerRadius="68%" outerRadius="88%" paddingAngle={2} stroke="none" isAnimationActive animationDuration={1000}>
                    {donutData.map((item, index) => <Cell key={item.status} fill={colors[index % colors.length]} fillOpacity={0.92} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: '#0b0b10', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center"><span>Total</span><strong>{formatCurrency(donutData.reduce((sum, item) => sum + item.amount, 0), true)}</strong></div>
            </div>
            <div className="legend-list">
              {donutData.map((item, index) => <div key={item.status}><span className="legend-dot" style={{ background: colors[index % colors.length] }} /><div><strong>{item.label}</strong><span>{formatCurrency(item.amount)} <b>• {item.percentage.toFixed(1)}%</b></span></div></div>)}
            </div>
          </div>
        </section>
      </section>

      <section className="split-section seller-risk">
        <section className="report-panel seller-panel">
          <div className="section-heading"><div><span className="eyebrow">TOP TOKO / SELLER</span><p>Ranking berdasarkan kontribusi komisi.</p></div></div>
          <div className="seller-list">
            {report.topSellers.map((seller, index) => <div className="seller-row" key={`${seller.seller}-${index}`}><span className="rank">{String(index + 1).padStart(2, '0')}</span><div><strong>{truncate(seller.seller, 28)}</strong><span>{formatNumber(seller.units)} unit · {formatNumber(seller.orders)} order</span></div><strong>{formatCurrency(seller.commission)}</strong></div>)}
          </div>
        </section>

        <section className="report-panel risk-panel">
          <div className="section-heading"><div><span className="eyebrow">RISIKO KOMISI • TIDAK MEMENUHI SYARAT</span><p>Potensi komisi hangus: {formatCurrency(report.risk.amount)} • {report.risk.percentage.toFixed(1)}% dari total estimasi komisi</p></div></div>
          <div className="risk-highlight">3 produk teratas menyumbang <strong>{formatCurrency(report.risk.topProducts.reduce((sum, item) => sum + item.commission, 0))}</strong></div>
          <div className="risk-list">
            {report.risk.topProducts.map((product, index) => <div className="risk-row" key={`${product.name}-${index}`}><span className="rank">{String(index + 1).padStart(2, '0')}</span><div><strong>{truncate(product.name, 34)}</strong><span>{formatNumber(product.units)} unit · {formatNumber(product.orders)} order</span></div><strong>{formatCurrency(product.commission)}</strong><div className="risk-bar"><span style={{ width: `${Math.max(5, (product.commission / maxRisk) * 100)}%` }} /></div></div>)}
          </div>
        </section>
      </section>

      <footer className="report-footer"><span>{report.insight}</span><span>VELLORA · by Haidar Abdurrohman</span></footer>
    </section>
  );
                                   }
