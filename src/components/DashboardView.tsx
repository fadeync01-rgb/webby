import React from 'react';
import {
  AcademicTask, Notebook, PresentationOutline, DynamicStudySession,
  ActiveView
} from '../types';
import {
  Clock, BookOpen, Presentation, Calendar, ArrowRight, CheckCircle2,
  AlertTriangle, FileText, Sparkles, Plus, BrainCircuit, GraduationCap,
  PanelRightOpen, Image as ImageIcon, Paperclip, CheckSquare, Edit3
} from 'lucide-react';

interface DashboardViewProps {
  tasks: AcademicTask[];
  notebooks: Notebook[];
  outlines: PresentationOutline[];
  todaySessions: DynamicStudySession[];
  onNavigate: (view: ActiveView) => void;
  onOpenNotebook: (notebookId: string) => void;
  onOpenSidepod: () => void;
  onNewNotebook: () => void;
  onToggleTaskComplete: (taskId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  notebooks,
  outlines,
  todaySessions,
  onNavigate,
  onOpenNotebook,
  onOpenSidepod,
  onNewNotebook,
  onToggleTaskComplete,
}) => {
  const activeTasks = tasks.filter((t) => t.status !== 'selesai');
  const completedTasks = tasks.filter((t) => t.status === 'selesai');
  const highPriorityTasks = activeTasks.filter((t) => t.priority === 'tinggi');

  // Sorted upcoming tasks
  const upcomingTasks = [...activeTasks].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  ).slice(0, 4);

  // Today's total scheduled study minutes
  const todayTotalMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  // Recent notebooks (sorted by updatedAt)
  const recentNotebooks = [...notebooks].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 3);

  // Today formatted in Indonesian
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Editorial Header & Greeting for SMP Students */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#EAE8E3]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#7A7874] mb-1">
            Personal Academic Workspace SMP · {todayFormatted}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191918] tracking-tight">
            Dashboard Belajar Siswa SMP
          </h1>
          <p className="text-xs sm:text-sm text-[#646461] mt-1 max-w-xl">
            Pusat manajemen tugas sekolah, ekstraksi lembar PR, jadwal belajar terpadu, dan rangkuman materi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenSidepod}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors shadow-2xs"
          >
            <PanelRightOpen className="w-3.5 h-3.5" />
            <span>Buka Sidepod Tugas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Featured Banner: Upgraded Sidepod Workspace */}
      <div className="p-5 bg-gradient-to-r from-[#FAF9F6] via-[#F4F3EE] to-[#EAE8E3] border border-[#DDDCD6] rounded-xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2E0D8]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <h2 className="text-xs sm:text-sm font-bold text-[#191918] uppercase tracking-wider">
              Sidepod Workspace: Tambah File, Foto & Ekstrak Soal Editable
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSidepod}
              className="text-xs font-semibold text-[#191918] hover:underline flex items-center gap-1"
            >
              <span>Buka Sidepod</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1 text-xs text-[#646461]">
          <div className="p-3 bg-white rounded-lg border border-[#DDDCD6] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#191918]">
              <ImageIcon className="w-4 h-4 text-[#191918]" />
              <span>Foto Lembar Soal / PR</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Ambil foto kertas tugas atau buku paket dan lampirkan langsung ke tugasmu.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-[#DDDCD6] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#191918]">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Ekstraksi Teks AI</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              AI mengubah foto/file soal menjadi teks rapi yang bisa diedit langsung di web.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-[#DDDCD6] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#191918]">
              <Edit3 className="w-4 h-4 text-[#191918]" />
              <span>Editor & Checklist Web</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Tulis draf jawaban, checklist langkah pengerjaan, dan atur waktu belajar otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#EAE8E3] rounded-lg shadow-2xs space-y-1">
          <div className="text-[11px] font-medium text-[#7A7874] uppercase tracking-wider">
            Tugas Aktif (Sidepod)
          </div>
          <div className="text-2xl font-bold tabular-nums text-[#191918]">
            {activeTasks.length}
          </div>
          <div className="text-[11px] text-[#7A7874]">
            {highPriorityTasks.length > 0 ? (
              <span className="text-[#B43425] font-semibold">{highPriorityTasks.length} Prioritas Tinggi</span>
            ) : (
              <span>Semua terkontrol rapi</span>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border border-[#EAE8E3] rounded-lg shadow-2xs space-y-1">
          <div className="text-[11px] font-medium text-[#7A7874] uppercase tracking-wider">
            Selesai Dikerjakan
          </div>
          <div className="text-2xl font-bold tabular-nums text-emerald-700">
            {completedTasks.length}
          </div>
          <div className="text-[11px] text-[#7A7874]">
            Tugas sekolah tuntas
          </div>
        </div>

        <div className="p-4 bg-white border border-[#EAE8E3] rounded-lg shadow-2xs space-y-1">
          <div className="text-[11px] font-medium text-[#7A7874] uppercase tracking-wider">
            Rangkuman Pelajaran
          </div>
          <div className="text-2xl font-bold tabular-nums text-[#191918]">
            {notebooks.length}
          </div>
          <div className="text-[11px] text-[#7A7874]">
            Modul materi di Notebook
          </div>
        </div>

        <div className="p-4 bg-white border border-[#EAE8E3] rounded-lg shadow-2xs space-y-1">
          <div className="text-[11px] font-medium text-[#7A7874] uppercase tracking-wider">
            Jadwal Belajar Hari Ini
          </div>
          <div className="text-2xl font-bold tabular-nums text-[#191918]">
            {todayTotalMinutes} <span className="text-sm font-normal text-[#7A7874]">menit</span>
          </div>
          <div className="text-[11px] text-[#7A7874]">
            {todaySessions.length} sesi belajar terencana
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Dynamic Study Sessions & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dynamic Study Schedule for Today */}
        <div className="lg:col-span-7 bg-white border border-[#EAE8E3] rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8C8A84]" />
              <h2 className="text-sm font-bold text-[#191918]">Sesi Belajar Hari Ini</h2>
              <span className="text-xs text-[#7A7874]">({todaySessions.length} sesi)</span>
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs text-[#646461] hover:text-[#191918] flex items-center gap-1 transition-colors"
            >
              <span>Buka Kalender</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <p className="text-xs text-[#7A7874]">
            Dihitung otomatis oleh <strong>Dynamic Study Scheduler</strong> berdasarkan deadline tugas sekolah dan PR Sidepod Anda.
          </p>

          {todaySessions.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#DDDCD6] rounded-md bg-[#FAF9F6] space-y-2">
              <p className="text-xs text-[#7A7874]">
                Belum ada jadwal belajar yang terdaftar. Tambahkan tugas di Sidepod untuk mengaktifkan jadwal belajar harianmu.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={onOpenSidepod}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors"
                >
                  + Tambah Tugas di Sidepod
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todaySessions.map((session, idx) => (
                <div
                  key={session.id || idx}
                  className="flex items-center justify-between p-3 rounded-md border border-[#EAE8E3] bg-[#FAF9F6] hover:bg-[#F4F3EE] transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="text-xs font-mono tabular-nums text-[#4A4946] font-medium pt-0.5 w-24 shrink-0">
                      {session.startTime} - {session.endTime}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-medium text-[#191918] truncate">
                        {session.taskTitle}
                      </h4>
                      <div className="text-[11px] text-[#7A7874] mt-0.5">
                        <span>{session.subject}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="tabular-nums">{session.durationMinutes} menit fokus</span>
                        {session.isDeadlineDay && (
                          <>
                            <span className="mx-1.5" aria-hidden="true">·</span>
                            <span className="text-[#B43425] font-semibold">Tenggat Hari Ini</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-medium tabular-nums shrink-0 ml-2 ${
                      session.priority === 'tinggi'
                        ? 'text-[#B43425]'
                        : session.priority === 'sedang'
                        ? 'text-[#7D5A18]'
                        : 'text-[#6A6965]'
                    }`}
                  >
                    {session.priority === 'tinggi' ? 'Fokus Penuh' : session.priority === 'sedang' ? 'Fokus Standar' : 'Santai'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Deadlines from Sidepod */}
        <div className="lg:col-span-5 bg-white border border-[#EAE8E3] rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#8C8A84]" />
              <h2 className="text-sm font-bold text-[#191918]">Tenggat Terdekat (Sidepod)</h2>
            </div>
            <button
              onClick={onOpenSidepod}
              className="text-xs text-[#646461] hover:text-[#191918] flex items-center gap-1 transition-colors"
            >
              <span>Kelola di Sidepod</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#DDDCD6] rounded-md bg-[#FAF9F6] space-y-2">
              <p className="text-xs text-[#7A7874]">
                Daftar tugas masih kosong. Masukkan tugas dan deadline asli Anda di Sidepod.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={onOpenSidepod}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors"
                >
                  + Input Tugas Baru
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingTasks.map((task) => {
                const deadlineDate = new Date(task.deadline);
                const isUrgent = (deadlineDate.getTime() - Date.now()) < 86400000 * 2;
                const attachmentCount = task.attachments?.length || 0;
                const subtaskCount = task.subtasks?.length || 0;
                const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;

                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-md border border-[#EAE8E3] bg-[#FAF9F6] flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() => onToggleTaskComplete(task.id)}
                        title="Tandai selesai"
                        className="mt-0.5 w-4 h-4 rounded border border-[#B4B2AB] hover:border-[#191918] bg-white flex items-center justify-center shrink-0"
                      >
                        <CheckCircle2 className="w-3 h-3 text-transparent hover:text-[#191918]" />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-medium text-[#191918] truncate">
                            {task.title}
                          </h4>
                          {attachmentCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#EAE8E3] text-[#4A4946]">
                              <Paperclip className="w-3 h-3" />
                              <span>{attachmentCount} file</span>
                            </span>
                          )}
                          {subtaskCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckSquare className="w-3 h-3" />
                              <span>{completedSubtasks}/{subtaskCount}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#7A7874] mt-0.5">
                          <span>{task.subject}</span>
                          <span aria-hidden="true">·</span>
                          <span className={isUrgent ? 'text-[#B43425] font-semibold' : ''}>
                            {deadlineDate.toLocaleDateString('id-ID', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onOpenSidepod}
                      className="text-[11px] text-[#7A7874] hover:text-[#191918] underline shrink-0"
                    >
                      Buka di Web
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Notebooks Row */}
      <div className="bg-white border border-[#EAE8E3] rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#8C8A84]" />
            <h2 className="text-sm font-bold text-[#191918]">Rangkuman Materi Pelajaran Terbaru</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNewNotebook}
              className="text-xs text-[#191918] hover:underline flex items-center gap-1 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Catatan Baru</span>
            </button>
            <span aria-hidden="true" className="text-[#DDDCD6]">·</span>
            <button
              onClick={() => onNavigate('notebooks')}
              className="text-xs text-[#646461] hover:text-[#191918] flex items-center gap-1 transition-colors"
            >
              <span>Lihat Semua Notebook</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentNotebooks.map((nb) => (
            <div
              key={nb.id}
              onClick={() => onOpenNotebook(nb.id)}
              className="p-4 rounded-md border border-[#EAE8E3] bg-[#FAF9F6] hover:bg-[#F4F3EE] hover:border-[#C4BFB5] cursor-pointer transition-all space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#7A7874] mb-1">
                  <span className="font-semibold text-[#191918]">{nb.subject}</span>
                  <span>{nb.sections.length} bagian</span>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-[#191918] line-clamp-1">
                  {nb.title}
                </h3>
                <p className="text-xs text-[#646461] line-clamp-2 mt-1 leading-relaxed">
                  {nb.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-[#EAE8E3] flex items-center justify-between text-[11px] text-[#7A7874]">
                <span>Diperbarui {new Date(nb.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                <span className="font-semibold text-[#191918] flex items-center gap-1">
                  Buka Modul <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
