import React, { useState } from 'react';
import { AcademicTask, DynamicStudySession } from '../types';
import { formatISODateOnly } from '../utils/scheduler';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock,
  AlertTriangle, CheckCircle2, Filter, Info, PanelRightOpen
} from 'lucide-react';

interface AcademicCalendarViewProps {
  tasks: AcademicTask[];
  sessions: DynamicStudySession[];
  onOpenSidepod: () => void;
  onToggleTaskComplete: (taskId: string) => void;
  subjectOptions: string[];
}

export const AcademicCalendarView: React.FC<AcademicCalendarViewProps> = ({
  tasks,
  sessions,
  onOpenSidepod,
  onToggleTaskComplete,
  subjectOptions,
}) => {
  const [viewMode, setViewMode] = useState<'bulan' | 'minggu' | 'agenda'>('minggu');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filter tasks & sessions by subject
  const filteredTasks = tasks.filter(
    (t) => selectedSubject === 'all' || t.subject === selectedSubject
  );
  const filteredSessions = sessions.filter(
    (s) => selectedSubject === 'all' || s.subject === selectedSubject
  );

  // Month navigation
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'bulan') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'minggu') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'bulan') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'minggu') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper: Get start of week (Monday)
  const getWeekDays = (baseDate: Date) => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      weekDays.push(nextDay);
    }
    return weekDays;
  };

  // Helper: Get month matrix
  const getMonthMatrix = (baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const matrix: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    // Monday-based indexing: Sunday=6, Monday=0 ...
    const startDayIndex = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startDayIndex; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentWeek.push(new Date(year, month, day));
      if (currentWeek.length === 7) {
        matrix.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      matrix.push(currentWeek);
    }

    return matrix;
  };

  const weekDays = getWeekDays(currentDate);
  const monthMatrix = getMonthMatrix(currentDate);
  const todayKey = formatISODateOnly(new Date());

  // Formatted title
  const currentMonthYear = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#EAE8E3]">
        <div>
          <h1 className="text-2xl font-semibold text-[#191918]">Academic Calendar</h1>
          <p className="text-xs text-[#7A7874] mt-1 max-w-xl">
            Sistem pengorganisasian otomatis waktu belajar yang terintegrasi penuh dengan <strong>Sidepod</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenSidepod}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors shadow-2xs"
          >
            <PanelRightOpen className="w-3.5 h-3.5" />
            <span>Kelola Tugas di Sidepod</span>
          </button>
        </div>
      </div>

      {/* Critical Architecture Notice: Hard Deadlines vs Dynamic Sessions */}
      <div className="p-3.5 bg-white border border-[#EAE8E3] rounded-lg shadow-2xs flex items-start gap-3 text-xs text-[#4A4946]">
        <Info className="w-4 h-4 text-[#191918] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-[#191918]">
            Prinsip Integrasi Data Sidepod & Kalender:
          </span>
          <p className="text-[#646461] leading-relaxed">
            Kalender membedakan antara <strong>Tenggat Tetap (Hard Deadline)</strong> berwarna merah/kuning pekat dari Sidepod dan <strong>Sesi Belajar Dinamis</strong> yang dialokasikan sistem. Mengubah atau menghapus tugas di Sidepod akan otomatis menghitung ulang pembagian sesi tanpa mengubah deadline asli tugas Anda.
          </p>
        </div>
      </div>

      {/* Control Bar: View Switcher, Month Navigation & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation & Month Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#DDDCD6] rounded-md bg-white shadow-2xs">
            <button
              onClick={handlePrev}
              aria-label="Periode sebelumnya"
              className="p-1.5 text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-medium text-[#4A4946] hover:text-[#191918] border-x border-[#DDDCD6] transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={handleNext}
              aria-label="Periode berikutnya"
              className="p-1.5 text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-semibold text-[#191918] ml-2 capitalize">
            {currentMonthYear}
          </h2>
        </div>

        {/* View Mode & Subject Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#8C8A84]" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-[#DDDCD6] rounded-md text-[#4A4946] focus:outline-none focus:ring-1 focus:ring-[#191918]"
            >
              <option value="all">Semua Subjek</option>
              {subjectOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* View Mode Segmented Control */}
          <div className="flex items-center gap-1 p-0.5 bg-[#EAE8E3] rounded-md text-xs font-medium">
            <button
              onClick={() => setViewMode('minggu')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'minggu'
                  ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                  : 'text-[#646461] hover:text-[#191918]'
              }`}
            >
              Minggu
            </button>
            <button
              onClick={() => setViewMode('bulan')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'bulan'
                  ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                  : 'text-[#646461] hover:text-[#191918]'
              }`}
            >
              Bulan
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                  : 'text-[#646461] hover:text-[#191918]'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: MINGGU (Week View) */}
      {viewMode === 'minggu' && (
        <div className="bg-white border border-[#EAE8E3] rounded-lg shadow-2xs overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-[#EAE8E3] bg-[#FAF9F6] text-xs font-medium text-[#7A7874]">
            {weekDays.map((d, idx) => {
              const dateKey = formatISODateOnly(d);
              const isToday = dateKey === todayKey;
              return (
                <div
                  key={idx}
                  className={`p-3 text-center border-r border-[#EAE8E3] last:border-r-0 ${
                    isToday ? 'bg-[#F2F0EA] font-semibold text-[#191918]' : ''
                  }`}
                >
                  <div className="text-[11px] uppercase tracking-wider">
                    {d.toLocaleDateString('id-ID', { weekday: 'short' })}
                  </div>
                  <div className="text-sm font-semibold tabular-nums mt-0.5">
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Days Content Grid */}
          <div className="grid grid-cols-7 min-h-[460px] divide-x divide-[#EAE8E3]">
            {weekDays.map((dayDate, dayIdx) => {
              const dateKey = formatISODateOnly(dayDate);
              const isToday = dateKey === todayKey;

              // Deadlines on this day
              const dayDeadlines = filteredTasks.filter((t) => {
                const tDateKey = formatISODateOnly(new Date(t.deadline));
                return tDateKey === dateKey;
              });

              // Dynamic study sessions on this day
              const daySessions = filteredSessions.filter((s) => s.date === dateKey);

              return (
                <div
                  key={dayIdx}
                  className={`p-2 space-y-2 ${
                    isToday ? 'bg-[#FCFBF8]' : 'bg-white'
                  }`}
                >
                  {/* Hard Deadlines Box (Top of Day) */}
                  {dayDeadlines.map((task) => (
                    <div
                      key={task.id}
                      className={`p-2 rounded text-xs border ${
                        task.status === 'selesai'
                          ? 'bg-[#F7F6F2] border-[#E5E3DD] text-[#8C8A84] line-through'
                          : task.priority === 'tinggi'
                          ? 'bg-[#FDF0EE] border-[#F5C2BC] text-[#8A2518]'
                          : 'bg-[#FFF9EE] border-[#EEDFBF] text-[#7D5A18]'
                      } shadow-3xs`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold">
                        <span>TENGGAT TETAP</span>
                        <span className="tabular-nums">
                          {new Date(task.deadline).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="font-semibold truncate mt-0.5">{task.title}</div>
                      <div className="text-[10px] text-[#7A7874] mt-0.5 truncate">{task.subject}</div>
                    </div>
                  ))}

                  {/* Scheduled Study Blocks */}
                  {daySessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-2 rounded text-xs border border-[#EAE8E3] bg-[#FAF9F6] hover:bg-[#F2F1EC] transition-colors space-y-1 shadow-3xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#7A7874] tabular-nums font-mono">
                        <span>{session.startTime} - {session.endTime}</span>
                        <span className="font-sans font-medium text-[#4A4946]">{session.durationMinutes}m</span>
                      </div>
                      <div className="font-medium text-[#191918] leading-tight line-clamp-2">
                        {session.taskTitle}
                      </div>
                      <div className="text-[10px] text-[#8C8A84] truncate">
                        {session.subject}
                      </div>
                    </div>
                  ))}

                  {dayDeadlines.length === 0 && daySessions.length === 0 && (
                    <div className="h-full flex items-center justify-center text-[10px] text-[#C4C2BC] select-none py-8">
                      Kosong
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: BULAN (Month View) */}
      {viewMode === 'bulan' && (
        <div className="bg-white border border-[#EAE8E3] rounded-lg shadow-2xs overflow-hidden">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 border-b border-[#EAE8E3] bg-[#FAF9F6] text-xs font-medium text-[#7A7874] text-center py-2.5">
            <div>Sen</div>
            <div>Sel</div>
            <div>Rab</div>
            <div>Kam</div>
            <div>Jum</div>
            <div>Sab</div>
            <div>Min</div>
          </div>

          {/* Month Matrix */}
          <div className="divide-y divide-[#EAE8E3]">
            {monthMatrix.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-7 divide-x divide-[#EAE8E3] min-h-[95px]">
                {week.map((cellDate, cIdx) => {
                  if (!cellDate) {
                    return <div key={cIdx} className="bg-[#FAF9F6]/40" />;
                  }

                  const dateKey = formatISODateOnly(cellDate);
                  const isToday = dateKey === todayKey;
                  const dayDeadlines = filteredTasks.filter(
                    (t) => formatISODateOnly(new Date(t.deadline)) === dateKey
                  );
                  const daySessions = filteredSessions.filter((s) => s.date === dateKey);

                  return (
                    <div
                      key={cIdx}
                      className={`p-1.5 flex flex-col justify-between ${
                        isToday ? 'bg-[#FCFBF8]' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs tabular-nums font-medium ${
                            isToday
                              ? 'w-5 h-5 rounded-full bg-[#191918] text-white flex items-center justify-center font-bold text-[10px]'
                              : 'text-[#4A4946]'
                          }`}
                        >
                          {cellDate.getDate()}
                        </span>

                        {dayDeadlines.length > 0 && (
                          <span className="text-[10px] font-semibold text-[#B43425] tabular-nums">
                            {dayDeadlines.length} deadline
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1">
                        {dayDeadlines.slice(0, 1).map((d) => (
                          <div
                            key={d.id}
                            className="text-[10px] px-1 py-0.5 rounded bg-[#FDF0EE] text-[#8A2518] truncate font-medium"
                          >
                            ! {d.title}
                          </div>
                        ))}

                        {daySessions.slice(0, 2).map((s) => (
                          <div
                            key={s.id}
                            className="text-[10px] px-1 py-0.5 rounded bg-[#FAF9F6] border border-[#EAE8E3] text-[#4A4946] truncate"
                          >
                            {s.startTime} {s.taskTitle}
                          </div>
                        ))}

                        {daySessions.length > 2 && (
                          <div className="text-[9px] text-[#8C8A84] px-1">
                            +{daySessions.length - 2} sesi lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: AGENDA (Chronological List) */}
      {viewMode === 'agenda' && (
        <div className="bg-white border border-[#EAE8E3] rounded-lg shadow-2xs divide-y divide-[#EAE8E3]">
          <div className="p-4 bg-[#FAF9F6] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#191918] uppercase tracking-wider">
              Agenda Aktivitas & Sesi Belajar Mendatang
            </span>
            <span className="text-xs text-[#7A7874] tabular-nums">
              {filteredSessions.length} Sesi Terjadwal
            </span>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#7A7874]">
              Tidak ada agenda belajar aktif.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isToday = session.date === todayKey;

              return (
                <div
                  key={session.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F6] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-24 shrink-0">
                      <div className={`text-xs font-semibold ${isToday ? 'text-[#B43425]' : 'text-[#191918]'}`}>
                        {isToday ? 'Hari Ini' : session.date}
                      </div>
                      <div className="text-[11px] font-mono text-[#7A7874] tabular-nums mt-0.5">
                        {session.startTime} - {session.endTime}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium text-[#191918]">
                        {session.taskTitle}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-[#7A7874] mt-0.5">
                        <span className="font-medium text-[#4A4946]">{session.subject}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{session.durationMinutes} menit alokasi belajar</span>
                        {session.isDeadlineDay && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#B43425] font-semibold">Tenggat Waktu Akhir</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span
                      className={`text-[11px] font-medium tabular-nums ${
                        session.priority === 'tinggi'
                          ? 'text-[#B43425]'
                          : session.priority === 'sedang'
                          ? 'text-[#7D5A18]'
                          : 'text-[#6A6965]'
                      }`}
                    >
                      {session.priority === 'tinggi' ? 'Prioritas Tinggi' : session.priority === 'sedang' ? 'Prioritas Sedang' : 'Prioritas Rendah'}
                    </span>
                    <button
                      onClick={() => onToggleTaskComplete(session.taskId)}
                      className="px-2.5 py-1 text-xs font-medium text-[#191918] bg-white border border-[#DDDCD6] hover:bg-[#F2F1ED] rounded transition-colors shadow-3xs"
                    >
                      Selesaikan
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
