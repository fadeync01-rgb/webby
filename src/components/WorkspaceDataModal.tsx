import React, { useState } from 'react';
import { AcademicTask, Notebook, PresentationOutline } from '../types';
import { Download, Upload, RotateCcw, X, Check, Database } from 'lucide-react';
import { INITIAL_TASKS, INITIAL_NOTEBOOKS, INITIAL_OUTLINES } from '../utils/storage';

interface WorkspaceDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: AcademicTask[];
  notebooks: Notebook[];
  outlines: PresentationOutline[];
  onImportAll: (data: { tasks: AcademicTask[]; notebooks: Notebook[]; outlines: PresentationOutline[] }) => void;
  onResetToDemo: () => void;
}

export const WorkspaceDataModal: React.FC<WorkspaceDataModalProps> = ({
  isOpen,
  onClose,
  tasks,
  notebooks,
  outlines,
  onImportAll,
  onResetToDemo,
}) => {
  const [copied, setCopied] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const payload = {
      version: 'webby_v1',
      exportedAt: new Date().toISOString(),
      tasks,
      notebooks,
      outlines,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webby_academic_workspace_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    const payload = {
      version: 'webby_v1',
      exportedAt: new Date().toISOString(),
      tasks,
      notebooks,
      outlines,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!parsed.tasks || !parsed.notebooks) {
        throw new Error('Format JSON cadangan tidak valid (harus mengandung tasks dan notebooks).');
      }
      onImportAll({
        tasks: parsed.tasks,
        notebooks: parsed.notebooks,
        outlines: parsed.outlines || [],
      });
      setImportStatus('Data berhasil dipulihkan!');
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setImportStatus(err instanceof Error ? err.message : 'Gagal memproses JSON');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white border border-[#E5E3DD] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-[#F0EFEA]">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#191918]" />
              <h3 className="text-base font-semibold text-[#191918]">
                Penyimpanan & Manajemen Workspace
              </h3>
            </div>
            <button onClick={onClose} className="p-1 text-[#8C8A84] hover:text-[#191918]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#646461] leading-relaxed">
            Seluruh data materi, tugas Sidepod, dan presentasi tersimpan secara persisten pada peramban Anda. Anda dapat mengunduh salinan cadangan atau memulihkan data sewaktu-waktu.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleExportJson}
              className="flex items-center justify-center gap-2 p-3 text-xs font-medium text-[#191918] bg-[#FAF9F6] border border-[#DDDCD6] hover:bg-[#F2F1ED] rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File Cadangan JSON</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="flex items-center justify-center gap-2 p-3 text-xs font-medium text-[#191918] bg-[#FAF9F6] border border-[#DDDCD6] hover:bg-[#F2F1ED] rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-[#2E7D32]" /> : <Database className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin JSON ke Papan Klip'}</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="space-y-2 pt-2 border-t border-[#F0EFEA]">
            <label className="text-xs font-medium text-[#403F3D] block">
              Pulihkan Data dari JSON Cadangan
            </label>
            <textarea
              rows={3}
              placeholder="Tempelkan data JSON di sini..."
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="w-full p-2.5 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918] font-mono text-[11px]"
            />
            {importStatus && (
              <p className={`text-xs ${importStatus.includes('berhasil') ? 'text-[#2E7D32]' : 'text-[#B43425]'}`}>
                {importStatus}
              </p>
            )}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Pulihkan ke data demo akademik bawaan Webby? Semua perubahan kustom akan digantikan.')) {
                    onResetToDemo();
                    onClose();
                  }
                }}
                className="text-xs text-[#8C8A84] hover:text-[#B43425] flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Data Demo Bawaan</span>
              </button>

              <button
                type="button"
                disabled={!importJson.trim()}
                onClick={handleExecuteImport}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] disabled:opacity-40 rounded-md transition-colors"
              >
                Impor Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
