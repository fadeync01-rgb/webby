import React from 'react';
import {
  BookOpen, BrainCircuit, GraduationCap, Presentation,
  Calendar, PanelRightOpen, ArrowRight, Sparkles,
  FileText, Image as ImageIcon, CheckCircle2, Edit3
} from 'lucide-react';

interface HomePageViewProps {
  onEnterWorkspace: () => void;
  onNavigateToFeature: (feature: 'notebooks' | 'canvas' | 'learning' | 'presentation' | 'calendar') => void;
  onOpenSidepod: () => void;
}

export const HomePageView: React.FC<HomePageViewProps> = ({
  onEnterWorkspace,
  onNavigateToFeature,
  onOpenSidepod,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-4 pb-2 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAE8E3] text-[#4A4946] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#191918]" />
          <span>Personal Academic Workspace Siswa SMP (Kelas 7, 8, 9)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-[#191918] tracking-tight leading-tight">
          Teman belajar mandiri: kelola materi, bagi presentasi, dan selesaikan tugas dengan tenang.
        </h1>

        <p className="text-sm sm:text-base text-[#646461] leading-relaxed max-w-2xl mx-auto">
          Unggah foto lembar soal, PDF, atau catatan tugas sekolahmu ke <strong>Sidepod</strong>. Ekstrak otomatis menjadi teks yang dapat diedit langsung di web, buat checklist pengerjaan, dan atur jadwal belajarmu secara cerdas.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenSidepod}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-lg transition-colors shadow-xs"
          >
            <PanelRightOpen className="w-4 h-4" />
            <span>Buka Sidepod & Tambah Tugas</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onEnterWorkspace}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#191918] bg-white border border-[#DDDCD6] hover:bg-[#F4F3EF] rounded-lg transition-colors shadow-3xs"
          >
            <span>Buka Dashboard</span>
          </button>
        </div>
      </section>

      {/* Featured Banner: Upgraded Sidepod with File/Photo Extraction */}
      <section className="p-6 sm:p-8 bg-gradient-to-r from-[#FBFBF9] via-[#F4F3EE] to-[#EAE8E3] border border-[#DDDCD6] rounded-2xl shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-[#4A4946] font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Fitur Baru Sidepod Workspace</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#191918]">
            Unggah File, Foto Soal & Ekstrak Jadi Teks yang Bisa Diedit di Web
          </h3>
          <p className="text-xs sm:text-sm text-[#646461] leading-relaxed">
            Punya lembar tugas berupa foto kertas, cetakan buku, atau dokumen PDF? Cukup lampirkan di Sidepod! Fitur <strong>Ekstraksi AI</strong> akan menyalin seluruh soal dan instruksi ke dalam editor teks interaktif. Kamu bisa langsung mengedit, mengetik draf jawaban, dan membagi jadwal belajarnya di kalender.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={onOpenSidepod}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Coba Ekstraksi Tugas di Sidepod</span>
          </button>
        </div>
      </section>

      {/* Workspace Pillars Grid for SMP Students */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-semibold text-[#7A7874] uppercase tracking-wider">
            Ruang Belajar Lengkap Siswa SMP
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#191918]">
            Semua yang Kamu Butuhkan untuk Meraih Nilai Terbaik
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Sidepod Workspace */}
          <div
            onClick={onOpenSidepod}
            className="p-6 bg-white border border-[#DDDCD6] hover:border-[#191918] rounded-xl shadow-2xs space-y-3 cursor-pointer group transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#EAE8E3] flex items-center justify-center text-[#191918]">
              <PanelRightOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#191918] group-hover:text-black">
              Sidepod & Ekstraksi File Soal
            </h3>
            <p className="text-xs text-[#646461] leading-relaxed">
              Catat tugas mandiri, upload foto PR atau file lembar kerja, ekstrak soal menjadi teks yang bisa diedit langsung di web, dan buat checklist pengerjaan.
            </p>
            <div className="text-xs font-medium text-[#191918] flex items-center gap-1 pt-2">
              <span>Buka Sidepod Drawer</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Notebook Studio SMP */}
          <div
            onClick={() => onNavigateToFeature('notebooks')}
            className="p-6 bg-white border border-[#EAE8E3] hover:border-[#C4BFB5] rounded-xl shadow-2xs space-y-3 cursor-pointer group transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#EAE8E3] flex items-center justify-center text-[#191918]">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#191918] group-hover:text-black">
              Catatan & Ringkasan Pelajaran
            </h3>
            <p className="text-xs text-[#646461] leading-relaxed">
              Buat materi rangkuman IPA, Matematika, Bahasa Indonesia, dan IPS SMP yang rapi dengan glosarium istilah dan poin penting siap ulas sebelum ulangan harian.
            </p>
            <div className="text-xs font-medium text-[#191918] flex items-center gap-1 pt-2">
              <span>Buka Notebook Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Creative Canvas & Mind Map */}
          <div
            onClick={() => onNavigateToFeature('canvas')}
            className="p-6 bg-white border border-[#EAE8E3] hover:border-[#C4BFB5] rounded-xl shadow-2xs space-y-3 cursor-pointer group transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#EAE8E3] flex items-center justify-center text-[#191918]">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#191918] group-hover:text-black">
              Peta Konsep (Mind Map) & Papan Coretan
            </h3>
            <p className="text-xs text-[#646461] leading-relaxed">
              Visualisasikan bab materi pelajaran menjadi peta konsep warna-warni yang mudah dihafal, serta lembar whiteboard freeform untuk mencoret rumus hitungan.
            </p>
            <div className="text-xs font-medium text-[#191918] flex items-center gap-1 pt-2">
              <span>Buka Creative Canvas</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. Learning Arena */}
          <div
            onClick={() => onNavigateToFeature('learning')}
            className="p-6 bg-white border border-[#EAE8E3] hover:border-[#C4BFB5] rounded-xl shadow-2xs space-y-3 cursor-pointer group transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#EAE8E3] flex items-center justify-center text-[#191918]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#191918] group-hover:text-black">
              Latihan Soal & Flashcard Aktif
            </h3>
            <p className="text-xs text-[#646461] leading-relaxed">
              Uji pemahamanmu sebelum Penilaian Harian (PH) dan PTS/PAS dengan Flashcard Active Recall, kuis cepat bertimer, serta soal bertingkat HOTS SMP.
            </p>
            <div className="text-xs font-medium text-[#191918] flex items-center gap-1 pt-2">
              <span>Buka Learning Arena</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 5. Presentation Divider */}
          <div
            onClick={() => onNavigateToFeature('presentation')}
            className="p-6 bg-white border border-[#EAE8E3] hover:border-[#C4BFB5] rounded-xl shadow-2xs space-y-3 cursor-pointer group transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#EAE8E3] flex items-center justify-center text-[#191918]">
              <Presentation className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#191918] group-hover:text-black">
              Alur Slide Presentasi Kelompok
            </h3>
            <p className="text-xs text-[#646461] leading-relaxed">
              Bagi materi tugas kelompok menjadi slide presentasi yang terstruktur rapi, lengkap dengan poin utama dan catatan pembicara siap dibaca di depan kelas.
            </p>
            <div className="text-xs font-medium text-[#191918] flex items-center gap-1 pt-2">
              <span>Buka Presentation Divider</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 6. Kalender & Jadwal Belajar Harian */}
          <div
            onClick={() => onNavigateToFeature('calendar')}
            className="p-6 bg-white border border-[#EAE8E3] hover:border-[#C4BFB5] rounded-xl shadow-2xs space-y-3 cursor-pointer group transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border border-[#EAE8E3] flex items-center justify-center text-[#191918]">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#191918] group-hover:text-black">
              Kalender Belajar & Jadwal Sidepod
            </h3>
            <p className="text-xs text-[#646461] leading-relaxed">
              Jadwal belajar otomatis yang membagi waktu PR sebelum tanggal tenggat, sehingga kamu tidak perlu begadang dan tugas selalu terkumpul tepat waktu.
            </p>
            <div className="text-xs font-medium text-[#191918] flex items-center gap-1 pt-2">
              <span>Buka Kalender</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Encouragement Banner */}
      <section className="p-8 bg-white border border-[#EAE8E3] rounded-2xl shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-base sm:text-lg font-bold text-[#191918]">
            Mulai Belajar dengan Teratur Hari Ini
          </h3>
          <p className="text-xs text-[#646461] leading-relaxed">
            Tambahkan tugas sekolahmu ke Sidepod atau unggah foto PR untuk diekstrak menjadi teks yang siap dikerjakan.
          </p>
        </div>

        <button
          onClick={onEnterWorkspace}
          className="px-6 py-2.5 text-xs font-bold text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-lg transition-colors whitespace-nowrap shadow-2xs"
        >
          Masuk ke Dashboard
        </button>
      </section>
    </div>
  );
};
