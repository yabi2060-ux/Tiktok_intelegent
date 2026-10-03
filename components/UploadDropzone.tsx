import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';
import { formatNumber } from '../engine/utils';

export interface QueuedFile {
  file: File;
  id: string;
  state: 'ready' | 'parsing' | 'invalid';
  message?: string;
}

function fileId(file: File) { return `${file.name}-${file.size}-${file.lastModified}`; }

export function UploadDropzone({ files, setFiles }: { files: QueuedFile[]; setFiles: Dispatch<SetStateAction<QueuedFile[]>> }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);

  const addFiles = (incoming: File[]) => {
    const accepted = incoming.filter((file) => ['xls', 'xlsx', 'csv'].includes(file.name.split('.').pop()?.toLowerCase() ?? ''));
    setFiles((current) => {
      const known = new Set(current.map((item) => item.id));
      const next = accepted.filter((file) => !known.has(fileId(file))).map((file) => ({ file, id: fileId(file), state: 'ready' as const }));
      return [...current, ...next];
    });
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length) addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  return (
    <div className="upload-stack">
      <div
        className={`dropzone ${over ? 'is-over' : ''}`}
        onDragOver={(event: any) => { event.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(event: any) => { event.preventDefault(); setOver(false); addFiles(Array.from(event.dataTransfer.files)); }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" hidden accept=".xls,.xlsx,.csv" multiple onChange={(event: any) => addFiles(Array.from(event.target.files ?? []))} />
        <div className="drop-icon"><Upload size={20} /></div>
        <div>
          <strong>UPLOAD DATA AFFILIATE</strong>
          <p>Tarik file ke sini atau pilih dari perangkat</p>
          <small>.xls · .xlsx · .csv · multi-file</small>
        </div>
      </div>

      <div className="file-list" aria-live="polite">
        <div className="file-list-head"><span>FILES READY</span><strong>{files.length}</strong></div>
        {files.length === 0 ? (
          <div className="empty-file">No affiliate data yet.<span>Upload your XLS atau XLSX report untuk mulai.</span></div>
        ) : (
          files.map((item) => (
            <div className="file-row" key={item.id}>
              <div className="file-symbol"><FileSpreadsheet size={16} /></div>
              <div className="file-meta"><strong>{item.file.name}</strong><span>{item.file.name.split('.').pop()?.toUpperCase()} · {formatNumber(item.file.size / 1024)} KB</span></div>
              <div className="file-state">{item.state === 'ready' ? '✓ Ready' : item.state === 'invalid' ? '× Invalid' : '… Parsing'}</div>
              <button type="button" className="icon-button subtle" onClick={(event: any) => { event.stopPropagation(); setFiles((current) => current.filter((file) => file.id !== item.id)); }} aria-label={`Hapus ${item.file.name}`}><X size={14} /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
