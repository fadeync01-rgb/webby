import { AcademicTask, Notebook, PresentationOutline } from '../types';

const TASKS_KEY = 'webby_academic_tasks_v3';
const NOTEBOOKS_KEY = 'webby_notebooks_v2';
const OUTLINES_KEY = 'webby_presentation_outlines_v2';
const HAS_ENTERED_WORKSPACE_KEY = 'webby_entered_workspace_v1';

// Initial tasks are strictly EMPTY per user requirement:
// "tugas diisi sendiri, bukan karangan anda, jika baru masuk ada home page terlebih dahulu dan isi tugas masih kosong"
export const INITIAL_TASKS: AcademicTask[] = [];

// Reference notebooks specifically tailored for SISWA SMP (Kurikulum SMP)
export const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb-smp-ipa-tekanan',
    title: 'IPA Terpadu: Tekanan Zat Padat, Cair, & Hukum Pascal',
    subject: 'IPA Terpadu (SMP)',
    summary: 'Rangkuman materi pelajaran IPA SMP Kelas 8 Bab Tekanan Zat. Mencakup konsep tekanan pada zat padat, tekanan hidrostatis zat cair, Hukum Archimedes, dan penerapan Hukum Pascal pada peralatan hidrolik.',
    updatedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    sourceType: 'notes',
    sourceFileName: 'Catatan_IPA_Kelas8_Bab_Tekanan.pdf',
    isFavorite: true,
    sections: [
      {
        id: 'sec-ipa-1',
        title: '01. Tekanan pada Zat Padat (P = F / A)',
        topic: 'Konsep Dasar Tekanan Zat Padat',
        content: `Tekanan adalah besarnya gaya yang bekerja tegak lurus pada suatu bidang per satuan luas bidang tersebut.

Rumus utama:
P = F / A

Keterangan:
- P = Tekanan (satuan: Pascal / N/m²)
- F = Gaya tekan atau gaya berat (satuan: Newton)
- A = Luas bidang tekan yang bersentuhan (satuan: m²)

Hubungan Penting:
1. Tekanan berbanding lurus dengan gaya (F). Semakin besar gaya tekan, tekanannya makin besar.
2. Tekanan berbanding terbalik dengan luas bidang (A). Semakin kecil luas permukaan benda yang menekan, tekanannya akan semakin besar.
Contoh: Pisau tajam memiliki luas mata pisau yang sangat kecil sehingga tekanannya besar dan mudah memotong benda.`,
        keyTakeaways: [
          'Tekanan berbanding lurus dengan gaya tekan (F).',
          'Tekanan berbanding terbalik dengan luas permukaan sentuh (A).',
          'Alas sepatu salju dibuat lebar agar tekanan ke salju kecil dan kaki tidak amblas.',
        ],
        definitions: [
          {
            term: 'Tekanan (Pressure)',
            definition: 'Gaya yang bekerja tegak lurus pada suatu satuan luas bidang tekan (satuan SI: N/m² atau Pascal).',
          },
          {
            term: 'Luas Bidang Tekan (A)',
            definition: 'Luas permukaan bidang yang langsung bersentuhan dan menopang gaya tekan benda.',
          },
        ],
        supportingInfo: 'Kaki bebek yang memiliki selaput renang memiliki luas permukaan lebih besar dibanding kaki ayam, sehingga tekanan kaki bebek ke tanah berlumpur lebih kecil dan tidak mudah terperosok.',
        originalCitation: 'Buku Siswa IPA SMP Kelas VIII Semester 2, Bab 7.',
        userNotes: 'Ingat satuan luas harus selalu diubah ke meter persegi (m²) sebelum menghitung tekanan!',
      },
      {
        id: 'sec-ipa-2',
        title: '02. Tekanan Hidrostatis & Hukum Pascal',
        topic: 'Zat Cair & Fluida Statis SMP',
        content: `Tekanan hidrostatis adalah tekanan yang diakibatkan oleh zat cair yang diam pada kedalaman tertentu.

Rumus Tekanan Hidrostatis:
P_h = ρ . g . h

Keterangan:
- ρ (rho) = massa jenis zat cair (kg/m³)
- g = percepatan gravitasi bumi (m/s²)
- h = kedalaman diukur dari permukaan zat cair (meter)

Hukum Pascal:
"Tekanan yang diberikan pada zat cair di dalam ruang tertutup akan diteruskan ke segala arah dengan sama besar."
Persamaan Hukum Pascal pada bejana berhubungan / dongkrak:
F₁ / A₁ = F₂ / A₂`,
        keyTakeaways: [
          'Semakin dalam posisi suatu titik di dalam air (h membesar), tekanan hidrostatisnya semakin besar.',
          'Dinding bendungan di dasar dibuat lebih tebal untuk menahan tekanan hidrostatis yang besar.',
          'Hukum Pascal memungkinkan gaya kecil (F₁) pada penampang kecil mengangkat beban sangat berat (F₂) pada penampang besar.',
        ],
        definitions: [
          {
            term: 'Tekanan Hidrostatis',
            definition: 'Tekanan zat cair yang disebabkan oleh gaya berat zat cair itu sendiri pada kedalaman tertentu.',
          },
          {
            term: 'Hukum Pascal',
            definition: 'Prinsip fisika bahwa tekanan zat cair dalam ruang tertutup diteruskan ke segala arah sama rata.',
          },
        ],
        supportingInfo: 'Peralatan berbasis Hukum Pascal: dongkrak hidrolik mobil, rem hidrolik sepeda motor, dan alat pengangkat mobil di tempat pencucian kendaraan.',
        originalCitation: 'Buku Paket IPA SMP Kelas VIII Semester 2, Halaman 90-95.',
        userNotes: 'Perhatikan bahwa h dihitung dari permukaan air ke bawah, bukan dari dasar wadah!',
      },
    ],
  },
  {
    id: 'nb-smp-mat-spldv',
    title: 'Matematika: Sistem Persamaan Linear Dua Variabel (SPLDV)',
    subject: 'Matematika SMP',
    summary: 'Rangkuman lengkap materi SPLDV SMP Kelas 8. Pembahasan metode penyelesaian grafis, metode substitusi, metode eliminasi, dan metode campuran dalam memecahkan soal cerita kontekstual sehari-hari.',
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    sourceType: 'notes',
    sourceFileName: 'Materi_SPLDV_Kelas8_SMP.pdf',
    isFavorite: false,
    sections: [
      {
        id: 'sec-mat-1',
        title: '01. Konsep Dasar & Bentuk Umum SPLDV',
        topic: 'Aljabar & Persamaan Linear SMP',
        content: `Persamaan Linear Dua Variabel (PLDV) adalah persamaan matematika yang memuat dua variabel dan masing-masing variabel berpangkat satu (derajat satu).

Bentuk umum SPLDV:
a₁x + b₁y = c₁
a₂x + b₂y = c₂

Di mana:
- x dan y adalah variabel (peubah)
- a₁, a₂, b₁, b₂ adalah koefisien
- c₁ dan c₂ adalah konstanta

Penyelesaian SPLDV adalah pasangan nilai (x, y) yang memenuhi kedua persamaan sekaligus.`,
        keyTakeaways: [
          'Variabel x dan y harus berpangkat 1 (tidak boleh ada x² atau xy).',
          'Pasangan penyelesaian (x, y) harus membuat kedua persamaan bernilai benar.',
        ],
        definitions: [
          {
            term: 'SPLDV',
            definition: 'Dua persamaan linear dua variabel yang saling terkait dan memiliki satu pasangan penyelesaian bersama.',
          },
        ],
        supportingInfo: 'Sering dipakai dalam kehidupan nyata untuk menghitung harga satuan barang belanjaan di koperasi atau kantin sekolah.',
        originalCitation: 'Buku Matematika SMP/MTs Kelas VIII Kurikulum Merdeka.',
      },
    ],
  },
];

export const INITIAL_OUTLINES: PresentationOutline[] = [
  {
    id: 'pres-smp-1',
    title: 'Presentasi Proyek IPA: Penerapan Hukum Pascal di Sekitar Kita',
    subject: 'IPA Terpadu (SMP)',
    sourceNotebookId: 'nb-smp-ipa-tekanan',
    sourceTitle: 'IPA Terpadu: Tekanan Zat Padat, Cair, & Hukum Pascal',
    recommendedSlideCount: 3,
    updatedAt: new Date().toISOString(),
    slides: [
      {
        id: 'slide-1',
        slideNumber: 1,
        title: 'Prinsip Kerja Hukum Pascal dalam Kehidupan Sehari-hari',
        category: 'Pengantar Proyek',
        mainTakeaway: 'Hukum Pascal membuktikan bahwa tekanan zat cair dalam ruang tertutup diteruskan ke segala arah sama besar, memungkinkan kita mengangkat beban berat dengan tenaga minimal.',
        bulletPoints: [
          'Pengenalan ilmuwan Blaise Pascal dan eksperimen bejana tertutup',
          'Rumus dasar perbandingan gaya dan luas penampang: F1/A1 = F2/A2',
          'Alasan mengapa zat cair (fluida) tidak dapat dimampatkan dengan mudah',
        ],
        speakerNotes: 'Buka presentasi dengan menyapa teman sekelas dan guru IPA. Berikan contoh dongkrak hidrolik saat mengganti ban mobil.',
        estimatedMinutes: 2,
      },
      {
        id: 'slide-2',
        slideNumber: 2,
        title: 'Contoh Nyata: Rem Hidrolik & Alat Cuci Mobil',
        category: 'Aplikasi Nyata',
        mainTakeaway: 'Dengan tuas pedal kecil, tekanan minyak rem menjepit piringan cakram ban yang sedang berputar kencang secara aman.',
        bulletPoints: [
          'Cara kerja sistem pengereman cakram pada sepeda motor',
          'Pompa hidrolik pengangkat mobil berbobot hingga 2 ton',
          'Manfaat teknologi hidrolik bagi keselamatan dan kemudahan manusia',
        ],
        speakerNotes: 'Jelaskan diagram aliran minyak rem dari pedal ke kaliper piringan cakram dengan bahasa yang mudah dipahami teman-teman.',
        estimatedMinutes: 3,
      },
    ],
  },
];

// Storage accessors
export function loadTasks(): AcademicTask[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      saveTasks(INITIAL_TASKS);
      return INITIAL_TASKS;
    }
    const parsed: AcademicTask[] = JSON.parse(raw);
    // Strictly filter out any fake or dummy tasks that the user didn't create
    const userOnlyTasks = (Array.isArray(parsed) ? parsed : []).filter(
      (t) =>
        t &&
        !t.id.startsWith('demo-task-') &&
        !t.id.startsWith('task-legacy-') &&
        !t.id.startsWith('sok-') &&
        !t.id.includes('sokrates')
    );
    if (userOnlyTasks.length !== parsed.length) {
      saveTasks(userOnlyTasks);
    }
    return userOnlyTasks;
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks: AcademicTask[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
  }
}

export function loadNotebooks(): Notebook[] {
  try {
    const raw = localStorage.getItem(NOTEBOOKS_KEY);
    if (!raw) {
      saveNotebooks(INITIAL_NOTEBOOKS);
      return INITIAL_NOTEBOOKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTEBOOKS;
  }
}

export function saveNotebooks(notebooks: Notebook[]): void {
  try {
    localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(notebooks));
  } catch (err) {
    console.error('Failed to save notebooks to localStorage:', err);
  }
}

export function loadOutlines(): PresentationOutline[] {
  try {
    const raw = localStorage.getItem(OUTLINES_KEY);
    if (!raw) {
      saveOutlines(INITIAL_OUTLINES);
      return INITIAL_OUTLINES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_OUTLINES;
  }
}

export function saveOutlines(outlines: PresentationOutline[]): void {
  try {
    localStorage.setItem(OUTLINES_KEY, JSON.stringify(outlines));
  } catch (err) {
    console.error('Failed to save presentation outlines to localStorage:', err);
  }
}

export function hasEnteredWorkspaceBefore(): boolean {
  try {
    return localStorage.getItem(HAS_ENTERED_WORKSPACE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markEnteredWorkspace(): void {
  try {
    localStorage.setItem(HAS_ENTERED_WORKSPACE_KEY, 'true');
  } catch (err) {
    console.error(err);
  }
}
