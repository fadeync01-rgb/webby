import React from 'react';
import { ActiveView } from '../types';
import {
  LayoutDashboard, BookOpen, Presentation, Calendar,
  PanelRightOpen, Plus, Sparkles, BrainCircuit, GraduationCap,
  Home
} from 'lucide-react';

interface TopNavigationProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onToggleSidepod: () => void;
  isSidepodOpen: boolean;
  activeTaskCount: number;
  onQuickNewTask: () => void;
  onToggleChatbot: () => void;
  isChatbotOpen: boolean;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeView,
  onNavigate,
  onToggleSidepod,
  isSidepodOpen,
  activeTaskCount,
  onQuickNewTask,
  onToggleChatbot,
  isChatbotOpen,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-[#FBFBF9]/90 backdrop-blur-md border-b border-[#EAE8E3]">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E2E2D] rounded"
        >
          <div className="w-7 h-7 rounded-md bg-[#191918] text-[#FBFBF9] flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            W
          </div>
          <span className="text-base font-semibold tracking-tight text-[#191918] whitespace-nowrap">
            Webby
          </span>
        </button>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="flex items-center gap-1 overflow-x-auto py-0.5 text-xs sm:text-sm font-medium">
        <button
          onClick={() => onNavigate('home')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'home'
              ? 'bg-[#EAE8E3] text-[#191918] font-semibold'
              : 'text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED]'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Beranda</span>
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'dashboard'
              ? 'bg-[#EAE8E3] text-[#191918] font-semibold'
              : 'text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED]'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Dashboard</span>
        </button>


        <button
          onClick={() => onNavigate('notebooks')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'notebooks'
              ? 'bg-[#EAE8E3] text-[#191918] font-semibold'
              : 'text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Notebook</span>
        </button>

        <button
          onClick={() => onNavigate('canvas')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'canvas'
              ? 'bg-[#EAE8E3] text-[#191918] font-semibold'
              : 'text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED]'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Creative Canvas</span>
        </button>

        <button
          onClick={() => onNavigate('learning')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'learning'
              ? 'bg-[#EAE8E3] text-[#191918] font-semibold'
              : 'text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED]'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Learning Arena</span>
        </button>

        <button
          onClick={() => onNavigate('presentation')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'presentation'
              ? 'bg-[#EAE8E3] text-[#191918] font-semibold'
              : 'text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED]'
          }`}
        >
          <Presentation className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Presentation</span>
        </button>

        <button
          onClick={() => onNavigate('calendar')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'calendar'
              ? 'bg-[#EAE8E3] text-[#191918] font-semibold'
              : 'text-[#646461] hover:text-[#191918] hover:bg-[#F2F1ED]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Calendar</span>
        </button>
      </nav>

      {/* Zone 3: Actions (AI Tutor & Sidepod) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleChatbot}
          aria-label="Buka AI Tutor"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
            isChatbotOpen
              ? 'bg-[#191918] text-white shadow-xs'
              : 'bg-white border border-[#DDDCD6] text-[#191918] hover:bg-[#FAF9F6]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Tutor</span>
        </button>

        <button
          onClick={onToggleSidepod}
          aria-label="Buka Sidepod"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
            isSidepodOpen
              ? 'bg-[#191918] text-white shadow-xs'
              : 'bg-[#ECEAE4] text-[#191918] hover:bg-[#E3E0D8]'
          }`}
        >
          <PanelRightOpen className="w-3.5 h-3.5" />
          <span>Sidepod</span>
          {activeTaskCount > 0 && (
            <span
              className="ml-0.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-semibold rounded-full tabular-nums"
              style={{
                backgroundColor: isSidepodOpen ? '#383836' : '#191918',
                color: '#fff',
              }}
            >
              {activeTaskCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
