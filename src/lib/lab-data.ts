// ─── Types ────────────────────────────────────────────────────────────────────

export type DosageForm =
  | 'krim' | 'gel' | 'serum' | 'emulsi' | 'lotion' | 'cleanser' | 'toner' | 'masker' | 'minyak'

export interface QTPP {
  bentukSediaan: DosageForm
  rutePenggunaan: string
  penampilan: string
  warna: string
  aroma: string
  phMin: number
  phMax: number
  viskositasMin: number
  viskositasMax: number
  viskositasUnit: string
  ukuranPartikelMax: number
  stabilitasTarget: string
  bahanAktifTarget: string
  keamananTarget: string
  umurSimpan: string
}

export interface Ingredient {
  nama: string
  fungsi: string
  persentase: number
}

export interface FormulaVersion {
  versionId: string
  versionLabel: string // e.g. "v1", "v2"
  createdAt: string
  bahan: Ingredient[]
  catatan: string
}

export interface Formula {
  formulaId: string
  nama: string
  createdAt: string
  updatedAt: string
  versions: FormulaVersion[]
  activeVersionId: string
}

export type PredictionStatus = 'queue' | 'processing' | 'done' | 'failed'

export interface CompatibilityResult {
  bahanA: string
  bahanB: string
  level: 'aman' | 'perhatian' | 'hindari'
  catatan: string
}

export interface PredictionResult {
  skorStabilitas: number        // 0–100
  estimasiShelfLife: string
  kesesuaianQTPP: {
    ph: boolean
    viskositas: boolean
    penampilan: boolean
    keamanan: boolean
    stabilitas: boolean
  }
  kompatibilitas: CompatibilityResult[]
  rekomendasiAI: string[]
  ringkasan: string
  tingkatKepercayaan: number    // 0–100
}

export interface Prediction {
  predictionId: string
  workspaceId: string
  formulaId: string
  formulaVersionId: string
  formulaNama: string
  formulaVersionLabel: string
  status: PredictionStatus
  createdAt: string
  finishedAt?: string
  result?: PredictionResult
}

export type SafetyTestStatus = 'draft' | 'ongoing' | 'selesai'

export interface SafetyTestItem {
  nama: string
  metode: string
  hasil: string
  kesimpulan: 'aman' | 'perhatian' | 'tidak_aman'
}

export interface SafetyTest {
  safetyId: string
  workspaceId: string
  predictionId: string
  formulaNama: string
  formulaVersionLabel: string
  status: SafetyTestStatus
  createdAt: string
  items: SafetyTestItem[]
  kesimpulanUmum: string
}

export interface Workspace {
  workspaceId: string
  nama: string
  deskripsi: string
  createdAt: string
  updatedAt: string
  qtpp: QTPP
  formulas: Formula[]
  predictions: Prediction[]
  safetyTests: SafetyTest[]
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

export const DUMMY_WORKSPACES: Workspace[] = [
  {
    workspaceId: 'ws-001',
    nama: 'Serum Anti Jerawat',
    deskripsi: 'Formulasi serum topikal dengan niacinamide dan salicylic acid untuk kulit berjerawat.',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-15T14:30:00Z',
    qtpp: {
      bentukSediaan: 'serum',
      rutePenggunaan: 'Topikal',
      penampilan: 'Cairan bening homogen, tidak memisah',
      warna: 'Bening kekuningan',
      aroma: 'Sedikit fragrance, tidak menyengat',
      phMin: 5.0,
      phMax: 5.5,
      viskositasMin: 300,
      viskositasMax: 800,
      viskositasUnit: 'cPs',
      ukuranPartikelMax: 200,
      stabilitasTarget: 'Stabil pada 40°C/75% RH selama 6 bulan (ICH Q1A)',
      bahanAktifTarget: 'Niacinamide 5%, Salicylic Acid 0.5–1%',
      keamananTarget: 'Tidak menimbulkan iritasi, HRIPT negatif',
      umurSimpan: '24 bulan pada suhu kamar',
    },
    formulas: [
      {
        formulaId: 'f-001',
        nama: 'Formula Basis Niacinamide',
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-10T09:00:00Z',
        activeVersionId: 'fv-002',
        versions: [
          {
            versionId: 'fv-001',
            versionLabel: 'v1',
            createdAt: '2026-09-02T10:00:00Z',
            catatan: 'Draft awal, belum dioptimasi pH',
            bahan: [
              { nama: 'Aqua (Water)', fungsi: 'Pelarut', persentase: 74.5 },
              { nama: 'Niacinamide', fungsi: 'Bahan Aktif (brightening)', persentase: 5.0 },
              { nama: 'Glycerin', fungsi: 'Humektan', persentase: 5.0 },
              { nama: 'Sodium Hyaluronate', fungsi: 'Humektan', persentase: 0.5 },
              { nama: 'Salicylic Acid', fungsi: 'Bahan Aktif (exfoliant)', persentase: 0.5 },
              { nama: 'Allantoin', fungsi: 'Soothing agent', persentase: 0.5 },
              { nama: 'Carbomer', fungsi: 'Pengental / Gelling Agent', persentase: 0.3 },
              { nama: 'Triethanolamine', fungsi: 'pH Adjuster', persentase: 0.2 },
              { nama: 'Phenoxyethanol', fungsi: 'Pengawet', persentase: 1.0 },
              { nama: 'Propanediol', fungsi: 'Pelarut / Kondisioner', persentase: 2.5 },
              { nama: 'Fragrance', fungsi: 'Pewangi', persentase: 0.5 },
            ],
          },
          {
            versionId: 'fv-002',
            versionLabel: 'v2',
            createdAt: '2026-09-10T09:00:00Z',
            catatan: 'pH disesuaikan ke 5.2, konsentrasi Salicylic Acid dinaikkan ke 0.8%',
            bahan: [
              { nama: 'Aqua (Water)', fungsi: 'Pelarut', persentase: 73.7 },
              { nama: 'Niacinamide', fungsi: 'Bahan Aktif (brightening)', persentase: 5.0 },
              { nama: 'Glycerin', fungsi: 'Humektan', persentase: 5.0 },
              { nama: 'Sodium Hyaluronate', fungsi: 'Humektan', persentase: 0.5 },
              { nama: 'Salicylic Acid', fungsi: 'Bahan Aktif (exfoliant)', persentase: 0.8 },
              { nama: 'Allantoin', fungsi: 'Soothing agent', persentase: 0.5 },
              { nama: 'Carbomer', fungsi: 'Pengental / Gelling Agent', persentase: 0.4 },
              { nama: 'Triethanolamine', fungsi: 'pH Adjuster', persentase: 0.3 },
              { nama: 'Phenoxyethanol', fungsi: 'Pengawet', persentase: 1.0 },
              { nama: 'Propanediol', fungsi: 'Pelarut / Kondisioner', persentase: 2.5 },
              { nama: 'Fragrance', fungsi: 'Pewangi', persentase: 0.3 },
            ],
          },
        ],
      },
      {
        formulaId: 'f-002',
        nama: 'Formula + Centella Asiatica',
        createdAt: '2026-09-12T11:00:00Z',
        updatedAt: '2026-09-12T11:00:00Z',
        activeVersionId: 'fv-003',
        versions: [
          {
            versionId: 'fv-003',
            versionLabel: 'v1',
            createdAt: '2026-09-12T11:00:00Z',
            catatan: 'Penambahan Centella Asiatica Extract untuk efek soothing',
            bahan: [
              { nama: 'Aqua (Water)', fungsi: 'Pelarut', persentase: 71.2 },
              { nama: 'Niacinamide', fungsi: 'Bahan Aktif (brightening)', persentase: 5.0 },
              { nama: 'Centella Asiatica Extract', fungsi: 'Bahan Aktif (soothing)', persentase: 2.0 },
              { nama: 'Glycerin', fungsi: 'Humektan', persentase: 5.0 },
              { nama: 'Sodium Hyaluronate', fungsi: 'Humektan', persentase: 1.0 },
              { nama: 'Salicylic Acid', fungsi: 'Bahan Aktif (exfoliant)', persentase: 0.8 },
              { nama: 'Allantoin', fungsi: 'Soothing agent', persentase: 0.5 },
              { nama: 'Panthenol', fungsi: 'Kondisioner / Soothing', persentase: 0.5 },
              { nama: 'Carbomer', fungsi: 'Pengental / Gelling Agent', persentase: 0.4 },
              { nama: 'Triethanolamine', fungsi: 'pH Adjuster', persentase: 0.3 },
              { nama: 'Phenoxyethanol', fungsi: 'Pengawet', persentase: 1.0 },
              { nama: 'Propanediol', fungsi: 'Pelarut / Kondisioner', persentase: 2.0 },
              { nama: 'Fragrance', fungsi: 'Pewangi', persentase: 0.3 },
            ],
          },
        ],
      },
    ],
    predictions: [
      {
        predictionId: 'pred-001',
        workspaceId: 'ws-001',
        formulaId: 'f-001',
        formulaVersionId: 'fv-001',
        formulaNama: 'Formula Basis Niacinamide',
        formulaVersionLabel: 'v1',
        status: 'done',
        createdAt: '2026-09-03T10:30:00Z',
        finishedAt: '2026-09-03T10:31:12Z',
        result: {
          skorStabilitas: 74,
          estimasiShelfLife: '18 bulan',
          tingkatKepercayaan: 82,
          kesesuaianQTPP: { ph: true, viskositas: false, penampilan: true, keamanan: true, stabilitas: false },
          ringkasan: 'Formula v1 menunjukkan stabilitas sedang. pH sudah sesuai target, namun viskositas di bawah rentang target QTPP. Perlu penambahan atau peningkatan konsentrasi gelling agent.',
          kompatibilitas: [
            { bahanA: 'Niacinamide', bahanB: 'Salicylic Acid', level: 'perhatian', catatan: 'Stabil pada pH 4.5–5.5, perlu monitoring perubahan warna' },
            { bahanA: 'Glycerin', bahanB: 'Sodium Hyaluronate', level: 'aman', catatan: 'Kompatibel, sinergis untuk hidrasi' },
            { bahanA: 'Carbomer', bahanB: 'Triethanolamine', level: 'aman', catatan: 'Reaksi netralisasi yang diinginkan, viskositas meningkat' },
            { bahanA: 'Phenoxyethanol', bahanB: 'Niacinamide', level: 'aman', catatan: 'Tidak ada interaksi yang dikhawatirkan' },
          ],
          rekomendasiAI: [
            'Naikkan konsentrasi Carbomer dari 0.3% menjadi 0.4–0.5% untuk mencapai target viskositas 300–800 cPs.',
            'Tambahkan Xanthan Gum 0.1% sebagai co-gelling agent untuk stabilitas tekstur jangka panjang.',
            'Pertimbangkan penambahan buffer sitrat 0.1% untuk menjaga pH tetap stabil selama penyimpanan.',
            'Uji akselerasi pada 40°C/75% RH minimal 4 minggu sebelum melanjutkan ke uji keamanan.',
          ],
        },
      },
      {
        predictionId: 'pred-002',
        workspaceId: 'ws-001',
        formulaId: 'f-001',
        formulaVersionId: 'fv-002',
        formulaNama: 'Formula Basis Niacinamide',
        formulaVersionLabel: 'v2',
        status: 'done',
        createdAt: '2026-09-10T11:00:00Z',
        finishedAt: '2026-09-10T11:01:05Z',
        result: {
          skorStabilitas: 87,
          estimasiShelfLife: '22 bulan',
          tingkatKepercayaan: 89,
          kesesuaianQTPP: { ph: true, viskositas: true, penampilan: true, keamanan: true, stabilitas: true },
          ringkasan: 'Formula v2 menunjukkan peningkatan signifikan. Semua parameter QTPP terpenuhi. Viskositas sekarang berada dalam rentang target. Skor stabilitas meningkat dari 74 ke 87.',
          kompatibilitas: [
            { bahanA: 'Niacinamide', bahanB: 'Salicylic Acid', level: 'perhatian', catatan: 'Stabil pada pH 5.2, monitoring tetap disarankan' },
            { bahanA: 'Glycerin', bahanB: 'Sodium Hyaluronate', level: 'aman', catatan: 'Kompatibel, sinergis untuk hidrasi' },
            { bahanA: 'Carbomer', bahanB: 'Triethanolamine', level: 'aman', catatan: 'Viskositas telah mencapai target setelah penyesuaian' },
          ],
          rekomendasiAI: [
            'Formula ini siap untuk dilanjutkan ke tahap uji keamanan (HRIPT, patch test).',
            'Pertimbangkan uji stabilitas foto (photostability) mengingat kandungan Salicylic Acid.',
            'Tambahkan antioksidan seperti Sodium Metabisulfite 0.05% untuk memperpanjang shelf life.',
          ],
        },
      },
      {
        predictionId: 'pred-003',
        workspaceId: 'ws-001',
        formulaId: 'f-002',
        formulaVersionId: 'fv-003',
        formulaNama: 'Formula + Centella Asiatica',
        formulaVersionLabel: 'v1',
        status: 'queue',
        createdAt: '2026-09-15T14:30:00Z',
      },
    ],
    safetyTests: [
      {
        safetyId: 'st-001',
        workspaceId: 'ws-001',
        predictionId: 'pred-002',
        formulaNama: 'Formula Basis Niacinamide',
        formulaVersionLabel: 'v2',
        status: 'selesai',
        createdAt: '2026-09-11T09:00:00Z',
        kesimpulanUmum: 'Produk dinyatakan aman untuk digunakan secara topikal. Tidak ada tanda iritasi primer maupun iritasi kumulatif yang ditemukan.',
        items: [
          {
            nama: 'Uji Iritasi Primer (Draize Test in silico)',
            metode: 'Prediksi komputasional berdasarkan QSAR model',
            hasil: 'Indeks Iritasi Primer (PII) = 0.2 (Tidak iritasi)',
            kesimpulan: 'aman',
          },
          {
            nama: 'HRIPT (Human Repeat Insult Patch Test) Simulasi',
            metode: 'Prediksi berdasarkan profil bahan dan literatur klinis',
            hasil: 'Potensi sensitisasi rendah (< 5%)',
            kesimpulan: 'aman',
          },
          {
            nama: 'Uji Toksisitas Akut (in silico)',
            metode: 'Derek Nexus QSAR prediction',
            hasil: 'LD50 prediksi > 5000 mg/kg (Kategori 5 GHS)',
            kesimpulan: 'aman',
          },
          {
            nama: 'Uji Kompatibilitas Kemasan',
            metode: 'Simulasi migrasi bahan dari kemasan polipropilen',
            hasil: 'Tidak ada migrasi bahan berbahaya yang terdeteksi',
            kesimpulan: 'aman',
          },
          {
            nama: 'Validasi Pengawet (Challenge Test Simulasi)',
            metode: 'Prediksi efektivitas Phenoxyethanol 1%',
            hasil: 'Memenuhi kriteria preservasi USP kategori 2',
            kesimpulan: 'aman',
          },
        ],
      },
    ],
  },
  {
    workspaceId: 'ws-002',
    nama: 'Moisturizer Kulit Kering',
    deskripsi: 'Krim pelembap intensif dengan ceramide dan hyaluronic acid untuk kulit kering dan sensitif.',
    createdAt: '2026-09-05T09:00:00Z',
    updatedAt: '2026-09-13T16:00:00Z',
    qtpp: {
      bentukSediaan: 'krim',
      rutePenggunaan: 'Topikal',
      penampilan: 'Krim putih homogen, emulsi O/W yang stabil',
      warna: 'Putih bersih',
      aroma: 'Tidak berbau atau sedikit aroma netral',
      phMin: 5.5,
      phMax: 6.5,
      viskositasMin: 30000,
      viskositasMax: 80000,
      viskositasUnit: 'cPs',
      ukuranPartikelMax: 500,
      stabilitasTarget: 'Stabil pada suhu kamar dan 40°C/75% RH, tidak memisah',
      bahanAktifTarget: 'Ceramide NP 1%, Hyaluronic Acid 1%, Niacinamide 4%',
      keamananTarget: 'Tidak menimbulkan iritasi, cocok untuk kulit sensitif',
      umurSimpan: '30 bulan',
    },
    formulas: [
      {
        formulaId: 'f-003',
        nama: 'Basis Krim O/W',
        createdAt: '2026-09-06T10:00:00Z',
        updatedAt: '2026-09-13T16:00:00Z',
        activeVersionId: 'fv-004',
        versions: [
          {
            versionId: 'fv-004',
            versionLabel: 'v1',
            createdAt: '2026-09-06T10:00:00Z',
            catatan: 'Formulasi krim dasar dengan basis emulsifier non-ionik',
            bahan: [
              { nama: 'Aqua (Water)', fungsi: 'Fase Air', persentase: 62.0 },
              { nama: 'Glycerin', fungsi: 'Humektan', persentase: 5.0 },
              { nama: 'Cetearyl Alcohol', fungsi: 'Emolien / Emulsifier pembantu', persentase: 3.0 },
              { nama: 'Ceteareth-20', fungsi: 'Emulsifier', persentase: 2.0 },
              { nama: 'Isopropyl Myristate', fungsi: 'Emolien', persentase: 3.0 },
              { nama: 'Dimethicone', fungsi: 'Emolien silikon', persentase: 2.0 },
              { nama: 'Shea Butter', fungsi: 'Emolien / Oklusif', persentase: 3.0 },
              { nama: 'Ceramide NP', fungsi: 'Bahan Aktif (barrier repair)', persentase: 1.0 },
              { nama: 'Sodium Hyaluronate', fungsi: 'Humektan', persentase: 1.0 },
              { nama: 'Niacinamide', fungsi: 'Bahan Aktif (brightening)', persentase: 4.0 },
              { nama: 'Panthenol', fungsi: 'Kondisioner', persentase: 0.5 },
              { nama: 'Allantoin', fungsi: 'Soothing agent', persentase: 0.3 },
              { nama: 'Phenoxyethanol', fungsi: 'Pengawet', persentase: 1.0 },
              { nama: 'Ethylhexylglycerin', fungsi: 'Pengawet pembantu', persentase: 0.3 },
              { nama: 'Citric Acid', fungsi: 'pH Adjuster', persentase: 0.2 },
              { nama: 'Tetrasodium EDTA', fungsi: 'Chelating Agent', persentase: 0.1 },
              { nama: 'Fragrance', fungsi: 'Pewangi', persentase: 0.3 },
              { nama: 'Aqua q.s.', fungsi: 'Pelarut tambahan', persentase: 11.3 },
            ],
          },
        ],
      },
    ],
    predictions: [
      {
        predictionId: 'pred-004',
        workspaceId: 'ws-002',
        formulaId: 'f-003',
        formulaVersionId: 'fv-004',
        formulaNama: 'Basis Krim O/W',
        formulaVersionLabel: 'v1',
        status: 'done',
        createdAt: '2026-09-07T10:00:00Z',
        finishedAt: '2026-09-07T10:02:18Z',
        result: {
          skorStabilitas: 91,
          estimasiShelfLife: '28 bulan',
          tingkatKepercayaan: 93,
          kesesuaianQTPP: { ph: true, viskositas: true, penampilan: true, keamanan: true, stabilitas: true },
          ringkasan: 'Formula krim O/W menunjukkan stabilitas sangat baik. Semua parameter QTPP terpenuhi. Emulsifikasi baik dengan ukuran droplet dalam rentang target.',
          kompatibilitas: [
            { bahanA: 'Ceramide NP', bahanB: 'Niacinamide', level: 'aman', catatan: 'Kombinasi yang sinergis untuk memperbaiki dan mencerahkan skin barrier' },
            { bahanA: 'Sodium Hyaluronate', bahanB: 'Glycerin', level: 'aman', catatan: 'Keduanya humektan, bekerja sinergis' },
            { bahanA: 'Cetearyl Alcohol', bahanB: 'Ceteareth-20', level: 'aman', catatan: 'Kombinasi emulsifier klasik yang stabil' },
          ],
          rekomendasiAI: [
            'Formula ini memiliki profil yang sangat baik untuk dilanjutkan ke uji keamanan.',
            'Pertimbangkan penambahan SPF component jika ingin memperluas klaim produk sebagai day cream.',
            'Uji stabilitas freeze-thaw (3 siklus) disarankan sebelum finalisasi kemasan.',
          ],
        },
      },
    ],
    safetyTests: [],
  },
]

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getWorkspaceById(id: string): Workspace | undefined {
  return DUMMY_WORKSPACES.find(ws => ws.workspaceId === id)
}

export function getActiveVersion(formula: Formula): FormulaVersion | undefined {
  return formula.versions.find(v => v.versionId === formula.activeVersionId)
}

export const DOSAGE_FORM_OPTIONS: DosageForm[] = [
  'krim', 'gel', 'serum', 'emulsi', 'lotion', 'cleanser', 'toner', 'masker', 'minyak',
]

export const INGREDIENT_FUNCTION_OPTIONS = [
  'Pelarut', 'Bahan Aktif', 'Humektan', 'Emolien', 'Oklusif', 'Emulsifier',
  'Pengental / Gelling Agent', 'Pengawet', 'pH Adjuster', 'Pewangi', 'Pewarna',
  'Chelating Agent', 'Antioksidan', 'Soothing agent', 'Kondisioner',
  'Surfaktan / Pembusa', 'Opacifier', 'Lainnya',
]

export const COMPAT_STYLE_LAB: Record<string, { dot: string; label: string; textCls: string; bgCls: string }> = {
  aman:      { dot: 'bg-success-500', label: 'Aman', textCls: 'text-success-700', bgCls: 'bg-success-100' },
  perhatian: { dot: 'bg-amber-500',   label: 'Perhatian', textCls: 'text-amber-600', bgCls: 'bg-amber-100' },
  hindari:   { dot: 'bg-danger-500',  label: 'Hindari', textCls: 'text-danger-600', bgCls: 'bg-danger-100' },
}

export const STABILITY_COLOR = (score: number) => {
  if (score >= 80) return { text: 'text-success-700', bg: 'bg-success-100', bar: 'bg-success-500' }
  if (score >= 60) return { text: 'text-amber-600', bg: 'bg-amber-100', bar: 'bg-amber-500' }
  return { text: 'text-danger-600', bg: 'bg-danger-100', bar: 'bg-danger-500' }
}
