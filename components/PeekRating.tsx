import { useState } from 'react';
import { Send, X } from 'lucide-react';

export function PeekRating() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'preparing' | 'sending' | 'finishing' | 'success'>('idle');

  const submit = () => {
    if (!rating) return;
    setState('preparing');
    window.setTimeout(() => setState('sending'), 420);
    window.setTimeout(() => setState('finishing'), 860);
    window.setTimeout(() => setState('success'), 1240);
  };

  return (
    <>
      <button className="peek-trigger" type="button" onClick={() => setOpen(true)} aria-label="Beri feedback">
        <span>✦</span>
      </button>
      {open && (
        <div className="peek-backdrop" role="presentation" onMouseDown={(event: any) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className="peek-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
            <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Tutup feedback"><X size={16} /></button>
            {state === 'success' ? (
              <div className="feedback-success">
                <div className="success-symbol">✦</div>
                <h2>Terima kasih ✦</h2>
                <p>Feedback kamu tersimpan untuk pengembangan VELLORA.</p>
                <button className="text-button" type="button" onClick={() => { setState('idle'); setRating(0); setMessage(''); setOpen(false); }}>Selesai</button>
              </div>
            ) : (
              <>
                <span className="eyebrow">PEEKRATING</span>
                <h2 id="feedback-title">Bagaimana pengalamanmu?</h2>
                <p>Kasih satu penilaian singkat agar visualisasi berikutnya terasa makin tepat.</p>
                <div className="rating-row" role="radiogroup" aria-label="Rating 1 sampai 5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" role="radio" aria-checked={rating === value} className={rating >= value ? 'active' : ''} onClick={() => setRating(value)}>{value}</button>
                  ))}
                </div>
                <textarea value={message} onChange={(e: any) => setMessage(e.target.value)} placeholder="Tulis catatan kecil…" rows={4} />
                <button type="button" className="feedback-submit" disabled={!rating || state !== 'idle'} onClick={submit}>
                  <span>{state === 'idle' ? 'Kirim feedback' : state === 'preparing' ? 'Menyiapkan feedback…' : state === 'sending' ? 'Mengirim feedback…' : 'Menyelesaikan…'}</span>
                  <Send size={15} />
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
