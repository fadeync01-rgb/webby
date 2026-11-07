import React, { useState, useEffect } from 'react';
import { Notebook, NotebookSection } from '../types';
import {
  BookOpen, Plus, Search, Upload, Copy, Trash2, ArrowLeft,
  Presentation, Check, FileText, MoveUp, MoveDown,
  Layers, ExternalLink, Printer
} from 'lucide-react';

interface NotebookStudioViewProps {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  onSelectNotebook: (id: string | null) => void;
  onSaveNotebook: (notebook: Notebook) => void;
  onDeleteNotebook: (id: string) => void;
  onDuplicateNotebook: (notebook: Notebook) => void;
  onSendToPresentation: (notebook: Notebook) => void;
  subjectOptions: string[];
}

export const NotebookStudioView: React.FC<NotebookStudioViewProps> = ({
  notebooks,
  activeNotebookId,
  onSelectNotebook,
  onSaveNotebook,
  onDeleteNotebook,
  onDuplicateNotebook,
  onSendToPresentation,
  subjectOptions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Import Modal state
  const [importTitle, setImportTitle] = useState('');
  const [importSubject, setImportSubject] = useState(subjectOptions[0] || 'Umum');
  const [importFileType, setImportFileType] = useState<'pdf' | 'docx' | 'notes'>('pdf');
  const [importRawText, setImportRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Active notebook working state
  const currentNotebook = notebooks.find((n) => n.id === activeNotebookId) || null;
  const [editedNotebook, setEditedNotebook] = useState<Notebook | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (currentNotebook) {
      setEditedNotebook(JSON.parse(JSON.stringify(currentNotebook)));
      if (currentNotebook.sections.length > 0) {
        setActiveSectionId(currentNotebook.sections[0].id);
      }
    } else {
      setEditedNotebook(null);
    }
  }, [activeNotebookId]);

  // Debounced Autosave
  useEffect(() => {
    if (!editedNotebook) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      onSaveNotebook({
        ...editedNotebook,
        updatedAt: new Date().toISOString(),
      });
      setSaveStatus('saved');
    }, 700);

    return () => clearTimeout(timer);
  }, [editedNotebook]);

  // Word count and reading time
  const totalWords = editedNotebook
    ? editedNotebook.sections.reduce((acc, sec) => acc + sec.content.split(/\s+/).filter(Boolean).length, 0)
    : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

  // Handlers for active notebook
  const handleUpdateTitle = (title: string) => {
    if (!editedNotebook) return;
    setEditedNotebook({ ...editedNotebook, title });
  };

  const handleUpdateSubject = (subject: string) => {
    if (!editedNotebook) return;
    setEditedNotebook({ ...editedNotebook, subject });
  };

  const handleUpdateSummary = (summary: string) => {
    if (!editedNotebook) return;
    setEditedNotebook({ ...editedNotebook, summary });
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<NotebookSection>) => {
    if (!editedNotebook) return;
    setEditedNotebook({
      ...editedNotebook,
      sections: editedNotebook.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, ...updates } : sec
      ),
    });
  };

  const handleAddSection = () => {
    if (!editedNotebook) return;
    const newSec: NotebookSection = {
      id: `sec-${Date.now()}`,
      title: `Bagian Baru ${editedNotebook.sections.length + 1}`,
      topic: `${editedNotebook.subject} · Topik Tambahan`,
      content: 'Tuliskan elaborasi materi dan penjelasan ilmiah di sini...',
      keyTakeaways: ['Poin pemahaman utama.'],
      definitions: [{ term: 'Konsep Kunci', definition: 'Penjelasan istilah' }],
      userNotes: '',
      originalCitation: 'Catatan tambahan pengguna',
    };
    setEditedNotebook({
      ...editedNotebook,
      sections: [...editedNotebook.sections, newSec],
    });
    setActiveSectionId(newSec.id);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!editedNotebook || editedNotebook.sections.length <= 1) return;
    setEditedNotebook({
      ...editedNotebook,
      sections: editedNotebook.sections.filter((s) => s.id !== sectionId),
    });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!editedNotebook) return;
    const newSections = [...editedNotebook.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setEditedNotebook({ ...editedNotebook, sections: newSections });
  };

  // Create new blank manual notebook
  const handleCreateBlank = () => {
    const newNb: Notebook = {
      id: `nb-${Date.now()}`,
      title: 'Materi Pembelajaran Baru',
      subject: subjectOptions[0] || 'Kalkulus Lanjut',
      summary: 'Tuliskan rangkuman dan ruang lingkup materi pembelajaran di sini...',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      sourceType: 'manual',
      sections: [
        {
          id: `sec-${Date.now()}-1`,
          title: '01. Pengantar dan Landasan Teori',
          topic: 'Fondasi Materi',
          content: 'Mulai menyusun penjelasan komprehensif, definisi istilah, dan keterkaitan topik di sini...',
          keyTakeaways: ['Prinsip dasar yang harus diingat.'],
          definitions: [
            { term: 'Terminologi 1', definition: 'Definisi atau penjelasan ilmiah.' },
          ],
          userNotes: 'Catatan pribadi untuk persiapan ujian.',
          originalCitation: 'Penyusunan mandiri',
        },
      ],
    };
    onSaveNotebook(newNb);
    onSelectNotebook(newNb.id);
  };

  // Document Import with AI Extraction
  const handleRunExtraction = async () => {
    if (!importRawText.trim()) {
      setExtractError('Harap masukkan isi teks dokumen atau pilih contoh materi.');
      return;
    }
    setIsExtracting(true);
    setExtractError(null);

    try {
      const response = await fetch('/api/extract-notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: importRawText,
          title: importTitle || 'Hasil Ekstraksi Dokumen',
          subject: importSubject,
          fileType: importFileType,
          fileName: `${importTitle || 'Dokumen'}.${importFileType}`,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengekstrak dokumen.');
      }

      const createdNb: Notebook = {
        ...data.notebook,
        id: `nb-${Date.now()}`,
      };

      onSaveNotebook(createdNb);
      setIsImportModalOpen(false);
      onSelectNotebook(createdNb.id);
      // Reset form
      setImportTitle('');
      setImportRawText('');
    } catch (err: unknown) {
      setExtractError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Sample document quick-loader
  const loadSampleDocument = (type: 'biologi' | 'fisika' | 'hukum') => {
    if (type === 'biologi') {
      setImportTitle('Mekanisme Transkripsi RNA & Regulasi Genomik');
      setImportSubject('Biologi Sel & Molekuler');
      setImportFileType('pdf');
      setImportRawText(`Transkripsi merupakan tahapan pertama dalam ekspresi gen di mana urutan DNA spesifik disalin menjadi molekul RNA oleh enzim RNA Polimerase. Pada organisme eukariotik, proses ini terjadi di dalam inti sel dan melibatkan tiga jenis RNA polimerase utama, dengan RNA Polimerase II bertanggung jawab atas sintesis mRNA.

Inisiasi transkripsi memerlukan pengenalan sekuens promotor, khususnya kotak TATA (TATA box) yang terletak sekitar 25-30 pasang basa di hulu titik awal transkripsi. Faktor transkripsi umum (seperti TFIID, TFIIB, TFIIE, dan TFIIH) berikatan secara bertahap membentuk kompleks pra-inisiasi (pre-initiation complex). TFIIH memiliki aktivitas helikase yang membuka heliks ganda DNA serta aktivitas kinase yang memfosforilasi ekor domain C-terminal (CTD) dari RNA Polimerase II untuk memicu pelepasan promotor dan memulai elongasi.

Selama elongasi, RNA polimerase bergerak sepanjang untai cetakan (template strand) dengan arah 3' ke 5', sambil merangkai ribonukleotida trifosfat komplementer dengan arah 5' ke 3'. Pemrosesan kotranskripsional mencakup penambahan tudung 5' metilguanosin (5' cap), penyambungan ekson dan pembuangan intron melalui spliceosome, serta penambahan ekor poli-A (polyadenylation) di ujung 3'.`);
    } else if (type === 'fisika') {
      setImportTitle('Prinsip Superposisi Gelombang & Interferensi Celah Ganda');
      setImportSubject('Fisika Dasar');
      setImportFileType('docx');
      setImportRawText(`Eksperimen celah ganda Thomas Young pada tahun 1801 menjadi tonggak sejarah yang membuktikan sifat gelombang dari cahaya. Ketika gelombang monokromatik koheren melewati dua celah sempit yang terpisah sejauh d, masing-masing celah bertindak sebagai sumber gelombang sekunder sesuai prinsip Huygens.

Pola interferensi yang terbentuk pada layar berjarak L ditentukan oleh perbedaan panjang lintasan (path difference) antara kedua gelombang: Δr = d sin(θ).
Interferensi konstruktif (garis terang) terjadi jika perbedaan lintasan merupakan kelipatan bulat dari panjang gelombang: d sin(θ) = m λ, di mana m = 0, ±1, ±2, ...
Interferensi destruktif (garis gelap) terjadi jika perbedaan lintasan merupakan kelipatan setengah ganjil: d sin(θ) = (m + 0.5) λ.

Jarak antargaris terang yang berdekatan pada layar didekati dengan rumus: Δy = λ L / d (untuk sudut θ yang sangat kecil). Fenomena ini menjadi bukti definitif sifat gelombang sebelum lahirnya mekanika kuantum yang memperkenalkan dualisme gelombang-partikel.`);
    } else {
      setImportTitle('Asas Kedaulatan Rakyat & Konstitusionalisme Indonesia');
      setImportSubject('Hukum Tata Negara');
      setImportFileType('pdf');
      setImportRawText(`Konsep kedaulatan rakyat menyatakan bahwa kekuasaan tertinggi dalam suatu negara berada di tangan rakyat. Namun, dalam negara hukum demokratis (democratische rechtsstaat), kedaulatan rakyat tidak boleh dijalankan secara mutlak tanpa batas, melainkan harus diikat dalam koridor norma konstitusi.

Pasal 1 Ayat (2) UUD 1945 sebelum amandemen menyatakan bahwa "Kedaulatan adalah di tangan rakyat, dan dilakukan sepenuhnya oleh Majelis Permusyawaratan Rakyat". Hal ini menempatkan MPR sebagai lembaga tertinggi negara dengan kekuasaan tanpa batas. Pasca-Amandemen ketiga pada tahun 2001, ketentuan ini diubah secara fundamental menjadi: "Kedaulatan berada di tangan rakyat dan dilaksanakan menurut Undang-Undang Dasar".

Perubahan ini menandai peralihan dari prinsip supremasi parlemen menuju supremasi konstitusi. Tidak ada lagi lembaga tertinggi negara; semua lembaga negara berada pada kedudukan yang sejajar dan diatur wewenangnya oleh UUD, dengan Mahkamah Konstitusi sebagai pengawal konstitusi (the guardian of the constitution).`);
    }
  };

  // Filter notebooks
  const filteredNotebooks = notebooks.filter((n) => {
    const matchQuery =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = selectedSubject === 'all' || n.subject === selectedSubject;
    return matchQuery && matchSubject;
  });

  // Render: Workspace Editor View
  if (editedNotebook) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Editor Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE8E3]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectNotebook(null)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED] rounded-md transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Semua Notebook</span>
            </button>
            <span className="text-[#C4C2BC]" aria-hidden="true">/</span>
            {/* Autosave status indicator */}
            <div className="flex items-center gap-1.5 text-xs text-[#7A7874] font-medium">
              {saveStatus === 'saved' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Tersimpan otomatis</span>
                </>
              ) : (
                <span className="animate-pulse">Menyimpan...</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSendToPresentation(editedNotebook)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors shadow-2xs"
              title="Bagi materi notebook ini menjadi outline presentasi"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Bagi ke Slide Outline</span>
            </button>

            <button
              onClick={() => onDuplicateNotebook(editedNotebook)}
              title="Duplikasi notebook ini"
              className="p-1.5 text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED] rounded-md transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.print()}
              title="Cetak materi"
              className="p-1.5 text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED] rounded-md transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (confirm('Hapus notebook ini secara permanen?')) {
                  onDeleteNotebook(editedNotebook.id);
                  onSelectNotebook(null);
                }
              }}
              title="Hapus notebook"
              className="p-1.5 text-[#646461] hover:text-[#B43425] hover:bg-[#FDF0EE] rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notebook Title & Header Area */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-[#7A7874]">
            <select
              value={editedNotebook.subject}
              onChange={(e) => handleUpdateSubject(e.target.value)}
              className="px-2 py-1 bg-white border border-[#DDDCD6] rounded-md text-xs font-medium text-[#4A4946] focus:outline-none focus:ring-1 focus:ring-[#191918]"
            >
              {subjectOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{totalWords} kata</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">~{readingTimeMinutes} menit baca</span>
            <span aria-hidden="true">·</span>
            <span>{editedNotebook.sourceFileName || 'Penyusunan Langsung'}</span>
          </div>

          <input
            type="text"
            value={editedNotebook.title}
            onChange={(e) => handleUpdateTitle(e.target.value)}
            className="w-full text-2xl sm:text-3xl font-bold text-[#191918] bg-transparent border-b border-transparent hover:border-[#DDDCD6] focus:border-[#191918] focus:outline-none transition-colors py-1"
            placeholder="Judul Materi..."
          />

          <textarea
            rows={2}
            value={editedNotebook.summary}
            onChange={(e) => handleUpdateSummary(e.target.value)}
            className="w-full text-xs text-[#646461] bg-transparent border border-transparent hover:border-[#EAE8E3] focus:border-[#191918] focus:bg-white rounded-md p-2 transition-all leading-relaxed"
            placeholder="Ringkasan atau tujuan pembelajaran..."
          />
        </div>

        {/* Workspace Body: Sticky TOC on Left + Sections Canvas on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          {/* Table of Contents Column */}
          <aside className="lg:col-span-3 sticky top-20 space-y-3 bg-white p-4 border border-[#EAE8E3] rounded-lg shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EFEA]">
              <span className="text-xs font-semibold text-[#191918] uppercase tracking-wider">
                Daftar Isi
              </span>
              <span className="text-[10px] text-[#8C8A84] tabular-nums">
                {editedNotebook.sections.length} Bagian
              </span>
            </div>

            <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {editedNotebook.sections.map((sec, idx) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSectionId(sec.id);
                    document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`block px-2.5 py-1.5 text-xs rounded transition-colors text-left truncate ${
                    activeSectionId === sec.id
                      ? 'bg-[#EAE8E3] text-[#191918] font-semibold'
                      : 'text-[#646461] hover:text-[#191918] hover:bg-[#F4F3EE]'
                  }`}
                >
                  <span className="font-mono text-[10px] mr-1.5 text-[#8C8A84]">{idx + 1}.</span>
                  {sec.title}
                </a>
              ))}
            </nav>

            <button
              onClick={handleAddSection}
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-[#191918] bg-[#FAF9F6] border border-[#DDDCD6] hover:bg-[#F2F1ED] rounded-md transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Bagian</span>
            </button>
          </aside>

          {/* Sections Canvas */}
          <main className="lg:col-span-9 space-y-6">
            {editedNotebook.sections.map((section, index) => (
              <article
                key={section.id}
                id={section.id}
                className="p-6 bg-white border border-[#EAE8E3] rounded-lg shadow-2xs space-y-4 scroll-mt-20"
              >
                {/* Section Header Controls */}
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
                  <input
                    type="text"
                    value={section.topic}
                    onChange={(e) => handleUpdateSection(section.id, { topic: e.target.value })}
                    className="text-xs font-medium text-[#7A7874] bg-transparent border-b border-transparent hover:border-[#DDDCD6] focus:border-[#191918] focus:outline-none"
                    placeholder="Nama Topik..."
                  />

                  <div className="flex items-center gap-1 text-[#8C8A84]">
                    <button
                      onClick={() => handleMoveSection(index, 'up')}
                      disabled={index === 0}
                      title="Pindahkan ke atas"
                      className="p-1 hover:text-[#191918] hover:bg-[#F2F1ED] rounded disabled:opacity-30"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(index, 'down')}
                      disabled={index === editedNotebook.sections.length - 1}
                      title="Pindahkan ke bawah"
                      className="p-1 hover:text-[#191918] hover:bg-[#F2F1ED] rounded disabled:opacity-30"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    {editedNotebook.sections.length > 1 && (
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        title="Hapus bagian ini"
                        className="p-1 hover:text-[#B43425] hover:bg-[#FDF0EE] rounded ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section Title */}
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                  className="w-full text-lg font-semibold text-[#191918] bg-transparent border-b border-transparent hover:border-[#DDDCD6] focus:border-[#191918] focus:outline-none py-0.5"
                  placeholder="Judul Bagian..."
                />

                {/* Main Explanatory Content */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#7A7874] uppercase tracking-wider block">
                    Penjelasan Komprehensif
                  </label>
                  <textarea
                    rows={8}
                    value={section.content}
                    onChange={(e) => handleUpdateSection(section.id, { content: e.target.value })}
                    className="w-full p-3.5 text-xs text-[#2E2E2D] leading-relaxed bg-[#FAF9F6] border border-[#EAE8E3] rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191918] font-normal"
                    placeholder="Tuliskan uraian materi pembelajaran lengkap di sini..."
                  />
                </div>

                {/* Key Takeaways (Poin Penting) */}
                <div className="space-y-2 p-3.5 bg-[#F9F8F5] border border-[#EAE8E3] rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#191918]">Poin Kunci & Wawasan</span>
                    <button
                      onClick={() => {
                        const updated = [...section.keyTakeaways, 'Poin penting baru.'];
                        handleUpdateSection(section.id, { keyTakeaways: updated });
                      }}
                      className="text-[11px] font-medium text-[#191918] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Poin</span>
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {section.keyTakeaways.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <span className="text-[#8C8A84] text-xs mt-1">·</span>
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => {
                            const updated = [...section.keyTakeaways];
                            updated[pIdx] = e.target.value;
                            handleUpdateSection(section.id, { keyTakeaways: updated });
                          }}
                          className="flex-1 text-xs text-[#2E2E2D] bg-transparent border-b border-transparent hover:border-[#DDDCD6] focus:border-[#191918] focus:outline-none"
                        />
                        {section.keyTakeaways.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = section.keyTakeaways.filter((_, i) => i !== pIdx);
                              handleUpdateSection(section.id, { keyTakeaways: updated });
                            }}
                            className="text-[#A4A29C] hover:text-[#B43425] text-xs px-1"
                          >
                            ×
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Definitions & Glossary Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#191918]">Glosarium & Definisi Istilah</span>
                    <button
                      onClick={() => {
                        const updated = [
                          ...section.definitions,
                          { term: 'Istilah Baru', definition: 'Penjelasan definisi istilah' },
                        ];
                        handleUpdateSection(section.id, { definitions: updated });
                      }}
                      className="text-[11px] font-medium text-[#191918] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Istilah</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {section.definitions.map((def, dIdx) => (
                      <div key={dIdx} className="p-2.5 bg-[#FAF9F6] border border-[#EAE8E3] rounded-md space-y-1">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={def.term}
                            onChange={(e) => {
                              const updated = [...section.definitions];
                              updated[dIdx] = { ...updated[dIdx], term: e.target.value };
                              handleUpdateSection(section.id, { definitions: updated });
                            }}
                            className="font-semibold text-xs text-[#191918] bg-transparent border-b border-transparent hover:border-[#DDDCD6] focus:border-[#191918] focus:outline-none"
                            placeholder="Istilah..."
                          />
                          <button
                            onClick={() => {
                              const updated = section.definitions.filter((_, i) => i !== dIdx);
                              handleUpdateSection(section.id, { definitions: updated });
                            }}
                            className="text-[#A4A29C] hover:text-[#B43425] text-xs px-1"
                          >
                            ×
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={def.definition}
                          onChange={(e) => {
                            const updated = [...section.definitions];
                            updated[dIdx] = { ...updated[dIdx], definition: e.target.value };
                            handleUpdateSection(section.id, { definitions: updated });
                          }}
                          className="w-full text-[11px] text-[#646461] bg-transparent border-b border-transparent hover:border-[#DDDCD6] focus:border-[#191918] focus:outline-none resize-none leading-relaxed"
                          placeholder="Penjelasan istilah..."
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Traceability / Original Citation (Crucial requirement) */}
                {section.originalCitation && (
                  <div className="pt-2 text-[11px] text-[#8C8A84] flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>Terlacak ke sumber: <em>{section.originalCitation}</em></span>
                  </div>
                )}

                {/* Personal Student Annotations / Scratchpad */}
                <div className="pt-2 border-t border-[#F0EFEA]">
                  <label className="text-[11px] font-medium text-[#7A7874] block mb-1">
                    Catatan Belajar Pribadi
                  </label>
                  <textarea
                    rows={2}
                    value={section.userNotes || ''}
                    onChange={(e) => handleUpdateSection(section.id, { userNotes: e.target.value })}
                    className="w-full p-2 text-xs text-[#4A4946] bg-[#FAF9F6] border border-[#EAE8E3] rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191918]"
                    placeholder="Tuliskan catatan pribadi, pertanyaan untuk dosen, atau rumus singkat..."
                  />
                </div>
              </article>
            ))}

            <button
              onClick={handleAddSection}
              className="w-full py-3 border border-dashed border-[#DDDCD6] hover:border-[#191918] bg-white text-xs font-medium text-[#4A4946] hover:text-[#191918] rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bagian Materi Pembelajaran Berikutnya</span>
            </button>
          </main>
        </div>
      </div>
    );
  }

  // Render: List of Notebooks View
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#EAE8E3]">
        <div>
          <h1 className="text-2xl font-semibold text-[#191918]">Notebook Studio</h1>
          <p className="text-xs text-[#7A7874] mt-1">
            Ruang kerja pembuatan, pengorganisasian, dan pengembangan materi pembelajaran secara berkelanjutan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#191918] bg-white border border-[#DDDCD6] hover:bg-[#F4F3EF] rounded-md transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Dokumen (AI)</span>
          </button>
          <button
            onClick={handleCreateBlank}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Notebook Baru</span>
          </button>
        </div>
      </div>

      {/* Search & Subject Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#8C8A84] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari judul materi, subjek, atau isi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
          />
        </div>

        {/* Subject Filter Segmented Control */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EAE8E3] rounded-md text-xs font-medium">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-1 rounded transition-colors ${
              selectedSubject === 'all'
                ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                : 'text-[#646461] hover:text-[#191918]'
            }`}
          >
            Semua Subjek
          </button>
          {subjectOptions.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1 rounded transition-colors ${
                selectedSubject === subj
                  ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                  : 'text-[#646461] hover:text-[#191918]'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Notebooks */}
      {filteredNotebooks.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-[#DDDCD6] rounded-lg bg-white">
          <BookOpen className="w-8 h-8 text-[#A4A29C] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#191918]">Belum Ada Catatan yang Sesuai</h3>
          <p className="text-xs text-[#7A7874] mt-1 max-w-sm mx-auto">
            Mulai dengan membuat catatan manual atau unggah file materi kuliah untuk diolah oleh sistem.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={handleCreateBlank}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#191918] rounded-md hover:bg-[#2C2C2A]"
            >
              Buat Catatan Manual
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-[#191918] bg-[#F4F3EF] border border-[#DDDCD6] rounded-md hover:bg-[#EAE8E3]"
            >
              Impor Dokumen
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotebooks.map((nb) => (
            <div
              key={nb.id}
              className="p-5 bg-white border border-[#EAE8E3] hover:border-[#C4BFB5] rounded-lg transition-all shadow-2xs flex flex-col justify-between group"
            >
              <div>
                {/* Unboxed Metadata Line with typographic separators */}
                <div className="flex items-center justify-between text-xs text-[#7A7874] mb-2">
                  <span className="font-medium text-[#4A4946]">{nb.subject}</span>
                  <span className="text-[11px] tabular-nums">
                    {nb.sections.length} Bagian
                  </span>
                </div>

                <h3
                  onClick={() => onSelectNotebook(nb.id)}
                  className="text-base font-semibold text-[#191918] group-hover:text-black cursor-pointer line-clamp-2"
                >
                  {nb.title}
                </h3>

                <p className="text-xs text-[#646461] line-clamp-3 mt-2 leading-relaxed">
                  {nb.summary}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-5 border-t border-[#F0EFEA] flex items-center justify-between">
                <span className="text-[11px] text-[#8C8A84]">
                  {nb.sourceType === 'pdf' ? 'PDF' : nb.sourceType === 'docx' ? 'DOCX' : 'Catatan'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSendToPresentation(nb)}
                    title="Bagi ke Slide Outline"
                    className="p-1.5 text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED] rounded transition-colors text-xs flex items-center gap-1 font-medium"
                  >
                    <Presentation className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Slide</span>
                  </button>

                  <button
                    onClick={() => onSelectNotebook(nb.id)}
                    className="px-3 py-1 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] rounded transition-colors"
                  >
                    Buka
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Document Import & AI Extraction */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/35 backdrop-blur-xs transition-opacity"
            onClick={() => !isExtracting && setIsImportModalOpen(false)}
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white border border-[#E5E3DD] rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-[#F0EFEA]">
                <div>
                  <h3 className="text-base font-semibold text-[#191918]">
                    Impor & Sintesis Dokumen Pembelajaran
                  </h3>
                  <p className="text-xs text-[#7A7874] mt-0.5">
                    Webby membaca materi mentah dan menstrukturkannya menjadi unit belajar komprehensif.
                  </p>
                </div>
                <button
                  onClick={() => !isExtracting && setIsImportModalOpen(false)}
                  className="text-[#8C8A84] hover:text-[#191918] text-sm p-1"
                >
                  ✕
                </button>
              </div>

              {/* Sample Document Quick Buttons */}
              <div>
                <label className="block text-[11px] font-medium text-[#7A7874] uppercase tracking-wider mb-1.5">
                  Gunakan Sampel Dokumen Kuliah (Opsional)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => loadSampleDocument('biologi')}
                    className="px-2.5 py-1 text-xs bg-[#FAF9F6] border border-[#DDDCD6] hover:bg-[#EAE8E3] rounded text-[#4A4946] transition-colors"
                  >
                    Biologi: Transkripsi RNA
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSampleDocument('fisika')}
                    className="px-2.5 py-1 text-xs bg-[#FAF9F6] border border-[#DDDCD6] hover:bg-[#EAE8E3] rounded text-[#4A4946] transition-colors"
                  >
                    Fisika: Interferensi Cahaya
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSampleDocument('hukum')}
                    className="px-2.5 py-1 text-xs bg-[#FAF9F6] border border-[#DDDCD6] hover:bg-[#EAE8E3] rounded text-[#4A4946] transition-colors"
                  >
                    Hukum: Kedaulatan Konstitusi
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#403F3D] mb-1">
                    Judul Dokumen / Bab
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Bab 3 Hukum Termodinamika"
                    value={importTitle}
                    onChange={(e) => setImportTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#403F3D] mb-1">
                    Mata Kuliah / Subjek
                  </label>
                  <select
                    value={importSubject}
                    onChange={(e) => setImportSubject(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                  >
                    {subjectOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="Filsafat Ilmu">Filsafat Ilmu</option>
                    <option value="Ekonomi Makro">Ekonomi Makro</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[#403F3D]">
                    Isi Dokumen / Naskah Sumber *
                  </label>
                  <span className="text-[11px] text-[#8C8A84]">
                    Format: Teks / PDF / Catatan
                  </span>
                </div>
                <textarea
                  rows={7}
                  required
                  placeholder="Tempelkan isi modul, diktat, naskah makalah, atau catatan kuliah di sini..."
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  className="w-full p-3 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918] leading-relaxed"
                />
              </div>

              {extractError && (
                <div className="p-2.5 bg-[#FDF0EE] border border-[#F5C2BC] text-[#B43425] text-xs rounded-md">
                  {extractError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isExtracting}
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#646461] hover:text-[#191918] rounded-md transition-colors"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={isExtracting}
                  onClick={handleRunExtraction}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] disabled:opacity-50 rounded-md transition-colors shadow-2xs"
                >
                  {isExtracting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mensintesis Materi...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Sintesis ke Notebook Studio</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
