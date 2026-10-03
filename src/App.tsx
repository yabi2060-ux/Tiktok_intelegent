import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, RotateCcw } from 'lucide-react';
import { PatternWaves } from './components/PatternWaves';
import { MaskedHeading } from './components/MaskedHeading';
import { ParticleText } from './components/ParticleText';
import { BlurText } from './components/BlurText';
import { TextLoop } from './components/TextLoop';
import { FuseButton } from './components/FuseButton';
import { GlideSelect } from './components/GlideSelect';
import { LatticeLoader } from './components/LatticeLoader';
import { ThoughtLine } from './components/ThoughtLine';
import { PeekRating } from './components/PeekRating';
import { UploadDropzone, type QueuedFile } from './components/UploadDropzone';
import { aggregateReport } from './engine/aggregate';
import { parseFiles } from './engine/parser';
import type { ReportModel, ReportOptions } from './engine/types';
import { formatCurrency, formatNumber } from './engine/utils';
import { AffiliateMonthlyReport } from './templates/AffiliateMonthlyReport';

const PROCESS_STEPS = [
  'Reading your data…',
  'Combining transactions…',
  'Analyzing product performance…',
  'Calculating sales…',
  'Calculating commission…',
  'Building your visualization…',
  'Polishing the final report…',
];

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function App() {
  const [intro, setIntro] = useState(() => localStorage.getItem('vellora-intro-seen') !== '1');
  const [view, setView] = useState<'welcome' | 'upload' | 'processing' | 'report'>('welcome');
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [processingStep, setProcessingStep] = useState(0);
  const [report, setReport] = useState<ReportModel | null>(null);
  const [parserWarnings, setParserWarnings] = useState<string[]>([]);
  const [parserErrors, setParserErrors] = useState<string[]>([]);
  const [processStartedAt, setProcessStartedAt] = useState<number | null>(null);
  const [options, setOptions] = useState<ReportOptions>({
    aspectRatio: '4:5',
    customWidth: 4,
    customHeight: 5,
    template: 'affiliate-monthly',
    exportFormat: 'png',
    reportType: 'affiliate-monthly',
    visualizationMode: 'detailed',
  });

  const finishIntro = useCallback(() => {
    localStorage.setItem('vellora-intro-seen', '1');
    setIntro(false);
  }, []);

  useEffect(() => {
    if (!intro) return;
    const timer = window.setTimeout(finishIntro, 15000);
    return () => window.clearTimeout(timer);
  }, [intro, finishIntro]);

  const updateOption = <K extends keyof ReportOptions>(key: K, value: ReportOptions[K]) => {
    setOptions((current) => ({ ...current, [key]: value }));
  };

  const generateReport = async () => {
    if (!files.length) return;
    setView('processing');
    setProcessStartedAt(performance.now());
    setProcessingStep(0);
    setParserWarnings([]);
    setParserErrors([]);

    const rawFiles = files.map((item) => item.file);
    await sleep(40);
    const parsed = await parseFiles(rawFiles);
    setProcessingStep(1);
    await sleep(40);
    setProcessingStep(2);
    await sleep(40);
    setProcessingStep(3);
    await sleep(35);
    setProcessingStep(4);
    const nextReport = aggregateReport(parsed.records, parsed.files.filter((item) => item.valid).length);
    await sleep(35);
    setProcessingStep(5);
    setParserWarnings(parsed.warnings);
    setParserErrors(parsed.errors);
    await sleep(80);

    if (!parsed.records.length) {
      setView('upload');
      return;
    }
    await sleep(40);
    setProcessingStep(6);
    await sleep(80);
    setReport(nextReport);
    setView('report');
    setProcessStartedAt(null);
  };

  const resetAll = () => {
    setFiles([]);
    setReport(null);
    setParserWarnings([]);
    setParserErrors([]);
    setProcessingStep(0);
    setView('welcome');
  };

  const exportReport = async () => {
    const canvas = document.getElementById('report-canvas');
    if (!canvas || !report) return;
    if (options.exportFormat === 'json') {
      const blob = new Blob([JSON.stringify({ report, options }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `vellora-report-${report.dateStart || 'data'}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      return;
    }
    const html2canvas = (await import('html2canvas')).default;
    const rendered = await html2canvas(canvas as HTMLElement, {
      backgroundColor: '#030305',
      scale: Math.min(window.devicePixelRatio || 1, 2),
      useCORS: true,
      logging: false,
    });
    rendered.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `vellora-report-${report.dateStart || 'data'}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    }, 'image/png', 0.98);
  };

  const fileCountText = useMemo(() => `${files.length} FILE${files.length === 1 ? '' : 'S'} READY`, [files.length]);

  if (intro) {
    return (
      <main className="intro-screen">
        <PatternWaves />
        <div className="intro-vignette" aria-hidden="true" />
        <div className="intro-content">
          <MaskedHeading />
          <ParticleText text="VELLORA" />
          <div className="intro-subtitle">
            <BlurText delay={0}>AFFILIATE INTELLIGENCE</BlurText>
            <BlurText delay={200} className="creator-credit">by Haidar Abdurrohman</BlurText>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <PatternWaves />
      <div className="app-vignette" aria-hidden="true" />

      <header className="topbar shell-width">
        <button className="brand-mark" type="button" onClick={() => setView(report ? 'report' : 'welcome')} aria-label="Buka VELLORA">
          <span className="brand-dot" />
          <span>VELLORA</span>
        </button>
        <div className="topbar-status"><span className="status-pulse" /> LOCAL-FIRST · AFFILIATE INTELLIGENCE</div>
        <span className="topbar-credit">by Haidar Abdurrohman</span>
      </header>

      <main className="shell-width main-content">
        {view === 'welcome' && (
          <section className="welcome-stage page-enter">
            <div className="welcome-copy">
              <span className="eyebrow">DATA → PROCESSING → VISUALIZATION → INSIGHT</span>
              <h1>Affiliate data,<br /><em>made visual.</em></h1>
              <p>Website ini dibuat untuk memudahkan affiliate melihat dan memahami laporan bulanan melalui tampilan visual yang rapi, menarik, dan mudah dipahami.</p>
              <div className="welcome-actions">
                <FuseButton type="button" onClick={() => setView('upload')}>MULAI SEKARANG →</FuseButton>
                <span>Client-side processing · no raw-file upload by default</span>
              </div>
            </div>
            <div className="welcome-card glass-panel">
              <div className="mini-card-head"><span>VELLORA / STUDIO</span><span>01</span></div>
              <div className="mini-graph">
                <div className="mini-line" />
                {[0,1,2,3,4,5,6,7].map((item) => <span key={item} style={{ height: `${28 + ((item * 17) % 55)}%` }} />)}
              </div>
              <div className="mini-card-footer"><span>Turn messy exports</span><strong>into insight.</strong></div>
            </div>
          </section>
        )}

        {view === 'upload' && (
          <section className="upload-stage page-enter">
            <div className="page-head">
              <button className="back-link" type="button" onClick={() => setView(report ? 'report' : 'welcome')}><ArrowLeft size={16} /> Kembali</button>
              <div><span className="eyebrow">INPUT LAYER</span><h1>UPLOAD DATA AFFILIATE</h1><p>Masukkan satu atau beberapa export. VELLORA membaca file di perangkat ini lalu membangun report yang dinamis.</p></div>
            </div>

            <div className="upload-layout">
              <div className="upload-main glass-panel">
                <UploadDropzone files={files} setFiles={setFiles} />
                <div className="upload-summary"><span>{fileCountText}</span>{files.length > 0 && <strong>{files.reduce((sum, item) => sum + item.file.size, 0) / 1024 / 1024 < 1 ? 'local memory' : 'local files'}</strong>}</div>
              </div>
              <aside className="option-panel glass-panel">
                <div className="option-head"><span className="eyebrow">REPORT OPTIONS</span><TextLoop items={['quiet precision', 'black editorial', 'presentation-ready']} /></div>
                <GlideSelect label="Aspect ratio" value={options.aspectRatio} onChange={(value) => updateOption('aspectRatio', value)} options={[
                  { value: '1:1', label: '1:1 Square' }, { value: '4:5', label: '4:5 Portrait' }, { value: '9:16', label: '9:16 Story' }, { value: '16:9', label: '16:9 Landscape' }, { value: 'custom', label: 'Custom', description: '4 × 5' },
                ]} />
                {options.aspectRatio === 'custom' && <div className="custom-ratio"><label>W <input type="number" min="1" step="1" value={options.customWidth} onChange={(event: any) => updateOption('customWidth', Number(event.target.value) || 1)} /></label><span>/</span><label>H <input type="number" min="1" step="1" value={options.customHeight} onChange={(event: any) => updateOption('customHeight', Number(event.target.value) || 1)} /></label></div>}
                <GlideSelect label="Visual template" value={options.template} onChange={(value) => updateOption('template', value)} options={[
                  { value: 'affiliate-monthly', label: 'Affiliate Monthly', description: 'Current template' },
                ]} />
                <GlideSelect label="Report type" value={options.reportType} onChange={(value) => updateOption('reportType', value)} options={[{ value: 'affiliate-monthly', label: 'Affiliate Monthly' }, { value: 'affiliate-overview', label: 'Affiliate Overview' }]} />
                <GlideSelect label="Visualization mode" value={options.visualizationMode} onChange={(value) => updateOption('visualizationMode', value)} options={[{ value: 'detailed', label: 'Detailed' }, { value: 'compact', label: 'Compact' }]} />
                <GlideSelect label="Export format" value={options.exportFormat} onChange={(value) => updateOption('exportFormat', value)} options={[{ value: 'png', label: 'PNG Image' }, { value: 'json', label: 'JSON Data' }]} />
              </aside>
            </div>

            {(parserWarnings.length > 0 || parserErrors.length > 0) && (
              <div className="validation-panel glass-panel">
                <span className="eyebrow">VALIDATION</span>
                {parserErrors.map((error) => <p className="validation-error" key={error}>× {error}</p>)}
                {parserWarnings.slice(0, 8).map((warning) => <p className="validation-warning" key={warning}>• {warning}</p>)}
              </div>
            )}

            <div className="upload-actions">
              <FuseButton type="button" onClick={generateReport} disabled={!files.length}>BUILD REPORT →</FuseButton>
              <FuseButton type="button" destructive onClick={resetAll} disabled={!files.length}>RESET</FuseButton>
            </div>
          </section>
        )}

        {view === 'processing' && (
          <section className="processing-stage page-enter">
            <div className="processing-head"><span className="eyebrow">ANALYZE YOUR DATA</span><h1>Building a visual report.</h1><p>No fake AI thinking — only the processing required to turn your files into a report.</p></div>
            <div className="processing-grid">
              <div className="processing-loader glass-panel"><LatticeLoader steps={PROCESS_STEPS} activeStep={processingStep} /><div className="processing-facts"><span>{files.length} source file{files.length === 1 ? '' : 's'}</span><span>Local browser engine</span><span>{processStartedAt ? `${((performance.now() - processStartedAt) / 1000).toFixed(1)}s` : '—'}</span></div></div>
              <div className="thought-card glass-panel"><ThoughtLine steps={PROCESS_STEPS} activeStep={processingStep} /></div>
            </div>
          </section>
        )}

        {view === 'report' && report && (
          <section className="report-stage page-enter">
            <div className="report-toolbar glass-panel">
              <div><span className="eyebrow">REPORT READY ✓</span><h1>{formatCurrency(report.estimatedCommission, true)} estimated commission</h1><p>{formatNumber(report.uniqueOrders)} unique orders · {formatNumber(report.totalUnits)} units · {formatCurrency(report.totalGMV)} GMV</p></div>
              <div className="toolbar-actions"><FuseButton type="button" onClick={exportReport}><Download size={16} /> EXPORT REPORT</FuseButton><FuseButton type="button" onClick={() => setView('upload')}><RotateCcw size={16} /> NEW REPORT</FuseButton></div>
            </div>
            <div className="report-wrap"><AffiliateMonthlyReport report={report} options={options} /></div>
            <div className="report-bottom-note"><span>Data diproses dan dinormalisasi di perangkat ini.</span><span>VELLORA · black editorial analytics</span></div>
          </section>
        )}
      </main>

      <PeekRating />
      <footer className="site-footer shell-width"><span>VELLORA</span><span>by Haidar Abdurrohman</span><span>Local-first prototype · future-ready architecture</span></footer>
    </div>
  );
}

export default App;
