import React, { useState } from 'react';
import { PresentationOutline, PresentationSlide, Notebook } from '../types';
import {
  Presentation, BookOpen, Clock, Copy, Plus, Trash2,
  MoveUp, MoveDown, Check, ArrowRight, Share2, Layers,
  FileText, Split, Combine
} from 'lucide-react';

interface PresentationDividerViewProps {
  outlines: PresentationOutline[];
  notebooks: Notebook[];
  preselectedNotebookId?: string | null;
  onSaveOutline: (outline: PresentationOutline) => void;
  onDeleteOutline: (outlineId: string) => void;
  subjectOptions: string[];
}

export const PresentationDividerView: React.FC<PresentationDividerViewProps> = ({
  outlines,
  notebooks,
  preselectedNotebookId,
  onSaveOutline,
  onDeleteOutline,
  subjectOptions,
}) => {
  // Active outline working state
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(
    outlines.length > 0 ? outlines[0].id : null
  );

  // Form states for dividing new material
  const [sourceMode, setSourceMode] = useState<'notebook' | 'text'>('notebook');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>(
    preselectedNotebookId || (notebooks.length > 0 ? notebooks[0].id : '')
  );
  const [customText, setCustomText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customSubject, setCustomSubject] = useState(subjectOptions[0] || 'Umum');
  const [targetSlideCount, setTargetSlideCount] = useState<number>(0); // 0 = Auto-recommend
  const [isDividing, setIsDividing] = useState(false);
  const [divideError, setDivideError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const currentOutline = outlines.find((o) => o.id === activeOutlineId) || null;

  // Total presentation speaking duration
  const totalDurationMinutes = currentOutline
    ? currentOutline.slides.reduce((acc, s) => acc + (s.estimatedMinutes || 2), 0)
    : 0;

  // Handle divide content submission
  const handleDivideContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDividing(true);
    setDivideError(null);

    let effectiveSourceText = '';
    let effectiveTitle = '';
    let effectiveSubject = '';

    if (sourceMode === 'notebook') {
      const sourceNb = notebooks.find((n) => n.id === selectedNotebookId);
      if (!sourceNb) {
        setDivideError('Harap pilih notebook sumber.');
        setIsDividing(false);
        return;
      }
      effectiveTitle = sourceNb.title;
      effectiveSubject = sourceNb.subject;
      effectiveSourceText = [
        `Judul Materi: ${sourceNb.title}`,
        `Ringkasan: ${sourceNb.summary}`,
        ...sourceNb.sections.map(
          (s) => `### ${s.title}\n${s.content}\n\nPoin Kunci:\n${s.keyTakeaways.join('\n')}`
        ),
      ].join('\n\n');
    } else {
      if (!customText.trim()) {
        setDivideError('Teks materi tidak boleh kosong.');
        setIsDividing(false);
        return;
      }
      effectiveTitle = customTitle.trim() || 'Outline Presentasi Baru';
      effectiveSubject = customSubject;
      effectiveSourceText = customText;
    }

    try {
      const res = await fetch('/api/divide-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: effectiveSourceText,
          sourceTitle: effectiveTitle,
          sourceSubject: effectiveSubject,
          targetSlideCount: Number(targetSlideCount) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal membagi materi presentasi.');
      }

      const newOutline: PresentationOutline = {
        ...data.outline,
        sourceNotebookId: sourceMode === 'notebook' ? selectedNotebookId : undefined,
        sourceTitle: effectiveTitle,
      };

      onSaveOutline(newOutline);
      setActiveOutlineId(newOutline.id);
    } catch (err: unknown) {
      setDivideError(err instanceof Error ? err.message : 'Terjadi kegagalan pemrosesan.');
    } finally {
      setIsDividing(false);
    }
  };

  // Slide mutations
  const handleUpdateSlide = (slideId: string, updates: Partial<PresentationSlide>) => {
    if (!currentOutline) return;
    const updatedSlides = currentOutline.slides.map((s) =>
      s.id === slideId ? { ...s, ...updates } : s
    );
    onSaveOutline({ ...currentOutline, slides: updatedSlides });
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (!currentOutline) return;
    const newSlides = [...currentOutline.slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    // Recalculate slide numbers
    const renumbered = newSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    onSaveOutline({ ...currentOutline, slides: renumbered });
  };

  const handleDeleteSlide = (slideId: string) => {
    if (!currentOutline || currentOutline.slides.length <= 1) return;
    const filtered = currentOutline.slides
      .filter((s) => s.id !== slideId)
      .map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    onSaveOutline({ ...currentOutline, slides: filtered });
  };

  const handleAddSlide = () => {
    if (!currentOutline) return;
    const newSlide: PresentationSlide = {
      id: `slide-${Date.now()}`,
      slideNumber: currentOutline.slides.length + 1,
      title: `Slide ${currentOutline.slides.length + 1}: Topik Lanjutan`,
      category: 'Analisis & Pembahasan',
      mainTakeaway: 'Pesan utama yang harus dipahami audiens.',
      bulletPoints: ['Poin pembahasan 1', 'Poin pembahasan 2', 'Poin pembahasan 3'],
      speakerNotes: 'Catatan panduan berbicara presenter.',
      estimatedMinutes: 2,
    };
    onSaveOutline({
      ...currentOutline,
      slides: [...currentOutline.slides, newSlide],
    });
  };

  const handleMergeWithPrevious = (index: number) => {
    if (!currentOutline || index <= 0) return;
    const prevSlide = currentOutline.slides[index - 1];
    const currSlide = currentOutline.slides[index];

    const mergedSlide: PresentationSlide = {
      ...prevSlide,
      title: `${prevSlide.title} & ${currSlide.title}`,
      bulletPoints: [...prevSlide.bulletPoints, ...currSlide.bulletPoints],
      speakerNotes: `${prevSlide.speakerNotes}\n\n[Lanjutan:] ${currSlide.speakerNotes}`,
      estimatedMinutes: prevSlide.estimatedMinutes + currSlide.estimatedMinutes,
    };

    const newSlides = [...currentOutline.slides];
    newSlides.splice(index - 1, 2, mergedSlide);
    const renumbered = newSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    onSaveOutline({ ...currentOutline, slides: renumbered });
  };

  // Export format: Clean text formatted for PowerPoint / Google Slides outline import
  const handleCopyFormattedSlides = () => {
    if (!currentOutline) return;
    const textBlocks = currentOutline.slides.map((s) => {
      const bullets = s.bulletPoints.map((b) => `  • ${b}`).join('\n');
      return `SLIDE ${s.slideNumber}: ${s.title.toUpperCase()}\n[Kategori: ${s.category} · Waktu: ${s.estimatedMinutes}m]\nPESAN INTI:\n${s.mainTakeaway}\n\nPOIN UTAMA:\n${bullets}\n\nCATATAN PEMBICARA (SPEAKER NOTES):\n${s.speakerNotes}\n${'='.repeat(45)}`;
    });

    const fullExport = `OUTLINE PRESENTASI AKADEMIK\nJudul: ${currentOutline.title}\nSubjek: ${currentOutline.subject}\nTotal Slide: ${currentOutline.slides.length} | Estimasi Durasi: ~${totalDurationMinutes} menit\n\n${textBlocks.join('\n\n')}`;

    navigator.clipboard.writeText(fullExport);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#EAE8E3]">
        <div>
          <h1 className="text-2xl font-semibold text-[#191918]">Presentation Divider</h1>
          <p className="text-xs text-[#7A7874] mt-1 max-w-xl">
            Presentation content organizer: membagi materi catatan menjadi struktur alur slide yang logis, lengkap dengan takeaway utama, poin presentasi, dan speaker notes.
          </p>
        </div>

        {currentOutline && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyFormattedSlides}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#191918] bg-white border border-[#DDDCD6] hover:bg-[#F4F3EF] rounded-md transition-colors shadow-2xs"
            >
              {copyFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin untuk PPT / Slides</span>
                </>
              )}
            </button>
            <button
              onClick={handleAddSlide}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Slide</span>
            </button>
          </div>
        )}
      </div>

      {/* Organizer Setup Box (Divider Trigger) */}
      <div className="p-5 bg-white border border-[#EAE8E3] rounded-lg shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#F0EFEA]">
          <div className="flex items-center gap-2">
            <Presentation className="w-4 h-4 text-[#191918]" />
            <span className="text-xs font-semibold text-[#191918] uppercase tracking-wider">
              Bagi Materi Baru ke Slide
            </span>
          </div>

          {/* Source Toggle Segmented Control */}
          <div className="flex items-center gap-1 p-0.5 bg-[#EAE8E3] rounded-md text-xs font-medium">
            <button
              type="button"
              onClick={() => setSourceMode('notebook')}
              className={`px-3 py-1 rounded transition-colors ${
                sourceMode === 'notebook'
                  ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                  : 'text-[#646461] hover:text-[#191918]'
              }`}
            >
              Dari Notebook Studio
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('text')}
              className={`px-3 py-1 rounded transition-colors ${
                sourceMode === 'text'
                  ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                  : 'text-[#646461] hover:text-[#191918]'
              }`}
            >
              Input Teks Bebas
            </button>
          </div>
        </div>

        <form onSubmit={handleDivideContent} className="space-y-3.5">
          {sourceMode === 'notebook' ? (
            <div>
              <label className="block text-xs font-medium text-[#403F3D] mb-1">
                Pilih Notebook Sumber *
              </label>
              {notebooks.length === 0 ? (
                <p className="text-xs text-[#7A7874] italic">
                  Belum ada materi di Notebook Studio. Beralih ke "Input Teks Bebas" atau buat materi terlebih dahulu.
                </p>
              ) : (
                <select
                  value={selectedNotebookId}
                  onChange={(e) => setSelectedNotebookId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                >
                  {notebooks.map((nb) => (
                    <option key={nb.id} value={nb.id}>
                      [{nb.subject}] {nb.title} ({nb.sections.length} bagian)
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#403F3D] mb-1">
                    Judul Materi / Presentasi
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Evaluasi Kebijakan Fiskal 2026"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#403F3D] mb-1">
                    Subjek / Mata Kuliah
                  </label>
                  <select
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                  >
                    {subjectOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#403F3D] mb-1">
                  Konten Naskah / Bahan Bacaan *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tempelkan teks materi perkuliahan yang ingin diorganisasi menjadi slide..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#646461]">Target Jumlah Slide:</span>
              <select
                value={targetSlideCount}
                onChange={(e) => setTargetSlideCount(Number(e.target.value))}
                className="px-2.5 py-1 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
              >
                <option value={0}>Rekomendasi Otomatis (Sistem)</option>
                <option value={4}>4 Slide (Ringkas)</option>
                <option value={6}>6 Slide (Standar)</option>
                <option value={8}>8 Slide (Mendalam)</option>
                <option value={10}>10 Slide (Komprehensif)</option>
                <option value={12}>12 Slide (Panjang)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isDividing}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] disabled:opacity-50 rounded-md transition-colors shadow-2xs"
            >
              {isDividing ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Membagi Alur Materi...</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span>Bagi Materi ke Struktur Slide</span>
                </>
              )}
            </button>
          </div>

          {divideError && (
            <div className="p-2.5 text-xs text-[#B43425] bg-[#FDF0EE] border border-[#F5C2BC] rounded-md">
              {divideError}
            </div>
          )}
        </form>
      </div>

      {/* Main Slide Organizer Section */}
      {currentOutline ? (
        <div className="space-y-6">
          {/* Outline Info Bar */}
          <div className="p-4 bg-white border border-[#EAE8E3] rounded-lg shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7A7874]">
                <span className="font-semibold text-[#191918]">{currentOutline.subject}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-medium text-[#191918]">{currentOutline.slides.length} Slide</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-[#7A7874]">
                  <Clock className="w-3 h-3" />
                  <span className="tabular-nums">Estimasi durasi total: ~{totalDurationMinutes} menit</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#191918] mt-1">
                {currentOutline.title}
              </h2>
            </div>

            {/* Outlines Switcher if multiple exist */}
            {outlines.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#7A7874]">Pilih Outline:</span>
                <select
                  value={activeOutlineId || ''}
                  onChange={(e) => setActiveOutlineId(e.target.value)}
                  className="px-2 py-1 text-xs bg-[#FAF9F6] border border-[#DDDCD6] rounded-md text-[#191918]"
                >
                  {outlines.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Slide Cards List */}
          <div className="space-y-4">
            {currentOutline.slides.map((slide, index) => (
              <div
                key={slide.id}
                className="p-5 bg-white border border-[#EAE8E3] rounded-lg shadow-2xs space-y-3.5 hover:border-[#DDDCD6] transition-colors"
              >
                {/* Slide Header Strip */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#F0EFEA]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-[#191918] text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                      {slide.slideNumber}
                    </span>
                    <input
                      type="text"
                      value={slide.category}
                      onChange={(e) => handleUpdateSlide(slide.id, { category: e.target.value })}
                      className="text-xs font-semibold uppercase tracking-wider text-[#7A7874] bg-transparent border-b border-transparent hover:border-[#DDDCD6] focus:border-[#191918] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#7A7874]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#9A9893]" />
                      <select
                        value={slide.estimatedMinutes}
                        onChange={(e) => handleUpdateSlide(slide.id, { estimatedMinutes: Number(e.target.value) })}
                        className="bg-transparent text-xs tabular-nums text-[#4A4946] focus:outline-none"
                      >
                        <option value={1}>1 menit</option>
                        <option value={2}>2 menit</option>
                        <option value={3}>3 menit</option>
                        <option value={4}>4 menit</option>
                        <option value={5}>5 menit</option>
                      </select>
                    </div>

                    <span className="text-[#C4C2BC]" aria-hidden="true">|</span>

                    {/* Move & Merge Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveSlide(index, 'up')}
                        disabled={index === 0}
                        title="Pindahkan slide ke atas"
                        className="p-1 hover:text-[#191918] hover:bg-[#F2F1ED] rounded disabled:opacity-30"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSlide(index, 'down')}
                        disabled={index === currentOutline.slides.length - 1}
                        title="Pindahkan slide ke bawah"
                        className="p-1 hover:text-[#191918] hover:bg-[#F2F1ED] rounded disabled:opacity-30"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>

                      {index > 0 && (
                        <button
                          onClick={() => handleMergeWithPrevious(index)}
                          title="Gabungkan dengan slide sebelumnya"
                          className="p-1 hover:text-[#191918] hover:bg-[#F2F1ED] rounded text-[#8C8A84]"
                        >
                          <Combine className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {currentOutline.slides.length > 1 && (
                        <button
                          onClick={() => handleDeleteSlide(slide.id)}
                          title="Hapus slide"
                          className="p-1 hover:text-[#B43425] hover:bg-[#FDF0EE] rounded text-[#8C8A84]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Slide Title */}
                <div>
                  <label className="text-[10px] font-medium text-[#8C8A84] uppercase tracking-wider block mb-0.5">
                    Judul Slide
                  </label>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => handleUpdateSlide(slide.id, { title: e.target.value })}
                    className="w-full text-base font-semibold text-[#191918] bg-transparent border-b border-transparent hover:border-[#DDDCD6] focus:border-[#191918] focus:outline-none py-0.5"
                  />
                </div>

                {/* Main Takeaway */}
                <div className="p-2.5 bg-[#FAF9F6] border border-[#EAE8E3] rounded-md">
                  <span className="text-[10px] font-semibold text-[#7A7874] uppercase tracking-wider block mb-1">
                    Pesan Utama (Core Takeaway)
                  </span>
                  <input
                    type="text"
                    value={slide.mainTakeaway}
                    onChange={(e) => handleUpdateSlide(slide.id, { mainTakeaway: e.target.value })}
                    className="w-full text-xs font-medium text-[#191918] bg-transparent border-b border-transparent hover:border-[#DDDCD6] focus:border-[#191918] focus:outline-none"
                    placeholder="1 kalimat inti yang harus dipahami audiens..."
                  />
                </div>

                {/* Bullet Points */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[#8C8A84] uppercase tracking-wider">
                      Poin-Poin Presentasi
                    </span>
                    <button
                      onClick={() => {
                        const updated = [...slide.bulletPoints, 'Poin presentasi tambahan'];
                        handleUpdateSlide(slide.id, { bulletPoints: updated });
                      }}
                      className="text-[11px] font-medium text-[#191918] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Poin</span>
                    </button>
                  </div>
                  <div className="space-y-1">
                    {slide.bulletPoints.map((bp, bpIdx) => (
                      <div key={bpIdx} className="flex items-center gap-2">
                        <span className="text-xs text-[#8C8A84]">·</span>
                        <input
                          type="text"
                          value={bp}
                          onChange={(e) => {
                            const updated = [...slide.bulletPoints];
                            updated[bpIdx] = e.target.value;
                            handleUpdateSlide(slide.id, { bulletPoints: updated });
                          }}
                          className="flex-1 text-xs text-[#2E2E2D] bg-transparent border-b border-transparent hover:border-[#DDDCD6] focus:border-[#191918] focus:outline-none py-0.5"
                        />
                        {slide.bulletPoints.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = slide.bulletPoints.filter((_, i) => i !== bpIdx);
                              handleUpdateSlide(slide.id, { bulletPoints: updated });
                            }}
                            className="text-xs text-[#A4A29C] hover:text-[#B43425] px-1"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Speaker Notes */}
                <div className="pt-2 border-t border-[#F0EFEA]">
                  <label className="text-[10px] font-medium text-[#8C8A84] uppercase tracking-wider block mb-1">
                    Catatan Pembicara (Speaker Notes)
                  </label>
                  <textarea
                    rows={2}
                    value={slide.speakerNotes}
                    onChange={(e) => handleUpdateSlide(slide.id, { speakerNotes: e.target.value })}
                    className="w-full p-2 text-xs text-[#646461] leading-relaxed bg-[#FAF9F6] border border-[#EAE8E3] rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191918]"
                    placeholder="Panduan apa yang harus disampaikan saat slide ini ditampilkan..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-[#EAE8E3] rounded-lg">
          <Presentation className="w-8 h-8 text-[#A4A29C] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#191918]">Belum Ada Outline Presentasi</h3>
          <p className="text-xs text-[#7A7874] mt-1 max-w-sm mx-auto">
            Gunakan form di atas untuk membagi materi pembelajaran dari Notebook Studio menjadi slide siap pakai.
          </p>
        </div>
      )}
    </div>
  );
};
