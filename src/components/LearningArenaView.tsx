import React, { useState } from 'react';
import {
  FlashcardItem, QuizQuestion, LevelQuestion, Notebook
} from '../types';
import {
  GraduationCap, Sparkles, CheckCircle2, XCircle, HelpCircle,
  RotateCw, ArrowRight, ArrowLeft, Trophy, Clock, BookOpen,
  Award, AlertCircle, ChevronRight
} from 'lucide-react';

interface LearningArenaViewProps {
  notebooks: Notebook[];
  subjectOptions: string[];
}

export const LearningArenaView: React.FC<LearningArenaViewProps> = ({
  notebooks,
  subjectOptions,
}) => {
  const [activeMode, setActiveMode] = useState<'flashcards' | 'shortquiz' | 'fullquiz' | 'levels'>('flashcards');

  // Generator inputs
  const [generatorTopic, setGeneratorTopic] = useState('');
  const [selectedNotebookId, setSelectedNotebookId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // ================= 1. ACTIVE RECALL / FLASHCARDS STATE =================
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([
    {
      id: 'fc-1',
      question: 'Apa perbedaan mendasar antara sistem terisolasi, tertutup, dan terbuka dalam termodinamika?',
      answer: 'Sistem terisolasi tidak bertukar massa maupun kalor/kerja. Sistem tertutup bertukar energi (kalor/usaha) tetapi massa konstan. Sistem terbuka bertukar massa dan energi sekaligus.',
      explanation: 'Pemahaman batas sistem menentukan persamaan neraca energi yang harus diaplikasikan.',
      difficulty: 'mudah',
      status: 'unseen',
    },
    {
      id: 'fc-2',
      question: 'Bagaimana formulasi matematis Hukum Pertama Termodinamika dan makna fisik dari Entalpi (H)?',
      answer: 'dU = dQ - dW. Entalpi didefinisikan sebagai H = U + PV, mewakili total kalor pada kondisi tekanan konstan (dH = dQ_p).',
      explanation: 'Entalpi menyederhanakan kalkulasi termokimia dan proses fasa pada tekanan atmosfer tetap.',
      difficulty: 'sedang',
      status: 'unseen',
    },
    {
      id: 'fc-3',
      question: 'Mengapa siklus Carnot merepresentasikan efisiensi termal teoritis tertinggi?',
      answer: 'Karena siklus Carnot terdiri dari empat proses reversibel sempurna tanpa gesekan dan tanpa perpindahan kalor pada beda suhu terhingga: η_max = 1 - (T_C / T_H).',
      explanation: 'Semua mesin riil memiliki efisiensi lebih rendah akibat proses tak-terbalikkan (irreversible).',
      difficulty: 'sulit',
      status: 'unseen',
    },
    {
      id: 'fc-4',
      question: 'Apa arti doktrin Checks and Balances dalam sistem presidensial modern?',
      answer: 'Mekanisme saling mengawasi dan mengimbangi antarcabang kekuasaan negara agar tidak terjadi dominasi sepihak atau tirani mayoritas.',
      explanation: 'Contohnya adalah pengujian undang-undang oleh Mahkamah Konstitusi terhadap wewenang legislasi DPR dan Presiden.',
      difficulty: 'mudah',
      status: 'unseen',
    },
  ]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // ================= 2. SHORT QUIZ STATE =================
  const [shortQuiz, setShortQuiz] = useState<QuizQuestion[]>([
    {
      id: 'sq-1',
      question: 'Pada proses adiabatik reversibel, besaran manakah yang selalu bernilai nol?',
      options: [
        'Perubahan temperatur (dT = 0)',
        'Perpindahan kalor netto (dQ = 0)',
        'Usaha mekanis (dW = 0)',
        'Perubahan energi dalam (dU = 0)',
      ],
      correctIndex: 1,
      explanation: 'Definisi proses adiabatik adalah proses termal tanpa adanya aliran kalor yang masuk atau keluar sistem (dQ = 0).',
    },
    {
      id: 'sq-2',
      question: 'Kewenangan judicial review di Indonesia pasca-Amandemen UUD 1945 dipegang oleh:',
      options: [
        'Dewan Perwakilan Rakyat (DPR)',
        'Majelis Permusyawaratan Rakyat (MPR)',
        'Mahkamah Konstitusi (MK) untuk UU dan Mahkamah Agung (MA) untuk peraturan di bawah UU',
        'Komisi Yudisial (KY)',
      ],
      correctIndex: 2,
      explanation: 'Pasal 24C UUD 1945 mengatur MK menguji UU terhadap UUD, sedangkan MA menguji peraturan perundang-undangan di bawah UU terhadap UU.',
    },
    {
      id: 'sq-3',
      question: 'Enzim yang bertugas membuka heliks ganda DNA pada garpu replikasi adalah:',
      options: [
        'DNA Polimerase I',
        'DNA Ligase',
        'DNA Helikase',
        'Topoisomerase',
      ],
      correctIndex: 2,
      explanation: 'Helikase memutus ikatan hidrogen antarbasa komplementer untuk membuka untai ganda menjadi untai cetakan.',
    },
  ]);
  const [shortAnswers, setShortAnswers] = useState<Record<string, number>>({});

  // ================= 3. FULL EXAM QUIZ STATE =================
  const [fullQuiz, setFullQuiz] = useState<QuizQuestion[]>([
    {
      id: 'fq-1',
      question: 'Perumusan statistik Boltzmann mengenai entropi dinyatakan dengan rumus:',
      options: [
        'S = k_B * ln(Ω)',
        'S = m * c * ΔT',
        'S = P * V / T',
        'S = ΔH / ΔG',
      ],
      correctIndex: 0,
      explanation: 'S = k_B * ln(Ω) mengaitkan entropi makroskopis dengan jumlah keadaan mikro (microstates) mikroskopis.',
    },
    {
      id: 'fq-2',
      question: 'Salah satu keunggulan utama sistem pemerintahan presidensial adalah:',
      options: [
        'Pemerintah dapat dibubarkan sewaktu-waktu oleh parlemen.',
        'Kepastian masa jabatan eksekutif (fixed term of office) menjamin stabilitas pemerintahan.',
        'Menteri merangkap sebagai ketua fraksi legislatif.',
        'Perdana menteri memegang kekuasaan tak terbatas.',
      ],
      correctIndex: 1,
      explanation: 'Fixed term menjamin presiden tidak dapat dijatuhkan hanya karena friksi atau perbedaan pandangan politik.',
    },
    {
      id: 'fq-3',
      question: 'Arah sintesis rantai DNA baru oleh DNA Polimerase selalu berlangsung dalam orientasi:',
      options: [
        'Dari 3\' ke 5\'',
        'Dari 5\' ke 3\'',
        'Dua arah secara simultan pada satu untai',
        'Acak tergantung aktivitas telomerase',
      ],
      correctIndex: 1,
      explanation: 'Nukleotida baru hanya dapat ditambahkan pada gugus 3\'-OH bebas dari rantai yang sedang tumbuh.',
    },
    {
      id: 'fq-4',
      question: 'Kondisi reversibilitas penuh dalam termodinamika menyiratkan bahwa:',
      options: [
        'Total entropi alam semesta meningkat drastis.',
        'Tidak ada disipasi energi akibat gesekan atau gradien suhu terhingga (ΔS_semesta = 0).',
        'Proses berlangsung dengan kecepatan tak terhingga.',
        'Tekanan sistem selalu sama dengan nol.',
      ],
      correctIndex: 1,
      explanation: 'Proses reversibel adalah idealisasi teoretis di mana sistem dan lingkungan dapat kembali ke keadaan awal tanpa jejak netto.',
    },
  ]);
  const [fullAnswers, setFullAnswers] = useState<Record<string, number>>({});
  const [isFullQuizSubmitted, setIsFullQuizSubmitted] = useState(false);

  // ================= 4. LEVEL-BASED QUESTIONS (Bloom's Taxonomy / HOTS) =================
  const [levelQuestions, setLevelQuestions] = useState<LevelQuestion[]>([
    {
      id: 'lq-1',
      level: 1,
      levelName: 'Level 1: Pemahaman Dasar & Terminologi',
      question: 'Jelaskan perbedaan antara fungsi keadaan (state function) dan fungsi lintasan (path function) dalam termodinamika!',
      context: 'Fondasi penting dalam menurunkan persamaan energi dan kerja mekanik.',
      sampleSolution: 'Fungsi keadaan (seperti P, V, T, U, H, S) nilainya hanya bergantung pada kondisi awal dan akhir sistem, bukan cara sistem mencapainya. Sebaliknya, fungsi lintasan (seperti Kalor Q dan Usaha W) nilainya sangat bergantung pada lintasan proses spesifik.',
      keyPointsToInclude: [
        'Definisi fungsi keadaan (hanya tergantung titik awal & akhir)',
        'Definisi fungsi lintasan (tergantung riwayat proses)',
        'Contoh konkret (U & H vs Q & W)',
      ],
    },
    {
      id: 'lq-2',
      level: 2,
      levelName: 'Level 2: Analisis & Penerapan Kasus',
      question: 'Mengapa mekanisme impeachment di Indonesia pasca-Amandemen UUD 1945 memerlukan putusan hukum Mahkamah Konstitusi sebelum diajukan ke MPR?',
      context: 'Analisis perimbangan hukum vs politik ketatanegaraan.',
      sampleSolution: 'Keterlibatan Mahkamah Konstitusi memastikan bahwa pemakzulan didasarkan pada pelanggaran hukum berat yang terbukti secara yuridis (forum peradilan hukum), bukan sekadar manuver politik atau mosi tidak percaya dari DPR. Ini melindungi stabilitas eksekutif dalam sistem presidensial.',
      keyPointsToInclude: [
        'Mencegah mosi tidak percaya terselubung',
        'Pembuktian yuridis atas pelanggaran hukum konstitusional',
        'Menjaga prinsip fixed term of office',
      ],
    },
    {
      id: 'lq-3',
      level: 3,
      levelName: 'Level 3: Evaluasi Kritis & HOTS',
      question: 'Kaji secara kritis implikasi replikasi semi-konservatif pada untai tertinggal (lagging strand). Mengapa sel membutuhkan fragmen Okazaki dan bagaimana sel eukariotik mengatasi masalah pemendekan ujung telomer?',
      context: 'Penalaran tingkat tinggi biologi molekuler genomik.',
      sampleSolution: 'Karena DNA Polimerase hanya dapat menyintesis dengan arah 5 ke 3 sedangkan kedua untai induk antiparalel, untai tertinggal disintesis diskontinu menghasilkan fragmen Okazaki yang disambung oleh ligase. Pada sel eukariotik linear, penghilangan primer RNA di ujung meninggalkan celah yang tidak bisa diisi, menyebabkan pemendekan telomer setiap siklus pembelahan. Sel punca dan sel kanker mengatasi ini dengan enzim telomerase yang memanjangkan ujung kromosom menggunakan cetakan RNA bawaan.',
      keyPointsToInclude: [
        'Antiparalelitas untai cetakan vs keterbatasan polimerase (arah 5\' ke 3\')',
        'Mekanisme fragmen Okazaki & DNA ligase',
        'End-replication problem pada kromosom linear',
        'Aktivitas enzim telomerase',
      ],
    },
  ]);
  const [levelUserAnswers, setLevelUserAnswers] = useState<Record<string, string>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});

  // Generate learning materials with AI
  const handleGeneratePractice = async (e: React.FormEvent) => {
    e.preventDefault();
    let topicToUse = generatorTopic.trim();
    let contentToUse = '';
    let subjectToUse = subjectOptions[0] || 'Umum';

    if (!topicToUse && selectedNotebookId) {
      const nb = notebooks.find((n) => n.id === selectedNotebookId);
      if (nb) {
        topicToUse = nb.title;
        subjectToUse = nb.subject;
        contentToUse = nb.summary + '\n' + nb.sections.map((s) => s.title + ': ' + s.content).join('\n');
      }
    }

    if (!topicToUse) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-learning-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse,
          subject: subjectToUse,
          sourceContent: contentToUse,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.flashcards) setFlashcards(data.flashcards);
        if (data.shortQuiz) setShortQuiz(data.shortQuiz);
        if (data.fullQuiz) setFullQuiz(data.fullQuiz);
        if (data.levelQuestions) setLevelQuestions(data.levelQuestions);
        // Reset states
        setCurrentCardIndex(0);
        setIsCardFlipped(false);
        setShortAnswers({});
        setFullAnswers({});
        setIsFullQuizSubmitted(false);
        setRevealedSolutions({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Flashcard Rating Handler
  const handleRateFlashcard = (status: 'lupa' | 'ragu' | 'paham') => {
    setFlashcards((prev) =>
      prev.map((c, idx) => (idx === currentCardIndex ? { ...c, status } : c))
    );
    setIsCardFlipped(false);
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const currentCard = flashcards[currentCardIndex] || null;

  // Short Quiz Score
  const shortCorrectCount = shortQuiz.filter(
    (q) => shortAnswers[q.id] === q.correctIndex
  ).length;

  // Full Quiz Score
  const fullCorrectCount = fullQuiz.filter(
    (q) => fullAnswers[q.id] === q.correctIndex
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#EAE8E3]">
        <div>
          <h1 className="text-2xl font-semibold text-[#191918]">Learning Arena & Assessment</h1>
          <p className="text-xs text-[#7A7874] mt-1 max-w-xl">
            Pusat pelatihan aktif: uji pemahaman materi melalui Flashcard Active Recall (Leitner), Kuis Cepat, Ujian Komprehensif, dan Soal Penalaran Bertingkat (Level 1, 2, dan 3 HOTS).
          </p>
        </div>

        {/* Study Mode Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EAE8E3] rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveMode('flashcards')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeMode === 'flashcards'
                ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                : 'text-[#646461] hover:text-[#191918]'
            }`}
          >
            Active Recall
          </button>
          <button
            onClick={() => setActiveMode('shortquiz')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeMode === 'shortquiz'
                ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                : 'text-[#646461] hover:text-[#191918]'
            }`}
          >
            Short Quiz
          </button>
          <button
            onClick={() => setActiveMode('fullquiz')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeMode === 'fullquiz'
                ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                : 'text-[#646461] hover:text-[#191918]'
            }`}
          >
            Full Exam
          </button>
          <button
            onClick={() => setActiveMode('levels')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeMode === 'levels'
                ? 'bg-white text-[#191918] shadow-2xs font-semibold'
                : 'text-[#646461] hover:text-[#191918]'
            }`}
          >
            Level-Based HOTS
          </button>
        </div>
      </div>

      {/* AI Practice Generator Bar */}
      <div className="p-4 bg-white border border-[#EAE8E3] rounded-lg shadow-2xs">
        <form onSubmit={handleGeneratePractice} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#191918] shrink-0">
            <Sparkles className="w-4 h-4 text-[#191918]" />
            <span>Generate Latihan:</span>
          </div>

          <input
            type="text"
            placeholder="Topik latihan baru... (e.g. Mekanisme Replikasi DNA)"
            value={generatorTopic}
            onChange={(e) => setGeneratorTopic(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#DDDCD6] rounded-md focus:outline-none focus:ring-1 focus:ring-[#191918]"
          />

          {notebooks.length > 0 && (
            <select
              value={selectedNotebookId}
              onChange={(e) => {
                setSelectedNotebookId(e.target.value);
                if (e.target.value) setGeneratorTopic('');
              }}
              className="px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#DDDCD6] rounded-md text-[#4A4946] focus:outline-none"
            >
              <option value="">Atau pilih dari Notebook Studio...</option>
              {notebooks.map((n) => (
                <option key={n.id} value={n.id}>
                  [{n.subject}] {n.title}
                </option>
              ))}
            </select>
          )}

          <button
            type="submit"
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#191918] hover:bg-[#2C2C2A] disabled:opacity-50 rounded-md transition-colors shadow-2xs shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Menyusun Latihan...' : 'Buat Paket Soal AI'}</span>
          </button>
        </form>
      </div>

      {/* ================= 1. ACTIVE RECALL / FLASHCARDS ================= */}
      {activeMode === 'flashcards' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs text-[#7A7874]">
            <span className="font-semibold text-[#191918]">Active Recall Spaced Repetition</span>
            <span className="tabular-nums font-mono">
              Kartu {currentCardIndex + 1} dari {flashcards.length}
            </span>
          </div>

          {currentCard ? (
            <div className="space-y-4">
              {/* Interactive Card */}
              <div
                onClick={() => setIsCardFlipped((prev) => !prev)}
                className={`p-8 bg-white border rounded-2xl shadow-sm min-h-[260px] flex flex-col justify-between cursor-pointer transition-all ${
                  isCardFlipped ? 'border-[#191918] ring-1 ring-[#191918]' : 'border-[#EAE8E3] hover:border-[#C4BFB5]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#8C8A84] mb-3">
                    <span className="uppercase tracking-wider font-semibold">
                      {isCardFlipped ? 'KUNCI JAWABAN & ELABORASI' : 'PERTANYAAN UJI'}
                    </span>
                    <span className="capitalize text-[#7A7874]">Tingkat: {currentCard.difficulty}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-[#191918] leading-relaxed">
                    {isCardFlipped ? currentCard.answer : currentCard.question}
                  </h3>

                  {isCardFlipped && currentCard.explanation && (
                    <div className="mt-4 pt-3 border-t border-[#F0EFEA] text-xs text-[#646461] leading-relaxed">
                      <strong>Penjelasan:</strong> {currentCard.explanation}
                    </div>
                  )}
                </div>

                <div className="pt-4 text-center text-[11px] text-[#8C8A84]">
                  {isCardFlipped ? 'Klik untuk membalik kartu kembali' : 'Klik kartu untuk membuka jawaban'}
                </div>
              </div>

              {/* Leitner Confidence Buttons */}
              <div className="p-4 bg-white border border-[#EAE8E3] rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                <span className="text-xs font-medium text-[#7A7874]">Tingkat Pemahaman:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRateFlashcard('lupa')}
                    className="px-3.5 py-1.5 text-xs font-medium text-[#B43425] bg-[#FDF0EE] hover:bg-[#F9DCD8] rounded-md transition-colors"
                  >
                    Lupa (Ulangi)
                  </button>
                  <button
                    onClick={() => handleRateFlashcard('ragu')}
                    className="px-3.5 py-1.5 text-xs font-medium text-[#7D5A18] bg-[#FFF9EE] hover:bg-[#FBECC6] rounded-md transition-colors"
                  >
                    Ragu
                  </button>
                  <button
                    onClick={() => handleRateFlashcard('paham')}
                    className="px-3.5 py-1.5 text-xs font-medium text-[#137333] bg-[#E6F4EA] hover:bg-[#CEEAD6] rounded-md transition-colors"
                  >
                    Paham & Kuasai
                  </button>
                </div>
              </div>

              {/* Navigation row */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    if (currentCardIndex > 0) {
                      setCurrentCardIndex((p) => p - 1);
                      setIsCardFlipped(false);
                    }
                  }}
                  disabled={currentCardIndex === 0}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#646461] hover:text-[#191918] disabled:opacity-30"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <button
                  onClick={() => {
                    if (currentCardIndex < flashcards.length - 1) {
                      setCurrentCardIndex((p) => p + 1);
                      setIsCardFlipped(false);
                    }
                  }}
                  disabled={currentCardIndex === flashcards.length - 1}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#646461] hover:text-[#191918] disabled:opacity-30"
                >
                  <span>Selanjutnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-center text-[#7A7874] py-8">Belum ada kartu latihan.</p>
          )}
        </div>
      )}

      {/* ================= 2. SHORT QUIZ ================= */}
      {activeMode === 'shortquiz' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0EFEA]">
            <span className="text-xs font-semibold text-[#191918] uppercase tracking-wider">
              Short Quiz: Latihan Cepat Pemahaman
            </span>
            <span className="text-xs font-mono tabular-nums text-[#7A7874]">
              Skor: {shortCorrectCount} / {shortQuiz.length} Benar
            </span>
          </div>

          <div className="space-y-6">
            {shortQuiz.map((q, idx) => {
              const selectedOpt = shortAnswers[q.id];
              const isAnswered = selectedOpt !== undefined;

              return (
                <div key={q.id} className="p-5 bg-white border border-[#EAE8E3] rounded-xl shadow-2xs space-y-3.5">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded bg-[#FAF9F6] border border-[#DDDCD6] text-[11px] font-bold text-[#191918] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-[#191918] leading-relaxed">
                      {q.question}
                    </h3>
                  </div>

                  <div className="space-y-2 pl-9">
                    {q.options.map((opt, oIdx) => {
                      const isThisSelected = selectedOpt === oIdx;
                      const isCorrect = q.correctIndex === oIdx;

                      let btnStyle = 'border-[#EAE8E3] bg-[#FAF9F6] hover:bg-[#F4F3EE] text-[#2E2E2D]';
                      if (isAnswered) {
                        if (isCorrect) {
                          btnStyle = 'border-[#CEEAD6] bg-[#E6F4EA] text-[#137333] font-semibold';
                        } else if (isThisSelected) {
                          btnStyle = 'border-[#F5C2BC] bg-[#FDF0EE] text-[#B43425] line-through';
                        } else {
                          btnStyle = 'border-[#EAE8E3] bg-[#FAF9F6] opacity-60 text-[#7A7874]';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={isAnswered}
                          onClick={() => setShortAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                          className={`w-full p-2.5 rounded-lg border text-xs text-left transition-colors flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#137333] shrink-0 ml-2" />}
                          {isAnswered && isThisSelected && !isCorrect && <XCircle className="w-4 h-4 text-[#B43425] shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className="pl-9 pt-2 text-xs text-[#646461] leading-relaxed border-t border-[#F0EFEA]">
                      <strong>Penjelasan:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= 3. FULL EXAM QUIZ ================= */}
      {activeMode === 'fullquiz' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-4 bg-white border border-[#EAE8E3] rounded-xl shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#191918]">Simulasi Ujian Lengkap (Full Exam)</h3>
              <p className="text-xs text-[#7A7874] mt-0.5">
                Uji komprehensif seluruh bab materi dengan evaluasi skor akhir.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#191918] bg-[#FAF9F6] px-3 py-1.5 rounded-md border border-[#DDDCD6]">
              <Clock className="w-3.5 h-3.5 text-[#7A7874]" />
              <span>Simulasi Ujian</span>
            </div>
          </div>

          <div className="space-y-5">
            {fullQuiz.map((q, idx) => (
              <div key={q.id} className="p-5 bg-white border border-[#EAE8E3] rounded-xl shadow-2xs space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded bg-[#191918] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#191918]">
                    {q.question}
                  </h4>
                </div>

                <div className="space-y-2 pl-9">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = fullAnswers[q.id] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        disabled={isFullQuizSubmitted}
                        onClick={() => setFullAnswers((p) => ({ ...p, [q.id]: oIdx }))}
                        className={`w-full p-2.5 rounded-lg border text-xs text-left transition-colors ${
                          isSelected
                            ? 'border-[#191918] bg-[#F2F1ED] font-semibold text-[#191918]'
                            : 'border-[#EAE8E3] bg-[#FAF9F6] hover:bg-[#F2F1ED] text-[#4A4946]'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Submission and Result Card */}
          {!isFullQuizSubmitted ? (
            <button
              onClick={() => setIsFullQuizSubmitted(true)}
              className="w-full py-3 text-xs font-semibold text-white bg-[#191918] hover:bg-[#2C2C2A] rounded-xl transition-colors shadow-xs"
            >
              Kumpulkan Lembar Jawaban & Lihat Analisis Skor
            </button>
          ) : (
            <div className="p-6 bg-white border border-[#EAE8E3] rounded-xl shadow-2xs space-y-4 text-center">
              <Trophy className="w-8 h-8 text-[#191918] mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-[#191918]">Hasil Simulasi Ujian</h3>
                <div className="text-3xl font-extrabold text-[#191918] tabular-nums mt-1">
                  {Math.round((fullCorrectCount / fullQuiz.length) * 100)}%
                </div>
                <p className="text-xs text-[#7A7874] mt-1">
                  Anda menjawab benar {fullCorrectCount} dari {fullQuiz.length} soal.
                </p>
              </div>

              <button
                onClick={() => {
                  setFullAnswers({});
                  setIsFullQuizSubmitted(false);
                }}
                className="px-4 py-2 text-xs font-medium text-[#191918] bg-[#FAF9F6] border border-[#DDDCD6] hover:bg-[#F2F1ED] rounded-lg transition-colors"
              >
                Ulangi Ujian
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= 4. LEVEL-BASED QUESTIONS (Bloom's Taxonomy / HOTS) ================= */}
      {activeMode === 'levels' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-4 bg-white border border-[#EAE8E3] rounded-xl shadow-2xs space-y-1">
            <h3 className="text-sm font-semibold text-[#191918]">
              Level-Based Questions (Taksonomi Bloom & HOTS)
            </h3>
            <p className="text-xs text-[#7A7874]">
              Latihan bertingkat: dari pemahaman definisi dasar (Level 1), analisis kasus terapan (Level 2), hingga evaluasi kritis & sintesis tingkat tinggi (Level 3).
            </p>
          </div>

          <div className="space-y-6">
            {levelQuestions.map((lq) => {
              const isRevealed = revealedSolutions[lq.id];

              return (
                <div key={lq.id} className="p-6 bg-white border border-[#EAE8E3] rounded-xl shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F0EFEA]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#191918]">
                      {lq.levelName}
                    </span>
                    <span className="text-[10px] font-mono text-[#8C8A84] px-2 py-0.5 bg-[#FAF9F6] rounded border border-[#EAE8E3]">
                      Level {lq.level}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#191918] leading-relaxed">
                      {lq.question}
                    </h4>
                    {lq.context && (
                      <p className="text-xs text-[#7A7874] mt-1 italic">
                        Konteks: {lq.context}
                      </p>
                    )}
                  </div>

                  {/* Student Answer Box */}
                  <div>
                    <label className="text-[11px] font-medium text-[#7A7874] block mb-1">
                      Ketik Jawaban / Analisis Anda:
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Uraikan penalaran ilmiah, rumus, atau argumen Anda di sini..."
                      value={levelUserAnswers[lq.id] || ''}
                      onChange={(e) =>
                        setLevelUserAnswers((prev) => ({ ...prev, [lq.id]: e.target.value }))
                      }
                      className="w-full p-3 text-xs bg-[#FAF9F6] border border-[#DDDCD6] rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#191918] leading-relaxed"
                    />
                  </div>

                  {/* Solution Reveal & Rubric */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() =>
                        setRevealedSolutions((prev) => ({ ...prev, [lq.id]: !prev[lq.id] }))
                      }
                      className="text-xs font-medium text-[#191918] hover:underline flex items-center gap-1.5"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isRevealed ? 'rotate-90' : ''}`} />
                      <span>{isRevealed ? 'Tutup Kunci & Rubrik Penilaian' : 'Bandingkan dengan Kunci Solusi & Rubrik'}</span>
                    </button>
                  </div>

                  {isRevealed && (
                    <div className="p-4 bg-[#FAF9F6] border border-[#EAE8E3] rounded-lg space-y-3 text-xs text-[#2E2E2D]">
                      <div>
                        <span className="font-semibold text-[#191918] block mb-1">
                          Model Solusi Ideal:
                        </span>
                        <p className="leading-relaxed text-[#4A4946]">
                          {lq.sampleSolution}
                        </p>
                      </div>

                      {lq.keyPointsToInclude && lq.keyPointsToInclude.length > 0 && (
                        <div>
                          <span className="font-semibold text-[#191918] block mb-1">
                            Poin Kunci yang Harus Tercakup dalam Jawaban:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-[#646461]">
                            {lq.keyPointsToInclude.map((pt, pIdx) => (
                              <li key={pIdx}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
