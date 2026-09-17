/**
 * Seed script — isi Supabase dengan data dummy dari lab-data.ts
 *
 * Jalankan SETELAH schema.sql dieksekusi di Supabase SQL editor:
 *   npx tsx scripts/seed.ts
 *
 * Butuh: npm install -D tsx (atau sudah ada)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ogqaxlrmmrrokqvxanam.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncWF4bHJtbXJyb2txdnhhbmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDg5MjgsImV4cCI6MjEwNDcyNDkyOH0.o_cP-MO-oyrZiYapyFQjQJZDcXeqX2U3ex9vIKz8dO8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ---------------------------------------------------------------------------
// Data seed
// ---------------------------------------------------------------------------

const WORKSPACES_SEED = [
  {
    nama: 'Serum Anti Jerawat',
    deskripsi: 'Formulasi serum topikal dengan niacinamide dan salicylic acid untuk kulit berjerawat.',
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
        nama: 'Formula Basis Niacinamide v1',
        catatan: 'Draft awal, belum dioptimasi pH',
        bahan: [
          { nama: 'Aqua (Water)',       fungsi: 'Pelarut',                    persentase: 74.5 },
          { nama: 'Niacinamide',        fungsi: 'Bahan Aktif (brightening)',  persentase: 5.0 },
          { nama: 'Glycerin',           fungsi: 'Humektan',                   persentase: 5.0 },
          { nama: 'Sodium Hyaluronate', fungsi: 'Humektan',                   persentase: 0.5 },
          { nama: 'Salicylic Acid',     fungsi: 'Bahan Aktif (exfoliant)',    persentase: 0.5 },
          { nama: 'Allantoin',          fungsi: 'Soothing agent',             persentase: 0.5 },
          { nama: 'Carbomer',           fungsi: 'Pengental / Gelling Agent',  persentase: 0.3 },
          { nama: 'Triethanolamine',    fungsi: 'pH Adjuster',                persentase: 0.2 },
          { nama: 'Phenoxyethanol',     fungsi: 'Pengawet',                   persentase: 1.0 },
          { nama: 'Propanediol',        fungsi: 'Pelarut / Kondisioner',      persentase: 2.5 },
          { nama: 'Fragrance',          fungsi: 'Pewangi',                    persentase: 0.5 },
        ],
        prediction: {
          skorStabilitas: 74,
          estimasiShelfLife: '18 bulan',
          tingkatKepercayaan: 82,
          kesesuaianQTPP: { ph: true, viskositas: false, penampilan: true, keamanan: true, stabilitas: false },
          ringkasan: 'Formula v1 menunjukkan stabilitas sedang. pH sesuai target, namun viskositas di bawah rentang QTPP.',
          kompatibilitas: [
            { bahanA: 'Niacinamide', bahanB: 'Salicylic Acid', level: 'perhatian', catatan: 'Stabil pada pH 4.5–5.5, perlu monitoring perubahan warna' },
            { bahanA: 'Glycerin', bahanB: 'Sodium Hyaluronate', level: 'aman', catatan: 'Kompatibel, sinergis untuk hidrasi' },
            { bahanA: 'Carbomer', bahanB: 'Triethanolamine', level: 'aman', catatan: 'Reaksi netralisasi yang diinginkan' },
          ],
          rekomendasiAI: [
            'Naikkan konsentrasi Carbomer dari 0.3% menjadi 0.4–0.5% untuk mencapai target viskositas.',
            'Tambahkan Xanthan Gum 0.1% sebagai co-gelling agent untuk stabilitas tekstur jangka panjang.',
            'Uji akselerasi pada 40°C/75% RH minimal 4 minggu sebelum uji keamanan.',
          ],
        },
      },
      {
        nama: 'Formula Basis Niacinamide v2',
        catatan: 'pH disesuaikan ke 5.2, konsentrasi Salicylic Acid dinaikkan ke 0.8%',
        bahan: [
          { nama: 'Aqua (Water)',       fungsi: 'Pelarut',                    persentase: 73.7 },
          { nama: 'Niacinamide',        fungsi: 'Bahan Aktif (brightening)',  persentase: 5.0 },
          { nama: 'Glycerin',           fungsi: 'Humektan',                   persentase: 5.0 },
          { nama: 'Sodium Hyaluronate', fungsi: 'Humektan',                   persentase: 0.5 },
          { nama: 'Salicylic Acid',     fungsi: 'Bahan Aktif (exfoliant)',    persentase: 0.8 },
          { nama: 'Allantoin',          fungsi: 'Soothing agent',             persentase: 0.5 },
          { nama: 'Carbomer',           fungsi: 'Pengental / Gelling Agent',  persentase: 0.4 },
          { nama: 'Triethanolamine',    fungsi: 'pH Adjuster',                persentase: 0.3 },
          { nama: 'Phenoxyethanol',     fungsi: 'Pengawet',                   persentase: 1.0 },
          { nama: 'Propanediol',        fungsi: 'Pelarut / Kondisioner',      persentase: 2.5 },
          { nama: 'Fragrance',          fungsi: 'Pewangi',                    persentase: 0.3 },
        ],
        prediction: {
          skorStabilitas: 87,
          estimasiShelfLife: '22 bulan',
          tingkatKepercayaan: 89,
          kesesuaianQTPP: { ph: true, viskositas: true, penampilan: true, keamanan: true, stabilitas: true },
          ringkasan: 'Formula v2 menunjukkan peningkatan signifikan. Semua parameter QTPP terpenuhi.',
          kompatibilitas: [
            { bahanA: 'Niacinamide', bahanB: 'Salicylic Acid', level: 'perhatian', catatan: 'Stabil pada pH 5.2, monitoring tetap disarankan' },
            { bahanA: 'Glycerin', bahanB: 'Sodium Hyaluronate', level: 'aman', catatan: 'Kompatibel, sinergis untuk hidrasi' },
            { bahanA: 'Carbomer', bahanB: 'Triethanolamine', level: 'aman', catatan: 'Viskositas telah mencapai target setelah penyesuaian' },
          ],
          rekomendasiAI: [
            'Formula ini siap untuk dilanjutkan ke tahap uji keamanan (HRIPT, patch test).',
            'Pertimbangkan uji stabilitas foto mengingat kandungan Salicylic Acid.',
            'Tambahkan antioksidan seperti Sodium Metabisulfite 0.05% untuk memperpanjang shelf life.',
          ],
        },
        safetyTest: {
          status: 'selesai' as const,
          kesimpulan_umum: 'Produk dinyatakan aman untuk digunakan secara topikal. Tidak ada tanda iritasi primer maupun kumulatif.',
          items: [
            { nama: 'Uji Iritasi Primer (in silico)', metode: 'QSAR model', hasil: 'PII = 0.2 (Tidak iritasi)', kesimpulan: 'aman' as const },
            { nama: 'HRIPT Simulasi', metode: 'Profil bahan + literatur klinis', hasil: 'Potensi sensitisasi rendah (< 5%)', kesimpulan: 'aman' as const },
            { nama: 'Uji Toksisitas Akut (in silico)', metode: 'Derek Nexus QSAR', hasil: 'LD50 prediksi > 5000 mg/kg (GHS Kategori 5)', kesimpulan: 'aman' as const },
            { nama: 'Uji Kompatibilitas Kemasan', metode: 'Simulasi migrasi polipropilen', hasil: 'Tidak ada migrasi bahan berbahaya', kesimpulan: 'aman' as const },
            { nama: 'Validasi Pengawet (Challenge Test)', metode: 'Prediksi efektivitas Phenoxyethanol 1%', hasil: 'Memenuhi kriteria USP kategori 2', kesimpulan: 'aman' as const },
          ],
        },
      },
    ],
  },
  {
    nama: 'Moisturizer Kulit Kering',
    deskripsi: 'Krim pelembap intensif dengan ceramide dan hyaluronic acid untuk kulit kering dan sensitif.',
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
        nama: 'Basis Krim O/W v1',
        catatan: 'Formulasi krim dasar dengan basis emulsifier non-ionik',
        bahan: [
          { nama: 'Aqua (Water)',          fungsi: 'Fase Air',                     persentase: 62.0 },
          { nama: 'Glycerin',              fungsi: 'Humektan',                     persentase: 5.0 },
          { nama: 'Cetearyl Alcohol',      fungsi: 'Emolien / Emulsifier pembantu', persentase: 3.0 },
          { nama: 'Ceteareth-20',          fungsi: 'Emulsifier',                   persentase: 2.0 },
          { nama: 'Isopropyl Myristate',   fungsi: 'Emolien',                      persentase: 3.0 },
          { nama: 'Dimethicone',           fungsi: 'Emolien silikon',              persentase: 2.0 },
          { nama: 'Shea Butter',           fungsi: 'Emolien / Oklusif',            persentase: 3.0 },
          { nama: 'Ceramide NP',           fungsi: 'Bahan Aktif (barrier repair)', persentase: 1.0 },
          { nama: 'Sodium Hyaluronate',    fungsi: 'Humektan',                     persentase: 1.0 },
          { nama: 'Niacinamide',           fungsi: 'Bahan Aktif (brightening)',    persentase: 4.0 },
          { nama: 'Panthenol',             fungsi: 'Kondisioner',                  persentase: 0.5 },
          { nama: 'Allantoin',             fungsi: 'Soothing agent',               persentase: 0.3 },
          { nama: 'Phenoxyethanol',        fungsi: 'Pengawet',                     persentase: 1.0 },
          { nama: 'Ethylhexylglycerin',    fungsi: 'Pengawet pembantu',            persentase: 0.3 },
          { nama: 'Citric Acid',           fungsi: 'pH Adjuster',                  persentase: 0.2 },
          { nama: 'Tetrasodium EDTA',      fungsi: 'Chelating Agent',              persentase: 0.1 },
          { nama: 'Fragrance',             fungsi: 'Pewangi',                      persentase: 0.3 },
          { nama: 'Aqua q.s.',             fungsi: 'Pelarut tambahan',             persentase: 11.3 },
        ],
        prediction: {
          skorStabilitas: 91,
          estimasiShelfLife: '28 bulan',
          tingkatKepercayaan: 93,
          kesesuaianQTPP: { ph: true, viskositas: true, penampilan: true, keamanan: true, stabilitas: true },
          ringkasan: 'Formula krim O/W menunjukkan stabilitas sangat baik. Semua parameter QTPP terpenuhi.',
          kompatibilitas: [
            { bahanA: 'Ceramide NP', bahanB: 'Niacinamide', level: 'aman', catatan: 'Kombinasi sinergis untuk memperbaiki dan mencerahkan skin barrier' },
            { bahanA: 'Sodium Hyaluronate', bahanB: 'Glycerin', level: 'aman', catatan: 'Kedua humektan bekerja sinergis' },
            { bahanA: 'Cetearyl Alcohol', bahanB: 'Ceteareth-20', level: 'aman', catatan: 'Kombinasi emulsifier klasik yang stabil' },
          ],
          rekomendasiAI: [
            'Formula ini memiliki profil yang sangat baik untuk dilanjutkan ke uji keamanan.',
            'Pertimbangkan penambahan SPF component jika ingin memperluas klaim sebagai day cream.',
            'Uji stabilitas freeze-thaw (3 siklus) disarankan sebelum finalisasi kemasan.',
          ],
        },
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

async function seed() {
  console.log('🌱 Mulai seeding Supabase...\n')

  for (const wsData of WORKSPACES_SEED) {
    // 1. Buat workspace
    const { data: ws, error: wsErr } = await supabase
      .from('workspaces')
      .insert({ nama: wsData.nama, deskripsi: wsData.deskripsi, qtpp: wsData.qtpp })
      .select()
      .single()

    if (wsErr || !ws) {
      console.error(`❌ Gagal buat workspace "${wsData.nama}":`, wsErr?.message)
      continue
    }
    console.log(`✅ Workspace: ${ws.nama} (${ws.id})`)

    for (const fData of wsData.formulas) {
      // 2. Buat formula
      const { data: formula, error: fErr } = await supabase
        .from('formulas')
        .insert({ workspace_id: ws.id, nama: fData.nama, bahan: fData.bahan, catatan: fData.catatan })
        .select()
        .single()

      if (fErr || !formula) {
        console.error(`  ❌ Gagal buat formula "${fData.nama}":`, fErr?.message)
        continue
      }
      console.log(`  📋 Formula: ${formula.nama} (${formula.id})`)

      // 3. Buat prediction selesai
      const { data: pred, error: pErr } = await supabase
        .from('predictions')
        .insert({
          workspace_id: ws.id,
          formula_id: formula.id,
          formula_nama: formula.nama,
          status: 'done',
          raw_response: { seeded: true },
          result: fData.prediction,
          finished_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (pErr || !pred) {
        console.error(`  ❌ Gagal buat prediction:`, pErr?.message)
        continue
      }
      console.log(`  🔮 Prediction: selesai, skor=${fData.prediction.skorStabilitas}`)

      // 4. Buat safety test kalau ada
      if ('safetyTest' in fData && fData.safetyTest) {
        const { error: stErr } = await supabase
          .from('safety_tests')
          .insert({
            workspace_id: ws.id,
            prediction_id: pred.id,
            formula_nama: formula.nama,
            status: fData.safetyTest.status,
            items: fData.safetyTest.items,
            kesimpulan_umum: fData.safetyTest.kesimpulan_umum,
          })

        if (stErr) {
          console.error(`  ❌ Gagal buat safety test:`, stErr.message)
        } else {
          console.log(`  🛡️ Safety test: ${fData.safetyTest.status}`)
        }
      }
    }

    console.log('')
  }

  console.log('✅ Seeding selesai!')
}

seed().catch(console.error)
