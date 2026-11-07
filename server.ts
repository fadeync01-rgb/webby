import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '25mb' }));

// Server-side Gemini Client
let geminiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// Endpoint: AI Academic Chatbot with Google Search Grounding & Unlimited Queries
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, role = 'tutor', useSearch = true } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Daftar pesan tidak boleh kosong.' });
    return;
  }

  const lastUserMessage = messages[messages.length - 1];

  if (geminiClient) {
    try {
      const systemInstruction = `Anda adalah Webby Academic AI Tutor, pendamping belajar cerdas khusus untuk siswa SMP (Sekolah Menengah Pertama, Kelas 7, 8, dan 9).
Karakter Anda: Ramah, menyemangati, seru, sabar, menggunakan bahasa yang mudah dipahami anak usia 12-15 tahun, menggunakan contoh konkrit kehidupan sehari-hari anak SMP, dan menghindari istilah kuliah yang membingungkan.
Tugas utama Anda:
- Membantu siswa memahami PR dan tugas sekolah (Matematika SMP, IPA Terpadu, Bahasa Indonesia, Bahasa Inggris, IPS, Informatika SMP).
- Membimbing pemahaman secara Socratic (memberikan petunjuk dan cara berpikir logis, bukan sekadar memberikan jawaban langsung).
Peran: ${
        role === 'examiner'
          ? 'Penguji Ulangan Harian SMP: Berikan pertanyaan kuis singkat dan evaluasi pemahaman materi pelajaran SMP.'
          : role === 'researcher'
          ? 'Teman Belajar Proyek SMP: Bantu mencari contoh nyata, ide observasi, dan fakta sains untuk tugas sekolah.'
          : 'Guru Pembimbing SMP: Jelaskan rumus matematika/IPA dengan perumpamaan sederhana dan langkah-langkah runtut.'
      }
Jika siswa bertanya tentang fakta sains atau berita edukasi, gunakan penelusuran Google Search yang akurat. Berikan format Markdown yang rapi dengan poin-poin jelas.`;

      // Build contents array for multi-turn history
      const formattedContents = messages.map((m: { role: string; text: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const toolsConfig = useSearch ? [{ googleSearch: {} }] : undefined;

      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: formattedContents,
        config: {
          systemInstruction,
          tools: toolsConfig,
        },
      });

      // Extract search grounding sources if present
      const sources: { title: string; uri: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || 'Sumber Web',
              uri: chunk.web.uri,
            });
          }
        }
      }

      res.json({
        success: true,
        text: response.text || 'Tidak ada respons dari model.',
        sources: sources.slice(0, 5),
      });
      return;
    } catch (err: unknown) {
      console.warn('Gemini chat error, falling back:', err);
    }
  }

  // Fallback intelligent responses
  const q = lastUserMessage?.text?.toLowerCase() || '';
  let fallbackReply = `Halo! Saya Webby Academic AI. Terkait pertanyaan Anda tentang "${lastUserMessage?.text?.slice(0, 50)}...":\n\n1. **Prinsip Inti**: Konsep ini bertumpu pada keterkaitan logis antara variabel dan konteks keilmuan yang bersangkutan.\n2. **Penerapan Praktis**: Anda dapat menghubungkannya ke catatan di Notebook Studio atau membaginya ke slide presentasi.\n3. **Saran Belajar**: Gunakan fitur *Active Recall* atau *Short Quiz* di Learning Arena untuk menguji pemahaman Anda secara mendalam.`;

  if (q.includes('quiz') || q.includes('soal')) {
    fallbackReply = `Berikut analisis untuk pertanyaan Anda. Untuk menguji pemahaman lebih lanjut, Anda dapat langsung membuka menu **Learning Arena** untuk menghasilkan kuis tingkat lanjut (Level 1, 2, dan 3 HOTS).`;
  }

  res.json({
    success: true,
    text: fallbackReply,
    sources: [],
  });
});

// Endpoint: Generate Interactive Mind Map from topic or notebook
app.post('/api/generate-mindmap', async (req: Request, res: Response) => {
  const { topic, sourceContent } = req.body;
  const effectiveTopic = topic?.trim() || 'Peta Konsep Akademik';

  if (geminiClient) {
    try {
      const prompt = `Buat struktur Mind Map (Peta Konsep) hierarkis untuk topik akademik berikut:
Topik: ${effectiveTopic}
Konteks / Rujukan Tambahan: ${sourceContent ? sourceContent.slice(0, 4000) : 'Umum'}

Format yang dihasilkan harus berupa JSON pohon konsep:
- Node utama (root): label nama topik
- Memiliki 3-5 cabang utama (children)
- Masing-masing cabang memiliki 2-4 sub-cabang konseptual
- Setiap node memiliki: id (string unik), label (singkat 2-6 kata), description (1 kalimat penjelasan), color (kode warna pastel elegan seperti #EAE8E3, #E8F0FE, #FEF7E0, #FCE8E6, #E6F4EA).`;

      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              root: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                  color: { type: Type.STRING },
                  children: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING },
                        description: { type: Type.STRING },
                        color: { type: Type.STRING },
                        children: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.STRING },
                              label: { type: Type.STRING },
                              description: { type: Type.STRING },
                              color: { type: Type.STRING },
                            },
                            required: ['id', 'label', 'description'],
                          },
                        },
                      },
                      required: ['id', 'label', 'description'],
                    },
                  },
                },
                required: ['id', 'label', 'description'],
              },
            },
            required: ['root'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, root: parsed.root });
      return;
    } catch (err: unknown) {
      console.warn('Gemini mindmap generation failed, using fallback:', err);
    }
  }

  // Fallback mindmap generator
  const fallbackRoot = {
    id: 'root-node',
    label: effectiveTopic,
    description: `Pusat eksplorasi konseptual untuk ${effectiveTopic}`,
    color: '#EAE8E3',
    children: [
      {
        id: 'branch-1',
        label: '1. Fondasi Teoretis',
        description: 'Definisi dasar dan asumsi aksiomatik.',
        color: '#E8F0FE',
        children: [
          { id: 'sub-1-1', label: 'Terminologi Kunci', description: 'Kosakata fundamental keilmuan.', color: '#E8F0FE' },
          { id: 'sub-1-2', label: 'Postulat Utama', description: 'Prinsip yang mendasari fenomena.', color: '#E8F0FE' },
        ],
      },
      {
        id: 'branch-2',
        label: '2. Mekanisme & Proses',
        description: 'Dinamika interaksi dan urutan kausalitas.',
        color: '#FEF7E0',
        children: [
          { id: 'sub-2-1', label: 'Tahapan Operasional', description: 'Urutan kronologis dan fungsi.', color: '#FEF7E0' },
          { id: 'sub-2-2', label: 'Variabel Kritis', description: 'Parameter yang memengaruhi hasil.', color: '#FEF7E0' },
        ],
      },
      {
        id: 'branch-3',
        label: '3. Aplikasi & Studi Kasus',
        description: 'Penerapan di dunia nyata dan analisis kritis.',
        color: '#E6F4EA',
        children: [
          { id: 'sub-3-1', label: 'Contoh Empiris', description: 'Bukti pengujian di lapangan.', color: '#E6F4EA' },
          { id: 'sub-3-2', label: 'Evaluasi & Refleksi', description: 'Kelebihan dan batas teori.', color: '#E6F4EA' },
        ],
      },
    ],
  };

  res.json({ success: true, root: fallbackRoot });
});

// Endpoint: Convert Mind Map into a Structured Notebook
app.post('/api/mindmap-to-notebook', async (req: Request, res: Response) => {
  const { rootNode, subject = 'Umum' } = req.body;

  if (!rootNode || !rootNode.label) {
    res.status(400).json({ error: 'Node mind map tidak valid.' });
    return;
  }

  const branches = rootNode.children || [];
  const sections = branches.map((b: { label: string; description: string; children?: { label: string; description: string }[] }, idx: number) => {
    const subTopics = b.children || [];
    return {
      id: `sec-${Date.now()}-${idx + 1}`,
      title: `${String(idx + 1).padStart(2, '0')}. ${b.label}`,
      topic: `${subject} · ${b.label}`,
      content: `${b.description || ''}\n\nBagian ini mengulas secara mendalam cabang konsep "${b.label}" yang diturunkan dari peta konsep ${rootNode.label}. Sub-bahasan meliputi:\n${subTopics.map((st) => `- ${st.label}: ${st.description}`).join('\n')}`,
      keyTakeaways: subTopics.length > 0
        ? subTopics.map((st) => `Memahami ${st.label} sebagai komponen esensial.`)
        : [`Wawasan utama terkait ${b.label}.`],
      definitions: subTopics.slice(0, 2).map((st) => ({
        term: st.label,
        definition: st.description || `Istilah penting dalam lingkup ${b.label}.`,
      })),
      supportingInfo: `Dikonversi dari Creative Mind Map Studio pada ${new Date().toLocaleDateString('id-ID')}.`,
      originalCitation: `Peta Konsep Visual: ${rootNode.label}`,
      userNotes: '',
    };
  });

  res.json({
    success: true,
    notebook: {
      id: `nb-${Date.now()}`,
      title: rootNode.label,
      subject,
      summary: rootNode.description || `Materi pembelajaran yang dikembangkan dari peta konsep visual ${rootNode.label}.`,
      sections: sections.length > 0 ? sections : [
        {
          id: `sec-${Date.now()}-1`,
          title: '01. Pengantar Konsep',
          topic: subject,
          content: `Pembahasan utama mengenai ${rootNode.label}.`,
          keyTakeaways: ['Prinsip utama materi.'],
          definitions: [{ term: rootNode.label, definition: 'Konsep sentral.' }],
        },
      ],
      sourceType: 'manual',
      sourceFileName: 'Peta Konsep Visual',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  });
});

// Endpoint: Generate Interactive Learning Material (Flashcards, Short Quiz, Full Quiz, Level Questions)
app.post('/api/generate-learning-material', async (req: Request, res: Response) => {
  const { topic, subject = 'Umum', sourceContent } = req.body;
  const effectiveTopic = topic?.trim() || 'Materi Pembelajaran';

  if (geminiClient) {
    try {
      const prompt = `Anda adalah Academic Assessment Engine untuk Webby.
Hasilkan paket latihan pembelajaran akademik lengkap berdasarkan materi berikut:
Topik: ${effectiveTopic}
Mata Kuliah: ${subject}
Konten Sumber:
"""
${sourceContent ? sourceContent.slice(0, 15000) : effectiveTopic}
"""

Hasilkan dalam format JSON:
1. flashcards: 6 kartu active recall. Masing-masing memiliki id, question (pertanyaan uji pemahaman), answer (jawaban ringkas & padat), explanation (penjelasan mendalam), difficulty ('mudah' | 'sedang' | 'sulit').
2. shortQuiz: 4 soal pilihan ganda cepat. Masing-masing memiliki id, question, options (array 4 pilihan), correctIndex (0-3), explanation (alasan mengapa opsi tersebut benar).
3. fullQuiz: 8 soal komprehensif ujian pilihan ganda dengan variasi konsep, opsi dan penjelasan.
4. levelQuestions: 3 soal bertingkat sesuai taksonomi Bloom:
   - Level 1 (Pemahaman Dasar / Mengingat): Pertanyaan definisi & prinsip dasar.
   - Level 2 (Analisis & Penerapan): Soal studi kasus atau penerapan konsep ke masalah riil.
   - Level 3 (Evaluasi Kritis & HOTS): Soal analisis argumentatif tingkat lanjut dengan penilaian kritis.
   Setiap levelQuestion memiliki: id, level (1, 2, atau 3), levelName, question, context, sampleSolution (kunci elaborasi), keyPointsToInclude (array poin penting jawaban).`;

      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                  },
                  required: ['id', 'question', 'answer', 'explanation', 'difficulty'],
                },
              },
              shortQuiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                  },
                  required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
                },
              },
              fullQuiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                  },
                  required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
                },
              },
              levelQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    level: { type: Type.INTEGER },
                    levelName: { type: Type.STRING },
                    question: { type: Type.STRING },
                    context: { type: Type.STRING },
                    sampleSolution: { type: Type.STRING },
                    keyPointsToInclude: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['id', 'level', 'levelName', 'question', 'context', 'sampleSolution', 'keyPointsToInclude'],
                },
              },
            },
            required: ['flashcards', 'shortQuiz', 'fullQuiz', 'levelQuestions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, ...parsed });
      return;
    } catch (err: unknown) {
      console.warn('Gemini learning material generator failed, using fallback:', err);
    }
  }

  // Fallback rich learning material generator
  const fallbackFlashcards = [
    {
      id: 'fc-1',
      question: `Apa definisi fundamental dari ${effectiveTopic}?`,
      answer: `Konsep inti yang menjelaskan prinsip operasional, hubungan kausal, dan batasan teoretis ${effectiveTopic}.`,
      explanation: 'Pemahaman definisi menjadi fondasi sebelum melangkah ke analisis komparatif atau turunan rumus.',
      difficulty: 'mudah',
    },
    {
      id: 'fc-2',
      question: `Sebutkan dua komponen atau variabel kritis dalam kajian ${effectiveTopic}!`,
      answer: 'Variabel independen yang memicu perubahan dan parameter lingkungan penyeimbang.',
      explanation: 'Interaksi kedua variabel ini menentukan kestabilan sistem dalam berbagai kondisi operasional.',
      difficulty: 'sedang',
    },
    {
      id: 'fc-3',
      question: `Mengapa hukum konservasi atau keseimbangan berlaku dalam ${effectiveTopic}?`,
      answer: 'Karena pertukaran energi atau hak tidak dapat tercipta tanpa adanya kompensasi pada entitas sekelilingnya.',
      explanation: 'Prinsip kekekalan berlaku konsisten baik dalam sains alamiah maupun doktrin hukum sosial.',
      difficulty: 'sulit',
    },
    {
      id: 'fc-4',
      question: `Bagaimana cara menguji keabsahan hipotesis pada ${effectiveTopic}?`,
      answer: 'Melalui eksperimen terkontrol, perbandingan yurisprudensi, atau analisis regresi statistik data empiris.',
      explanation: 'Metode saintifik menjamin bahwa kesimpulan yang diambil dapat direplikasi dan diverifikasi.',
      difficulty: 'sedang',
    },
  ];

  const fallbackShortQuiz = [
    {
      id: 'sq-1',
      question: `Pernyataan manakah yang paling akurat menggambarkan hakikat dari ${effectiveTopic}?`,
      options: [
        `Proses terisolasi tanpa pengaruh faktor eksternal sama sekali.`,
        `Kerangka kerja sistemik yang menghubungkan teori dasar dengan bukti empiris.`,
        `Hipotesis spekulatif yang tidak memerlukan pengujian ilmiah.`,
        `Metode acak tanpa struktur metodologi yang jelas.`,
      ],
      correctIndex: 1,
      explanation: 'Kajian ilmiah selalu memadukan kerangka konsep yang kokoh dengan pengujian empiris yang terukur.',
    },
    {
      id: 'sq-2',
      question: `Apa implikasi utama jika terjadi anomali atau deviasi dalam ${effectiveTopic}?`,
      options: [
        `Perlu dilakukan re-kalibrasi model dan evaluasi variabel batas.`,
        `Seluruh teori dasar langsung dibatalkan seketika.`,
        `Anomali diabaikan agar kesimpulan tetap sesuai harapan.`,
        `Sistem dihentikan tanpa catatan evaluasi.`,
      ],
      correctIndex: 0,
      explanation: 'Dalam tradisi ilmiah, anomali menjadi titik awal penyempurnaan atau perluasan teori yang sudah ada.',
    },
    {
      id: 'sq-3',
      question: `Faktor manakah yang bertindak sebagai pengendali utama (checks and balances / regulator)?`,
      options: [
        `Mekanisme umpan balik negatif atau pengawasan yuridis institusional.`,
        `Peningkatan laju reaksi tanpa pembatasan kapasitas.`,
        `Pemusatan seluruh wewenang pada satu titik sentral.`,
        `Pengurangan transparansi data pengukuran.`,
      ],
      correctIndex: 0,
      explanation: 'Mekanisme regulator menjaga agar sistem tidak mengalami disrupsi ekstrem.',
    },
  ];

  const fallbackLevelQuestions = [
    {
      id: 'lq-1',
      level: 1,
      levelName: 'Level 1: Pemahaman Dasar & Terminologi',
      question: `Jelaskan pengertian dasar ${effectiveTopic} dan sebutkan minimal dua prinsip kuncinya!`,
      context: 'Pertanyaan ini menguji penguasaan konsep awal yang menjadi fondasi materi perkuliahan.',
      sampleSolution: `${effectiveTopic} adalah kerangka studi mengenai integrasi prinsip dan metodologi. Dua prinsip kuncinya meliputi keterikatan kausalitas dan kemampuan verifikasi objektif.`,
      keyPointsToInclude: ['Definisi presisi', 'Prinsip pertama', 'Prinsip kedua'],
    },
    {
      id: 'lq-2',
      level: 2,
      levelName: 'Level 2: Analisis & Penerapan Kasus',
      question: `Bagaimana konsep ${effectiveTopic} diterapkan untuk memecahkan dilema praktis di lapangan? Berikan satu simulasi kasus!`,
      context: 'Menguji kemampuan menghubungkan teori abstrak ke skenario terapan.',
      sampleSolution: 'Dalam simulasi kasus, praktisi mengidentifikasi variabel batas terlebih dahulu, mengisolasi faktor pengganggu, lalu menerapkan formula/doktrin terkait secara bertahap.',
      keyPointsToInclude: ['Identifikasi masalah', 'Penerapan teori', 'Solusi yang dihasilkan'],
    },
    {
      id: 'lq-3',
      level: 3,
      levelName: 'Level 3: Evaluasi Kritis & Sintesis HOTS',
      question: `Lakukan telaah kritis terhadap kelemahan atau keterbatasan ${effectiveTopic}. Rekomendasikan pendekatan baru untuk mengatasinya!`,
      context: 'Tingkat tertinggi: penalaran evaluatif dan perancangan alternatif solutif.',
      sampleSolution: 'Kelemahan utama terletak pada asumsi kondisi ideal yang jarang terpenuhi secara sempurna di lapangan. Solusinya adalah mengintegrasikan pendekatan interdisipliner dengan pemodelan adaptif.',
      keyPointsToInclude: ['Kritik terhadap asumsi dasar', 'Bukti keterbatasan empiris', 'Sintesis solusi inovatif'],
    },
  ];

  res.json({
    success: true,
    flashcards: fallbackFlashcards,
    shortQuiz: fallbackShortQuiz,
    fullQuiz: [...fallbackShortQuiz, ...fallbackShortQuiz.map((q, i) => ({ ...q, id: `fq-${i + 4}` }))],
    levelQuestions: fallbackLevelQuestions,
  });
});

// Existing Notebook Extractor & Presentation Divider endpoints
app.post('/api/extract-notebook', async (req: Request, res: Response) => {
  const { rawText, title, subject, fileName, fileType } = req.body;

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    res.status(400).json({ error: 'Teks dokumen sumber tidak boleh kosong.' });
    return;
  }

  const effectiveTitle = title?.trim() || fileName?.replace(/\.[^/.]+$/, '') || 'Catatan Akademik Baru';
  const effectiveSubject = subject?.trim() || 'Umum';

  if (geminiClient) {
    try {
      const prompt = `Anda adalah Academic Workspace AI untuk Webby.
Tugas Anda adalah mengolah dokumen sumber menjadi materi pembelajaran komprehensif (Notebook Studio) yang terstruktur mendalam.
PENTING:
- Pertahankan seluruh konsep inti, penjelasan ilmiah, definisi kunci, dan bukti pendukung.
- Bahasa: Bahasa Indonesia akademis yang jernih.

Judul Dokumen: ${effectiveTitle}
Mata Kuliah: ${effectiveSubject}
Sumber:
"""
${rawText.slice(0, 35000)}
"""`;

      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subject: { type: Type.STRING },
              summary: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    topic: { type: Type.STRING },
                    content: { type: Type.STRING },
                    keyTakeaways: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    definitions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          term: { type: Type.STRING },
                          definition: { type: Type.STRING },
                        },
                        required: ['term', 'definition'],
                      },
                    },
                    supportingInfo: { type: Type.STRING },
                    originalCitation: { type: Type.STRING },
                  },
                  required: ['id', 'title', 'topic', 'content', 'keyTakeaways', 'definitions'],
                },
              },
            },
            required: ['title', 'subject', 'summary', 'sections'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        success: true,
        notebook: {
          ...parsed,
          sourceType: fileType || 'notes',
          sourceFileName: fileName || 'Input Teks',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      });
      return;
    } catch (err: unknown) {
      console.warn('Gemini extraction failed, using deterministic fallback:', err);
    }
  }

  // Deterministic fallback
  const paragraphs = rawText.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 20);
  const fallbackSections = (paragraphs.length > 0 ? paragraphs.slice(0, 4) : [rawText]).map((p, idx) => ({
    id: `sec-${Date.now()}-${idx + 1}`,
    title: p.split('\n')[0].replace(/^#+\s*/, '').slice(0, 60) || `Bagian ${idx + 1}`,
    topic: `${effectiveSubject} · Bab ${idx + 1}`,
    content: p,
    keyTakeaways: [
      `Prinsip dasar dan implikasi konsep bagian ${idx + 1}.`,
      `Keterkaitan metodologi pembahasan dengan penguasaan topik.`,
    ],
    definitions: [
      {
        term: `Terminologi ${idx + 1}`,
        definition: `Konsep operasional dalam lingkup kajian ${effectiveSubject}.`,
      },
    ],
    originalCitation: `Paragraf ${idx + 1} dari naskah sumber`,
  }));

  res.json({
    success: true,
    notebook: {
      title: effectiveTitle,
      subject: effectiveSubject,
      summary: paragraphs.slice(0, 2).join(' ') || rawText.slice(0, 300),
      sections: fallbackSections,
      sourceType: fileType || 'notes',
      sourceFileName: fileName || 'Input Teks',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  });
});

app.post('/api/divide-presentation', async (req: Request, res: Response) => {
  const { sourceText, sourceTitle, sourceSubject, targetSlideCount } = req.body;

  if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length === 0) {
    res.status(400).json({ error: 'Konten sumber materi presentasi tidak boleh kosong.' });
    return;
  }

  const effectiveTitle = sourceTitle?.trim() || 'Outline Presentasi Akademik';
  const effectiveSubject = sourceSubject?.trim() || 'Umum';
  const requestedCount = targetSlideCount ? parseInt(String(targetSlideCount), 10) : 0;

  if (geminiClient) {
    try {
      const slideCountDirective = requestedCount > 0
        ? `Buat tepat ${requestedCount} slide.`
        : 'Rekomendasikan jumlah slide paling optimal (5-8 slide).';

      const prompt = `Anda adalah Presentation Content Organizer untuk Webby.
Bagi materi berikut menjadi outline slide presentasi logis & terstruktur:
- ${slideCountDirective}
- Setiap slide: slideNumber, category, title, mainTakeaway, bulletPoints (3-4 butir), speakerNotes, estimatedMinutes.

Judul: ${effectiveTitle}
Mata Kuliah: ${effectiveSubject}
Konten:
"""
${sourceText.slice(0, 35000)}
"""`;

      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subject: { type: Type.STRING },
              recommendedSlideCount: { type: Type.INTEGER },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    slideNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    mainTakeaway: { type: Type.STRING },
                    bulletPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    speakerNotes: { type: Type.STRING },
                    estimatedMinutes: { type: Type.INTEGER },
                  },
                  required: ['id', 'slideNumber', 'title', 'category', 'mainTakeaway', 'bulletPoints', 'speakerNotes', 'estimatedMinutes'],
                },
              },
            },
            required: ['title', 'subject', 'recommendedSlideCount', 'slides'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        success: true,
        outline: {
          id: `pres-${Date.now()}`,
          ...parsed,
          updatedAt: new Date().toISOString(),
        },
      });
      return;
    } catch (err: unknown) {
      console.warn('Gemini presentation divider failed, using fallback:', err);
    }
  }

  // Fallback divider
  const paragraphs = sourceText.split(/\n\s*\n/).filter((p) => p.trim().length > 10);
  const targetCount = requestedCount > 0 ? requestedCount : Math.min(6, Math.max(3, paragraphs.length));
  const categories = ['Pendahuluan', 'Fondasi Teori', 'Analisis Mendalam', 'Implikasi & Aplikasi', 'Kesimpulan'];

  const fallbackSlides = Array.from({ length: targetCount }, (_, i) => ({
    id: `slide-${Date.now()}-${i + 1}`,
    slideNumber: i + 1,
    title: i === 0 ? effectiveTitle : `Slide ${i + 1}: Pembahasan ${i + 1}`,
    category: categories[i % categories.length],
    mainTakeaway: `Pesan inti yang harus dipahami audiens mengenai ${effectiveSubject}.`,
    bulletPoints: [
      `Konsep kunci terkait latar belakang materi.`,
      `Metodologi dan mekanisme penting dalam analisis.`,
      `Pertimbangan kritis untuk evaluasi hasil.`,
    ],
    speakerNotes: `Jelaskan poin ini dengan artikulasi jelas, kaitkan dengan data pendukung.`,
    estimatedMinutes: 2,
  }));

  res.json({
    success: true,
    outline: {
      id: `pres-${Date.now()}`,
      title: effectiveTitle,
      subject: effectiveSubject,
      recommendedSlideCount: targetCount,
      slides: fallbackSlides,
      updatedAt: new Date().toISOString(),
    },
  });
});

// Endpoint: Extract assignment text, questions, and instructions from uploaded files or photos
app.post('/api/sidepod/extract-assignment', async (req: Request, res: Response) => {
  const { imageBase64, mimeType = 'image/jpeg', fileText, fileName, existingTitle } = req.body;

  if (!imageBase64 && !fileText) {
    res.status(400).json({ error: 'File gambar atau teks tugas wajib disertakan.' });
    return;
  }

  if (geminiClient) {
    try {
      const parts: any[] = [];

      if (imageBase64) {
        // Strip data prefix if present (e.g. "data:image/jpeg;base64,")
        const base64Clean = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: base64Clean,
          },
        });
      }

      const promptText = `Anda adalah asisten cerdas guru dan siswa SMP yang bertugas mengekstrak dan mentranskripsikan dokumen tugas/PR sekolah dari foto lembar kerja (worksheet), buku cetak, tulisan tangan, atau dokumen digital ke dalam teks yang rapi dan dapat diedit langsung di web (editable).

${fileText ? `Teks dokumen yang diberikan:\n"""\n${fileText.slice(0, 10000)}\n"""` : ''}
${fileName ? `Nama file sumber: "${fileName}"` : ''}
${existingTitle ? `Judul tugas saat ini: "${existingTitle}"` : ''}

Tugas Anda:
1. Transkripsikan seluruh isi tugas secara lengkap:
   - Judul tugas
   - Mata pelajaran (Pilih salah satu: Matematika SMP, IPA Terpadu, Bahasa Indonesia, Bahasa Inggris, IPS, Informatika, PPKn, atau Seni Budaya)
   - Petunjuk pengerjaan dari guru
   - Seluruh daftar soal / pertanyaan (pertahankan rumus matematika, simbol fisika, dan nomor soal secara utuh)
2. Buat "extractedText" dalam format Markdown yang bersih, rapi, dan nyaman dibaca untuk siswa SMP.
3. Buat "subtasks": 2 sampai 5 langkah checklist praktis yang bisa dicentang siswa saat menyelesaikan tugas ini (misal: "Membaca soal 1 & 2", "Menghitung nilai x dan y", "Menulis kesimpulan").

Format respons HARUS berupa JSON valid:
{
  "title": "string",
  "subject": "string",
  "instructions": "string",
  "extractedText": "string (Markdown lengkap dengan judul, petunjuk, dan soal)",
  "subtasks": ["string", "string"]
}`;

      parts.push({ text: promptText });

      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subject: { type: Type.STRING },
              instructions: { type: Type.STRING },
              extractedText: { type: Type.STRING },
              subtasks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['title', 'subject', 'instructions', 'extractedText', 'subtasks'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        success: true,
        extracted: {
          title: parsed.title || existingTitle || 'Tugas Baru (Hasil Ekstrak)',
          subject: parsed.subject || 'Pelajaran SMP',
          instructions: parsed.instructions || '',
          extractedText: parsed.extractedText || '',
          subtasks: parsed.subtasks || [],
        },
      });
      return;
    } catch (err: unknown) {
      console.warn('Gemini assignment extraction failed, falling back:', err);
    }
  }

  // Fallback if AI call fails or text-only fallback
  const fallbackTitle = existingTitle || (fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Tugas Sekolah Baru');
  const fallbackText = fileText || `### ${fallbackTitle}\n\nTugas ini berhasil diunggah ke Sidepod. Silakan ketik soal, catatan, atau langkah pengerjaan di sini.`;
  res.json({
    success: true,
    extracted: {
      title: fallbackTitle,
      subject: 'Pelajaran SMP',
      instructions: 'Periksa isi lembar tugas di bawah ini dan edit sesuai kebutuhan.',
      extractedText: fallbackText,
      subtasks: ['Pelajari instruksi tugas', 'Kerjakan soal-soal utama', 'Periksa kembali hasil pengerjaan'],
    },
  });
});



async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Webby fullstack server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
