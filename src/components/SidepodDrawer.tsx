import React, { useState, useRef } from 'react';
import { AcademicTask, PriorityLevel, TaskAttachment, TaskSubtask } from '../types';
import {
  X, Check, Clock, Trash2, Edit3, Plus, AlertCircle, Calendar,
  Paperclip, Image as ImageIcon, Sparkles, FileText, CheckSquare,
  Square, Eye, ChevronRight, Save, ArrowLeft, RefreshCw, Copy, ExternalLink,
  UploadCloud
} from 'lucide-react';

interface SidepodDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: AcademicTask[];
  onAddTask: (task: Omit<AcademicTask, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: AcademicTask) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
  subjectOptions: string[];
}

export const SidepodDrawer: React.FC<SidepodDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskComplete,
  subjectOptions,
}) => {
  const [filter, setFilter] = useState<'semua' | 'aktif' | 'selesai'>('aktif');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Active task workspace view (in-web editor modal/sheet)
  const [activeWorkspaceTaskId, setActiveWorkspaceTaskId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'content' | 'solution' | 'subtasks' | 'attachments'>('content');

  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('sedang');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [notes, setNotes] = useState('');
  const [content, setContent] = useState('');
  const [studentSolution, setStudentSolution] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // AI Extraction states
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionToast, setExtractionToast] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const activeWorkspaceTask = tasks.find((t) => t.id === activeWorkspaceTaskId);

  const resetForm = () => {
    setTitle('');
    setSubject(subjectOptions[0] || 'Matematika SMP');
    setCustomSubject('');
    const defaultD = new Date();
    defaultD.setDate(defaultD.getDate() + 2);
    defaultD.setHours(17, 0, 0, 0);
    setDeadline(defaultD.toISOString().slice(0, 16));
    setPriority('sedang');
    setEstimatedMinutes(45);
    setNotes('');
    setContent('');
    setStudentSolution('');
    setAttachments([]);
    setSubtasks([]);
    setEditingTaskId(null);
    setIsFormOpen(false);
  };

  const handleStartEdit = (task: AcademicTask) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    if (subjectOptions.includes(task.subject)) {
      setSubject(task.subject);
      setCustomSubject('');
    } else {
      setSubject('__custom__');
      setCustomSubject(task.subject);
    }
    setDeadline(task.deadline.slice(0, 16));
    setPriority(task.priority);
    setEstimatedMinutes(task.estimatedMinutes);
    setNotes(task.notes || '');
    setContent(task.content || '');
    setStudentSolution(task.studentSolution || '');
    setAttachments(task.attachments || []);
    setSubtasks(task.subtasks || []);
    setIsFormOpen(true);
  };

  // Open in-web task workspace editor
  const handleOpenWorkspace = (task: AcademicTask) => {
    setActiveWorkspaceTaskId(task.id);
    setWorkspaceTab('content');
  };

  // Handle file uploads (Images, PDF, text)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        const newAttachment: TaskAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type: isImg ? 'image' : isPdf ? 'pdf' : 'document',
          sizeBytes: file.size,
          dataUrl: result,
          uploadedAt: new Date().toISOString(),
        };

        if (activeWorkspaceTask) {
          // Direct update to active workspace task
          const updated: AcademicTask = {
            ...activeWorkspaceTask,
            attachments: [...(activeWorkspaceTask.attachments || []), newAttachment],
          };
          onUpdateTask(updated);
        } else {
          // Add to form state
          setAttachments((prev) => [...prev, newAttachment]);
        }
      };

      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Trigger AI Extraction on an attachment or text
  const handleExtractAssignmentAI = async (attachment?: TaskAttachment) => {
    setIsExtracting(true);
    setExtractionToast(null);

    try {
      const targetAttachment = attachment || (attachments.length > 0 ? attachments[attachments.length - 1] : undefined);
      
      const payload: any = {
        existingTitle: title || activeWorkspaceTask?.title,
      };

      if (targetAttachment && targetAttachment.dataUrl) {
        payload.imageBase64 = targetAttachment.dataUrl;
        payload.fileName = targetAttachment.name;
        payload.mimeType = targetAttachment.type === 'image' ? 'image/jpeg' : 'application/pdf';
      } else if (notes || content) {
        payload.fileText = notes || content;
      } else {
        setExtractionToast('Unggah foto/file tugas terlebih dahulu untuk diekstrak.');
        setIsExtracting(false);
        return;
      }

      const res = await fetch('/api/sidepod/extract-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.extracted) {
        const { title: extTitle, subject: extSubject, instructions, extractedText, subtasks: extSubtasks } = data.extracted;

        const newSubtasks: TaskSubtask[] = (extSubtasks || []).map((text: string, i: number) => ({
          id: `st-${Date.now()}-${i}`,
          text,
          completed: false,
        }));

        if (activeWorkspaceTask) {
          const updated: AcademicTask = {
            ...activeWorkspaceTask,
            content: extractedText || activeWorkspaceTask.content,
            notes: instructions || activeWorkspaceTask.notes,
            subtasks: newSubtasks.length > 0 ? newSubtasks : activeWorkspaceTask.subtasks,
            extractedText: extractedText,
          };
          onUpdateTask(updated);
          setExtractionToast('Soal dan instruksi tugas berhasil diekstrak ke dalam editor!');
        } else {
          if (extTitle && !title) setTitle(extTitle);
          if (extSubject && !subject) setSubject(extSubject);
          if (instructions && !notes) setNotes(instructions);
          setContent(extractedText || '');
          setSubtasks(newSubtasks);
          setExtractionToast('Teks lembar tugas berhasil diekstrak! Silakan periksa dan edit.');
        }
      } else {
        throw new Error(data.error || 'Ekstraksi gagal');
      }
    } catch (err: unknown) {
      console.warn('Extraction error:', err);
      setExtractionToast('Gagal mengekstrak teks. Periksa format file Anda.');
    } finally {
      setIsExtracting(false);
      setTimeout(() => setExtractionToast(null), 4000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalSubject = subject === '__custom__' ? customSubject.trim() || 'Umum' : subject || 'Umum';

    if (editingTaskId) {
      const existing = tasks.find((t) => t.id === editingTaskId);
      if (existing) {
        onUpdateTask({
          ...existing,
          title: title.trim(),
          subject: finalSubject,
          deadline: new Date(deadline).toISOString(),
          priority,
          estimatedMinutes: Number(estimatedMinutes) || 60,
          notes: notes.trim(),
          content: content.trim(),
          studentSolution: studentSolution.trim(),
          attachments,
          subtasks,
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      onAddTask({
        title: title.trim(),
        subject: finalSubject,
        deadline: new Date(deadline || Date.now() + 86400000 * 2).toISOString(),
        priority,
        estimatedMinutes: Number(estimatedMinutes) || 60,
        status: 'belum_mulai',
        notes: notes.trim(),
        content: content.trim(),
        studentSolution: studentSolution.trim(),
        attachments,
        subtasks,
      });
    }
    resetForm();
  };

  // Subtask handlers
  const handleToggleSubtask = (task: AcademicTask, subtaskId: string) => {
    const updatedSubtasks = (task.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks,
    });
  };

  const handleAddSubtaskToTask = (task: AcademicTask) => {
    if (!newSubtaskText.trim()) return;
    const item: TaskSubtask = {
      id: `st-${Date.now()}`,
      text: newSubtaskText.trim(),
      completed: false,
    };
    onUpdateTask({
      ...task,
      subtasks: [...(task.subtasks || []), item],
    });
    setNewSubtaskText('');
  };

  const handleDeleteAttachment = (task: AcademicTask, attId: string) => {
    onUpdateTask({
      ...task,
      attachments: (task.attachments || []).filter((a) => a.id !== attId),
    });
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'aktif') return t.status !== 'selesai';
    if (filter === 'selesai') return t.status === 'selesai';
    return true;
  });

  const formatDeadlineText = (deadlineStr: string) => {
    const d = new Date(deadlineStr);
    const now = new Date();
    const diffHours = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 0) {
      return `Lewat ${Math.abs(diffHours)} jam lalu`;
    }
    if (diffHours < 24) {
      return `Tenggat hari ini (${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    }
    const days = Math.ceil(diffHours / 24);
    return `${days} hari lagi (${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Drawer or Workspace */}
      <aside className="fixed inset-y-0 right-0 w-full max-w-xl bg-[#FBFBF9] border-l border-[#E5E3DD] shadow-2xl flex flex-col z-10">
        {/* Hidden global file input for attachments */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.docx"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Toast Notification */}
        {extractionToast && (
          <div className="absolute top-4 left-4 right-4 z-50 p-3 bg-[#191918] text-white rounded-lg shadow-xl text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{extractionToast}</span>
            </span>
            <button onClick={() => setExtractionToast(null)} className="text-[#8C8A84] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE8E3] bg-white">
          <div className="flex items-center gap-2 min-w-0">
            {activeWorkspaceTask && (
              <button
                onClick={() => setActiveWorkspaceTaskId(null)}
                className="p-1 -ml-1 text-[#646461] hover:text-[#191918] rounded hover:bg-[#F2F1ED] transition-colors"
                title="Kembali ke Daftar Tugas"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#191918] truncate">
                {activeWorkspaceTask ? activeWorkspaceTask.title : 'Sidepod Academic Workspace'}
              </h2>
              <p className="text-xs text-[#7A7874] mt-0.5 truncate">
                {activeWorkspaceTask
                  ? `${activeWorkspaceTask.subject} · ${formatDeadlineText(activeWorkspaceTask.deadline)}`
                  : 'Kelola tugas, lampirkan foto/file soal, dan ekstrak menjadi teks editable.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onClose}
              aria-label="Tutup Sidepod"
              className="p-1.5 text-[#7A7874] hover:text-[#191918] hover:bg-[#F2F1ED] rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODE A: DETAIL IN-WEB WORKSPACE EDITOR FOR A TASK */}
        {activeWorkspaceTask ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Workspace Sub-Header Tabs */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-[#FAF9F6] border-b border-[#EAE8E3] gap-2 overflow-x-auto">
              <div className="flex items-center gap-1 text-xs font-medium">
                <button
                  onClick={() => setWorkspaceTab('content')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                    workspaceTab === 'content'
                      ? 'bg-[#191918] text-white font-semibold shadow-2xs'
                      : 'text-[#646461] hover:bg-[#EAE8E3]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lembar Tugas / Soal</span>
                </button>

                <button
                  onClick={() => setWorkspaceTab('solution')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                    workspaceTab === 'solution'
                      ? 'bg-[#191918] text-white font-semibold shadow-2xs'
                      : 'text-[#646461] hover:bg-[#EAE8E3]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Draf Jawaban Siswa</span>
                </button>

                <button
                  onClick={() => setWorkspaceTab('subtasks')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                    workspaceTab === 'subtasks'
                      ? 'bg-[#191918] text-white font-semibold shadow-2xs'
                      : 'text-[#646461] hover:bg-[#EAE8E3]'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>
                    Checklist ({activeWorkspaceTask.subtasks?.filter((s) => s.completed).length || 0}/
                    {activeWorkspaceTask.subtasks?.length || 0})
                  </span>
                </button>

                <button
                  onClick={() => setWorkspaceTab('attachments')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                    workspaceTab === 'attachments'
                      ? 'bg-[#191918] text-white font-semibold shadow-2xs'
                      : 'text-[#646461] hover:bg-[#EAE8E3]'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>File ({activeWorkspaceTask.attachments?.length || 0})</span>
                </button>
              </div>

              {/* Quick AI Extract button */}
              <button
                onClick={() => handleExtractAssignmentAI()}
                disabled={isExtracting}
                title="Ekstrak lembar tugas atau foto soal menjadi teks editable"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors shrink-0 disabled:opacity-60"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                <span>{isExtracting ? 'Mengekstrak...' : 'Ekstrak AI'}</span>
              </button>
            </div>

            {/* Workspace Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* TAB 1: EDITABLE ASSIGNMENT QUESTIONS & INSTRUCTIONS */}
              {workspaceTab === 'content' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#191918] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Isi Lembar Tugas / Soal (Bisa Diedit Langsung di Web)</span>
                    </label>
                    <span className="text-[11px] text-[#7A7874]">Autosave Aktif</span>
                  </div>

                  {/* Formatting quick helpers */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#FAF9F6] border border-[#EAE8E3] rounded-md text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('assignment-content-editor') as HTMLTextAreaElement;
                        if (!textarea) return;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = activeWorkspaceTask.content || '';
                        const before = text.substring(0, start);
                        const sel = text.substring(start, end) || 'Teks Tebal';
                        const after = text.substring(end);
                        onUpdateTask({ ...activeWorkspaceTask, content: `${before}**${sel}**${after}` });
                      }}
                      className="px-2 py-0.5 rounded font-bold hover:bg-[#EAE8E3] text-[#191918]"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('assignment-content-editor') as HTMLTextAreaElement;
                        if (!textarea) return;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = activeWorkspaceTask.content || '';
                        const before = text.substring(0, start);
                        const sel = text.substring(start, end) || 'Teks Miring';
                        const after = text.substring(end);
                        onUpdateTask({ ...activeWorkspaceTask, content: `${before}_${sel}_${after}` });
                      }}
                      className="px-2 py-0.5 rounded italic hover:bg-[#EAE8E3] text-[#191918]"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = activeWorkspaceTask.content || '';
                        onUpdateTask({ ...activeWorkspaceTask, content: `${text}\n\n### Soal Baru:\n1. ` });
                      }}
                      className="px-2 py-0.5 rounded hover:bg-[#EAE8E3] text-[#191918] font-mono text-[11px]"
                    >
                      + Tambah Soal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = activeWorkspaceTask.content || '';
                        onUpdateTask({ ...activeWorkspaceTask, content: `${text}\n- Rumus: ` });
                      }}
                      className="px-2 py-0.5 rounded hover:bg-[#EAE8E3] text-[#191918] text-[11px]"
                    >
                      + Rumus
                    </button>
                  </div>

                  <textarea
                    id="assignment-content-editor"
                    rows={12}
                    placeholder="Ketik atau tempel teks tugas di sini. Anda juga bisa mengunggah foto lembar soal lalu klik 'Ekstrak AI' untuk mentranskripsikannya secara otomatis..."
                    value={activeWorkspaceTask.content || ''}
                    onChange={(e) => onUpdateTask({ ...activeWorkspaceTask, content: e.target.value })}
                    className="w-full p-3.5 text-xs sm:text-sm font-sans leading-relaxed bg-[#FAF9F6] border border-[#DDDCD6] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#191918]"
                  />

                  {/* Instructions snippet */}
                  <div className="p-3 bg-[#FAF9F6] border border-[#EAE8E3] rounded-lg space-y-1">
                    <label className="text-[11px] font-bold text-[#403F3D] block">
                      Petunjuk / Catatan Guru:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Kerjakan nomor ganjil, tulis langkah di buku..."
                      value={activeWorkspaceTask.notes || ''}
                      onChange={(e) => onUpdateTask({ ...activeWorkspaceTask, notes: e.target.value })}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: EDITABLE STUDENT SOLUTION DRAFT */}
              {workspaceTab === 'solution' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#191918] flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Lembar Pengerjaan & Draf Jawaban Siswa</span>
                    </label>
                    <span className="text-[11px] text-[#7A7874]">
                      {activeWorkspaceTask.studentSolution?.length || 0} karakter
                    </span>
                  </div>

                  <textarea
                    rows={12}
                    placeholder="Tuliskan langkah-langkah pengerjaan, jawaban soal, perhitungan rumus, atau draf esai Anda di sini..."
                    value={activeWorkspaceTask.studentSolution || ''}
                    onChange={(e) => onUpdateTask({ ...activeWorkspaceTask, studentSolution: e.target.value })}
                    className="w-full p-3.5 text-xs sm:text-sm font-sans leading-relaxed bg-white border border-[#DDDCD6] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#191918]"
                  />

                  <div className="flex items-center justify-between text-xs text-[#7A7874]">
                    <span>Jawaban Anda tersimpan otomatis di browser secara aman.</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeWorkspaceTask.studentSolution) {
                          navigator.clipboard.writeText(activeWorkspaceTask.studentSolution);
                          setExtractionToast('Draf jawaban berhasil disalin ke clipboard!');
                          setTimeout(() => setExtractionToast(null), 3000);
                        }
                      }}
                      className="flex items-center gap-1 text-[#191918] font-medium hover:underline"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Salin Jawaban</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: INTERACTIVE CHECKLIST & SUBTASKS */}
              {workspaceTab === 'subtasks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#191918]">
                      Langkah & Checklist Pengerjaan
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-[#4A4946]">
                      {activeWorkspaceTask.subtasks?.filter((s) => s.completed).length || 0} /{' '}
                      {activeWorkspaceTask.subtasks?.length || 0} Selesai
                    </span>
                  </div>

                  {/* Add subtask input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tambah langkah baru (misal: Kerjakan soal 1-3)..."
                      value={newSubtaskText}
                      onChange={(e) => setNewSubtaskText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubtaskToTask(activeWorkspaceTask);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSubtaskToTask(activeWorkspaceTask)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors shrink-0"
                    >
                      + Tambah
                    </button>
                  </div>

                  {/* Checklist items list */}
                  {(!activeWorkspaceTask.subtasks || activeWorkspaceTask.subtasks.length === 0) ? (
                    <div className="py-8 text-center border border-dashed border-[#DDDCD6] rounded-lg text-xs text-[#7A7874] space-y-1">
                      <p>Belum ada checklist langkah pengerjaan.</p>
                      <p className="text-[11px]">
                        Ketik langkah di atas atau klik <strong>"Ekstrak AI"</strong> untuk membuat checklist otomatis!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeWorkspaceTask.subtasks.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between p-2.5 bg-white border border-[#EAE8E3] rounded-md hover:bg-[#FAF9F6] transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleSubtask(activeWorkspaceTask, st.id)}
                            className="flex items-center gap-2.5 text-left text-xs flex-1 min-w-0"
                          >
                            {st.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-[#8C8A84] shrink-0" />
                            )}
                            <span className={st.completed ? 'line-through text-[#8C8A84]' : 'text-[#191918]'}>
                              {st.text}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onUpdateTask({
                                ...activeWorkspaceTask,
                                subtasks: (activeWorkspaceTask.subtasks || []).filter((s) => s.id !== st.id),
                              });
                            }}
                            className="p-1 text-[#8C8A84] hover:text-[#B43425] rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ATTACHMENTS & PHOTOS GALLERY */}
              {workspaceTab === 'attachments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#191918] block">
                        File & Foto Lembar Tugas
                      </span>
                      <p className="text-[11px] text-[#7A7874]">
                        Foto kertas soal, worksheet PDF, atau dokumen tugas sekolah.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#191918] bg-white border border-[#DDDCD6] hover:bg-[#F2F1ED] rounded-md transition-colors shadow-3xs"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Unggah File / Foto</span>
                    </button>
                  </div>

                  {(!activeWorkspaceTask.attachments || activeWorkspaceTask.attachments.length === 0) ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="py-10 border-2 border-dashed border-[#DDDCD6] rounded-xl text-center cursor-pointer hover:border-[#191918] transition-colors p-4 space-y-2 bg-[#FAF9F6]"
                    >
                      <ImageIcon className="w-8 h-8 text-[#8C8A84] mx-auto" />
                      <p className="text-xs font-medium text-[#191918]">
                        Belum ada file atau foto yang dilampirkan
                      </p>
                      <p className="text-[11px] text-[#7A7874] max-w-xs mx-auto">
                        Klik di sini untuk mengunggah foto PR, lembar kerja, atau dokumen PDF, lalu ekstrak ke editor teks dengan AI.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeWorkspaceTask.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="p-3 bg-white border border-[#EAE8E3] rounded-lg shadow-3xs space-y-2 flex flex-col justify-between"
                        >
                          <div>
                            {att.type === 'image' && att.dataUrl ? (
                              <div
                                onClick={() => setPreviewImageModal(att.dataUrl || null)}
                                className="w-full h-28 rounded bg-[#F4F3EE] overflow-hidden cursor-zoom-in relative group mb-2 border border-[#EAE8E3]"
                              >
                                <img
                                  src={att.dataUrl}
                                  alt={att.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                                  <Eye className="w-4 h-4 mr-1" />
                                  <span>Lihat Foto Penuh</span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-20 rounded bg-[#F4F3EE] flex items-center justify-center text-[#7A7874] mb-2 border border-[#EAE8E3]">
                                <FileText className="w-6 h-6" />
                              </div>
                            )}

                            <h4 className="text-xs font-medium text-[#191918] truncate" title={att.name}>
                              {att.name}
                            </h4>
                            <span className="text-[10px] text-[#8C8A84] block mt-0.5">
                              {att.sizeBytes ? `${Math.round(att.sizeBytes / 1024)} KB` : 'Dokumen'} · {att.type.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#F0EFEA] gap-1">
                            <button
                              type="button"
                              onClick={() => handleExtractAssignmentAI(att)}
                              disabled={isExtracting}
                              className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Ekstrak Teks AI</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(activeWorkspaceTask, att.id)}
                              className="p-1 text-[#8C8A84] hover:text-[#B43425] rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Workspace Footer */}
            <div className="p-4 border-t border-[#EAE8E3] bg-[#FAF9F6] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => onToggleTaskComplete(activeWorkspaceTask.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  activeWorkspaceTask.status === 'selesai'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-white border border-[#DDDCD6] text-[#191918] hover:bg-[#F2F1ED]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{activeWorkspaceTask.status === 'selesai' ? 'Tugas Selesai ✓' : 'Tandai Selesai'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveWorkspaceTaskId(null)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors shadow-2xs"
              >
                Simpan & Kembali
              </button>
            </div>
          </div>
        ) : (
          /* MODE B: STANDARD TASK LIST & QUICK ADD FORM */
          <>
            {/* Action & Filter Bar */}
            <div className="px-5 py-3 border-b border-[#EAE8E3] bg-[#F7F6F2] flex items-center justify-between gap-3">
              {/* Segmented Filter Control */}
              <div className="flex items-center gap-1 p-0.5 bg-[#EAE8E3] rounded-md text-xs font-medium">
                <button
                  onClick={() => setFilter('aktif')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filter === 'aktif' ? 'bg-white text-[#191918] shadow-2xs font-semibold' : 'text-[#646461] hover:text-[#191918]'
                  }`}
                >
                  Aktif ({tasks.filter((t) => t.status !== 'selesai').length})
                </button>
                <button
                  onClick={() => setFilter('selesai')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filter === 'selesai' ? 'bg-white text-[#191918] shadow-2xs font-semibold' : 'text-[#646461] hover:text-[#191918]'
                  }`}
                >
                  Selesai ({tasks.filter((t) => t.status === 'selesai').length})
                </button>
                <button
                  onClick={() => setFilter('semua')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filter === 'semua' ? 'bg-white text-[#191918] shadow-2xs font-semibold' : 'text-[#646461] hover:text-[#191918]'
                  }`}
                >
                  Semua ({tasks.length})
                </button>
              </div>

              <button
                onClick={() => {
                  if (isFormOpen) {
                    resetForm();
                  } else {
                    resetForm();
                    setIsFormOpen(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isFormOpen ? 'Tutup Form' : 'Input Tugas'}</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Input / Edit Form */}
              {isFormOpen && (
                <form onSubmit={handleSubmit} className="p-4 bg-white border border-[#E5E3DD] rounded-xl shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F0EFEA]">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7874]">
                      {editingTaskId ? 'Perbarui Tugas' : 'Tugas Baru ke Sidepod'}
                    </span>
                    <span className="text-[11px] text-[#9A9893]">Terhubung ke Kalender</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#403F3D] mb-1">
                      Nama Tugas / PR Sekolah *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: PR Matematika SPLDV Halaman 112"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918] focus:border-[#191918]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#403F3D] mb-1">
                        Mata Pelajaran SMP
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                      >
                        {subjectOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                        <option value="__custom__">+ Mata Pelajaran Lain...</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#403F3D] mb-1">
                        Prioritas
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                      >
                        <option value="tinggi">Tinggi (Mendesak)</option>
                        <option value="sedang">Sedang (Standar)</option>
                        <option value="rendah">Rendah (Fleksibel)</option>
                      </select>
                    </div>
                  </div>

                  {subject === '__custom__' && (
                    <div>
                      <label className="block text-xs font-medium text-[#403F3D] mb-1">
                        Nama Mata Pelajaran Baru
                      </label>
                      <input
                        type="text"
                        placeholder="Misal: Seni Musik SMP"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#403F3D] mb-1">
                        Deadline (Tenggat Pengumpulan) *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#403F3D] mb-1">
                        Estimasi Waktu Belajar
                      </label>
                      <select
                        value={estimatedMinutes}
                        onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                      >
                        <option value={30}>30 Menit</option>
                        <option value={45}>45 Menit</option>
                        <option value={60}>1 Jam (60m)</option>
                        <option value={90}>1.5 Jam (90m)</option>
                        <option value={120}>2 Jam (120m)</option>
                        <option value={180}>3 Jam (180m)</option>
                      </select>
                    </div>
                  </div>

                  {/* Attachment & Photo Section */}
                  <div className="p-3 bg-[#FAF9F6] border border-[#EAE8E3] rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#191918] flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Lampirkan Foto Soal / Lembar Tugas (Opsional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-semibold text-[#191918] hover:underline"
                      >
                        + Pilih File
                      </button>
                    </div>

                    {attachments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between p-2 bg-white rounded border border-[#EAE8E3] text-xs"
                          >
                            <span className="truncate max-w-[200px] text-[#191918]">{att.name}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleExtractAssignmentAI(att)}
                                disabled={isExtracting}
                                className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Ekstrak Teks</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                                className="text-[#8C8A84] hover:text-[#B43425]"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-[#7A7874]">
                      Mendukung foto worksheet kertas (.jpg, .png) dan PDF. AI dapat mengekstrak soal menjadi teks editable.
                    </p>
                  </div>

                  {/* Optional Notes */}
                  <div>
                    <label className="block text-xs font-medium text-[#403F3D] mb-1">
                      Catatan / Instruksi Guru
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Instruksi tambahan guru atau catatan pengerjaan..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#FBFBF9] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-3 py-1.5 text-xs text-[#646461] hover:text-[#191918] rounded-md transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors shadow-2xs"
                    >
                      {editingTaskId ? 'Simpan Perubahan' : 'Tambahkan ke Sidepod'}
                    </button>
                  </div>
                </form>
              )}

              {/* Task List */}
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-[#DDDCD6] rounded-xl bg-white/60 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#DDDCD6] flex items-center justify-center mx-auto text-[#7A7874]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#191918]">
                      {filter === 'selesai'
                        ? 'Belum ada tugas yang diselesaikan.'
                        : 'Daftar tugas Anda masih kosong.'}
                    </p>
                    <p className="text-[11px] text-[#7A7874] max-w-xs mx-auto">
                      {filter !== 'selesai' &&
                        'Masukkan tugas sekolah asli Anda atau lampirkan foto lembar soal untuk diekstrak langsung ke web.'}
                    </p>
                  </div>

                  {filter !== 'selesai' && tasks.length === 0 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setIsFormOpen(true);
                        }}
                        className="px-4 py-2 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-md transition-colors shadow-3xs"
                      >
                        + Input Tugas Baru
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => {
                    const isCompleted = task.status === 'selesai';
                    const isHigh = task.priority === 'tinggi';
                    const attCount = task.attachments?.length || 0;
                    const subtaskCount = task.subtasks?.length || 0;
                    const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;

                    return (
                      <div
                        key={task.id}
                        className={`p-4 bg-white border rounded-xl transition-all ${
                          isCompleted
                            ? 'border-[#ECEAE4] opacity-60'
                            : isHigh
                            ? 'border-[#E8E2D7] hover:border-[#C4BFB5]'
                            : 'border-[#EAE8E3] hover:border-[#D8D6CE]'
                        } shadow-2xs space-y-2.5`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => onToggleTaskComplete(task.id)}
                            aria-label={isCompleted ? `Batal selesaikan "${task.title}"` : `Tandai selesai "${task.title}"`}
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              isCompleted
                                ? 'bg-[#191918] border-[#191918] text-white'
                                : 'border-[#B4B2AB] hover:border-[#191918] bg-[#FBFBF9]'
                            }`}
                          >
                            {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <h4
                                className={`text-xs sm:text-sm font-semibold truncate ${
                                  isCompleted ? 'line-through text-[#8C8A84]' : 'text-[#191918]'
                                }`}
                              >
                                {task.title}
                              </h4>
                              <span
                                className={`text-[10px] tabular-nums shrink-0 font-medium ${
                                  task.priority === 'tinggi'
                                    ? 'text-[#B43425]'
                                    : task.priority === 'sedang'
                                    ? 'text-[#7D5A18]'
                                    : 'text-[#6A6965]'
                                }`}
                              >
                                {task.priority === 'tinggi' ? 'P1 · Tinggi' : task.priority === 'sedang' ? 'P2 · Sedang' : 'P3 · Rendah'}
                              </span>
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-[#7A7874]">
                              <span className="font-medium text-[#4A4946]">{task.subject}</span>
                              <span aria-hidden="true">·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#9A9893]" />
                                <span className="tabular-nums">{task.estimatedMinutes}m</span>
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#9A9893]" />
                                <span>{formatDeadlineText(task.deadline)}</span>
                              </span>
                            </div>

                            {/* Attachments & Subtask Badges */}
                            {(attCount > 0 || subtaskCount > 0 || task.content) && (
                              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-[#F2F1ED] text-[10px]">
                                {attCount > 0 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F4F3EE] text-[#4A4946] font-medium">
                                    <Paperclip className="w-3 h-3" />
                                    <span>{attCount} file terlampir</span>
                                  </span>
                                )}
                                {subtaskCount > 0 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                                    <CheckSquare className="w-3 h-3" />
                                    <span>{completedSubtasks}/{subtaskCount} checklist</span>
                                  </span>
                                )}
                                {task.content && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-medium border border-blue-200">
                                    <FileText className="w-3 h-3" />
                                    <span>Teks Soal Ada</span>
                                  </span>
                                )}
                              </div>
                            )}

                            {task.notes && (
                              <p className="mt-1.5 text-[11px] text-[#646461] line-clamp-2 bg-[#F9F8F5] p-2 rounded border border-[#F0EFEA]">
                                {task.notes}
                              </p>
                            )}

                            {/* Open In-Web Workspace Button */}
                            <div className="mt-3 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleOpenWorkspace(task)}
                                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#191918] bg-[#FAF9F6] hover:bg-[#EAE8E3] border border-[#DDDCD6] rounded-md transition-colors"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Buka & Edit di Web</span>
                                <ChevronRight className="w-3 h-3 ml-0.5 text-[#8C8A84]" />
                              </button>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleStartEdit(task)}
                                  title="Edit data tugas"
                                  aria-label={`Edit ${task.title}`}
                                  className="p-1 text-[#8C8A84] hover:text-[#191918] hover:bg-[#F2F1ED] rounded"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteTask(task.id)}
                                  title="Hapus tugas"
                                  aria-label={`Hapus ${task.title}`}
                                  className="p-1 text-[#8C8A84] hover:text-[#B43425] hover:bg-[#FDF0EE] rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Integration notice */}
              <div className="p-3 bg-[#F4F3EF] border border-[#EAE8E3] rounded-md text-[11px] text-[#646461] flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-[#8C8A84] shrink-0 mt-0.5" />
                <p>
                  Setiap penambahan atau pembaruan tugas di Sidepod otomatis dihitung ke dalam <strong>Academic Calendar</strong> dan membagi jadwal belajar harian Anda secara realistis.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Lightbox Image Preview Modal */}
        {previewImageModal && (
          <div
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewImageModal(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-black">
              <button
                onClick={() => setPreviewImageModal(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 text-white hover:bg-black rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={previewImageModal}
                alt="Lampiran Tugas"
                className="max-w-full max-h-[85vh] object-contain mx-auto"
              />
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
