import React, { useState, useEffect, useMemo } from 'react';
import { ActiveView, AcademicTask, Notebook, PresentationOutline } from './types';
import {
  loadTasks, saveTasks,
  loadNotebooks, saveNotebooks,
  loadOutlines, saveOutlines,
  hasEnteredWorkspaceBefore, markEnteredWorkspace,
  INITIAL_TASKS, INITIAL_NOTEBOOKS, INITIAL_OUTLINES,
} from './utils/storage';
import { generateDynamicSchedule, formatISODateOnly } from './utils/scheduler';
import { TopNavigation } from './components/TopNavigation';
import { SidepodDrawer } from './components/SidepodDrawer';
import { HomePageView } from './components/HomePageView';
import { DashboardView } from './components/DashboardView';
import { NotebookStudioView } from './components/NotebookStudioView';
import { CreativeCanvasView } from './components/CreativeCanvasView';
import { LearningArenaView } from './components/LearningArenaView';
import { PresentationDividerView } from './components/PresentationDividerView';
import { AcademicCalendarView } from './components/AcademicCalendarView';
import { ChatbotDrawer } from './components/ChatbotDrawer';
import { WorkspaceDataModal } from './components/WorkspaceDataModal';
import { Database, Sparkles } from 'lucide-react';

export default function App() {
  // Initial view defaults to 'home' per user request:
  // "jika baru masuk ada home page terlebih dahulu dan isi tugas masih kosong"
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    return hasEnteredWorkspaceBefore() ? 'dashboard' : 'home';
  });

  const [tasks, setTasks] = useState<AcademicTask[]>(() => loadTasks());
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => loadNotebooks());
  const [outlines, setOutlines] = useState<PresentationOutline[]>(() => loadOutlines());

  // Navigation & context states
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [preselectedPresentationNotebookId, setPreselectedPresentationNotebookId] = useState<string | null>(null);
  const [isSidepodOpen, setIsSidepodOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Sync tasks to localStorage
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // Sync notebooks to localStorage
  useEffect(() => {
    saveNotebooks(notebooks);
  }, [notebooks]);

  // Sync outlines to localStorage
  useEffect(() => {
    saveOutlines(outlines);
  }, [outlines]);

  // Keyboard shortcut: Press 's' (outside inputs) to toggle Sidepod
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 's' &&
        !['input', 'textarea', 'select'].includes((e.target as HTMLElement).tagName.toLowerCase()) &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        setIsSidepodOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute dynamic study schedule reactively from Sidepod tasks
  const dynamicSessions = useMemo(() => {
    return generateDynamicSchedule(tasks);
  }, [tasks]);

  // Today's sessions for dashboard
  const todayKey = formatISODateOnly(new Date());
  const todaySessions = useMemo(() => {
    return dynamicSessions.filter((s) => s.date === todayKey);
  }, [dynamicSessions, todayKey]);

  // Collect all unique academic subject options for SMP
  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.subject && set.add(t.subject));
    notebooks.forEach((n) => n.subject && set.add(n.subject));
    if (set.size === 0) {
      set.add('Matematika SMP');
      set.add('IPA Terpadu');
      set.add('Bahasa Indonesia');
      set.add('Bahasa Inggris');
      set.add('Informatika');
      set.add('IPS (Geografi & Sejarah)');
      set.add('PPKn');
      set.add('Seni Budaya');
    }
    return Array.from(set);
  }, [tasks, notebooks]);

  // Enter Workspace from Home
  const handleEnterWorkspace = () => {
    markEnteredWorkspace();
    setActiveView('dashboard');
  };

  // Task Handlers (Sidepod)
  const handleAddTask = (newTask: Omit<AcademicTask, 'id' | 'createdAt'>) => {
    const task: AcademicTask = {
      ...newTask,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
  };

  const handleUpdateTask = (updated: AcademicTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleToggleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isDone = t.status === 'selesai';
          return {
            ...t,
            status: isDone ? 'sedang_dikerjakan' : 'selesai',
            completedAt: isDone ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  // Notebook Handlers (Notebook Studio)
  const handleSaveNotebook = (saved: Notebook) => {
    setNotebooks((prev) => {
      const idx = prev.findIndex((n) => n.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteNotebook = (id: string) => {
    setNotebooks((prev) => prev.filter((n) => n.id !== id));
    if (activeNotebookId === id) {
      setActiveNotebookId(null);
    }
  };

  const handleDuplicateNotebook = (nb: Notebook) => {
    const duplicated: Notebook = {
      ...nb,
      id: `nb-${Date.now()}`,
      title: `${nb.title} (Salinan)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotebooks((prev) => [duplicated, ...prev]);
    setActiveNotebookId(duplicated.id);
  };

  const handleCreateNotebookFromCanvas = (created: Notebook) => {
    setNotebooks((prev) => [created, ...prev]);
    setActiveNotebookId(created.id);
    setActiveView('notebooks');
  };

  // Seamless Bridge: Send Notebook to Presentation Divider
  const handleSendToPresentation = (nb: Notebook) => {
    setPreselectedPresentationNotebookId(nb.id);
    setActiveView('presentation');
  };

  // Outline Handlers (Presentation Divider)
  const handleSaveOutline = (saved: PresentationOutline) => {
    setOutlines((prev) => {
      const idx = prev.findIndex((o) => o.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteOutline = (id: string) => {
    setOutlines((prev) => prev.filter((o) => o.id !== id));
  };

  // Data Restore
  const handleImportAll = (data: {
    tasks: AcademicTask[];
    notebooks: Notebook[];
    outlines: PresentationOutline[];
  }) => {
    setTasks(data.tasks);
    setNotebooks(data.notebooks);
    setOutlines(data.outlines);
  };

  const handleResetToDemo = () => {
    setTasks([]); // Tasks strictly reset to empty per user instruction
    setNotebooks(INITIAL_NOTEBOOKS);
    setOutlines(INITIAL_OUTLINES);
    setActiveNotebookId(null);
  };

  const activeTaskCount = tasks.filter((t) => t.status !== 'selesai').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] text-[#191918]">
      {/* Top Bar Navigation */}
      <TopNavigation
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          if (view !== 'notebooks') {
            setActiveNotebookId(null);
          }
        }}
        onToggleSidepod={() => setIsSidepodOpen((prev) => !prev)}
        isSidepodOpen={isSidepodOpen}
        activeTaskCount={activeTaskCount}
        onQuickNewTask={() => setIsSidepodOpen(true)}
        onToggleChatbot={() => setIsChatbotOpen((prev) => !prev)}
        isChatbotOpen={isChatbotOpen}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeView === 'home' && (
          <HomePageView
            onEnterWorkspace={handleEnterWorkspace}
            onNavigateToFeature={(feat) => {
              markEnteredWorkspace();
              setActiveView(feat);
            }}
            onOpenSidepod={() => setIsSidepodOpen(true)}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardView
            tasks={tasks}
            notebooks={notebooks}
            outlines={outlines}
            todaySessions={todaySessions}
            onNavigate={(view) => setActiveView(view)}
            onOpenNotebook={(id) => {
              setActiveNotebookId(id);
              setActiveView('notebooks');
            }}
            onOpenSidepod={() => setIsSidepodOpen(true)}
            onNewNotebook={() => {
              setActiveNotebookId(null);
              setActiveView('notebooks');
            }}
            onToggleTaskComplete={handleToggleTaskComplete}
          />
        )}

        {activeView === 'notebooks' && (
          <NotebookStudioView
            notebooks={notebooks}
            activeNotebookId={activeNotebookId}
            onSelectNotebook={(id) => setActiveNotebookId(id)}
            onSaveNotebook={handleSaveNotebook}
            onDeleteNotebook={handleDeleteNotebook}
            onDuplicateNotebook={handleDuplicateNotebook}
            onSendToPresentation={handleSendToPresentation}
            subjectOptions={subjectOptions}
          />
        )}

        {activeView === 'canvas' && (
          <CreativeCanvasView
            notebooks={notebooks}
            onCreateNotebookFromCanvas={handleCreateNotebookFromCanvas}
            subjectOptions={subjectOptions}
          />
        )}

        {activeView === 'learning' && (
          <LearningArenaView
            notebooks={notebooks}
            subjectOptions={subjectOptions}
          />
        )}

        {activeView === 'presentation' && (
          <PresentationDividerView
            outlines={outlines}
            notebooks={notebooks}
            preselectedNotebookId={preselectedPresentationNotebookId}
            onSaveOutline={handleSaveOutline}
            onDeleteOutline={handleDeleteOutline}
            subjectOptions={subjectOptions}
          />
        )}

        {activeView === 'calendar' && (
          <AcademicCalendarView
            tasks={tasks}
            sessions={dynamicSessions}
            onOpenSidepod={() => setIsSidepodOpen(true)}
            onToggleTaskComplete={handleToggleTaskComplete}
            subjectOptions={subjectOptions}
          />
        )}
      </main>

      {/* Upgraded Omnipresent Sidepod Drawer & Workspace */}
      <SidepodDrawer
        isOpen={isSidepodOpen}
        onClose={() => setIsSidepodOpen(false)}
        tasks={tasks}
        onAddTask={handleAddTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onToggleTaskComplete={handleToggleTaskComplete}
        subjectOptions={subjectOptions}
      />

      {/* Omnipresent Gemini Academic Chatbot Drawer */}
      <ChatbotDrawer
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />

      {/* Workspace Data Backup Modal */}
      <WorkspaceDataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        tasks={tasks}
        notebooks={notebooks}
        outlines={outlines}
        onImportAll={handleImportAll}
        onResetToDemo={handleResetToDemo}
      />

      {/* Floating AI Tutor Quick Trigger Button */}
      <aside aria-label="Asisten Belajar Webby" className="fixed bottom-5 right-5 z-20">
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-full shadow-lg transition-transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-[#FBFBF9]" />
          <span>Tanya Guru AI</span>
        </button>
      </aside>

      {/* Editorial Footer */}
      <footer className="border-t border-[#EAE8E3] bg-[#FBFBF9] py-6 px-6 text-xs text-[#7A7874]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#191918]">Webby SMP</span>
            <span>·</span>
            <span>Personal Academic Workspace Siswa SMP</span>
            <span>·</span>
            <span className="text-[#9A9893]">
              Sidepod Workspace · Notebook Studio · Creative Canvas · Learning Arena · Kalender
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDataModalOpen(true)}
              className="hover:text-[#191918] transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Cadangan & Reset Data</span>
            </button>
            <span>·</span>
            <span className="text-[#9A9893]">
              Tekan <kbd className="px-1.5 py-0.5 bg-[#EAE8E3] rounded text-[10px] font-mono text-[#191918]">S</kbd> untuk Sidepod
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
