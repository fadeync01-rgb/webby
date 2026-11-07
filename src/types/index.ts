export type PriorityLevel = 'tinggi' | 'sedang' | 'rendah';
export type TaskStatus = 'belum_mulai' | 'sedang_dikerjakan' | 'selesai';

export interface TaskAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document' | 'other';
  sizeBytes?: number;
  dataUrl?: string; // base64 data for preview
  extractedText?: string;
  uploadedAt: string;
}

export interface TaskSubtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface AcademicTask {
  id: string;
  title: string;
  subject: string;
  deadline: string; // ISO string e.g. "2026-11-08T18:00"
  priority: PriorityLevel;
  estimatedMinutes: number; // e.g. 60
  status: TaskStatus;
  notes?: string;
  content?: string; // Rich editable task / assignment body
  studentSolution?: string; // Editable student solution / answers
  attachments?: TaskAttachment[]; // Photos, PDFs, worksheets
  subtasks?: TaskSubtask[]; // Interactive checklist
  extractedText?: string; // OCR text from worksheet/photo
  relatedNotebookId?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface DefinitionItem {
  term: string;
  definition: string;
}

export interface NotebookSection {
  id: string;
  title: string;
  topic: string;
  content: string; // comprehensive learning prose
  keyTakeaways: string[];
  definitions: DefinitionItem[];
  supportingInfo?: string;
  originalCitation?: string;
  userNotes?: string;
}

export interface Notebook {
  id: string;
  title: string;
  subject: string;
  summary: string;
  updatedAt: string;
  createdAt: string;
  sourceType: 'manual' | 'pdf' | 'docx' | 'pptx' | 'image' | 'notes';
  sourceFileName?: string;
  sections: NotebookSection[];
  isFavorite?: boolean;
}

export interface PresentationSlide {
  id: string;
  slideNumber: number;
  title: string;
  category: string;
  mainTakeaway: string;
  bulletPoints: string[];
  speakerNotes: string;
  estimatedMinutes: number;
}

export interface PresentationOutline {
  id: string;
  title: string;
  subject: string;
  sourceNotebookId?: string;
  sourceTitle?: string;
  slides: PresentationSlide[];
  recommendedSlideCount: number;
  updatedAt: string;
}

export interface DynamicStudySession {
  id: string;
  taskId: string;
  taskTitle: string;
  subject: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm e.g. "09:00"
  endTime: string; // HH:mm e.g. "10:30"
  durationMinutes: number;
  completed: boolean;
  priority: PriorityLevel;
  isDeadlineDay: boolean;
}

// Visual Studio & Mind Map types
export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  color?: string;
  children?: MindMapNode[];
  x?: number;
  y?: number;
}

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface DrawStroke {
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

// Learning Arena types
export interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  difficulty: 'mudah' | 'sedang' | 'sulit';
  status?: 'unseen' | 'lupa' | 'ragu' | 'paham';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  userSelectedIndex?: number;
}

export interface LevelQuestion {
  id: string;
  level: 1 | 2 | 3;
  levelName: string; // Level 1: Pemahaman Dasar, Level 2: Analisis & Aplikasi, Level 3: Evaluasi HOTS
  question: string;
  context: string;
  sampleSolution: string;
  keyPointsToInclude: string[];
  userAnswer?: string;
}

// Chatbot types
export interface ChatSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  sources?: ChatSource[];
}

export type ActiveView =
  | 'home'
  | 'dashboard'
  | 'notebooks'
  | 'canvas'
  | 'learning'
  | 'presentation'
  | 'calendar';
