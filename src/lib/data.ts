export const TABLE_ROWS = [
  { id: 'FM-2381', tanggal: '10 Sep 2026', bahan: 'Niacinamide 5% + Centella', stabilitas: 94, status: 'stable' },
  { id: 'FM-2382', tanggal: '10 Sep 2026', bahan: 'Retinol 0.3% + Squalane', stabilitas: 71, status: 'review' },
  { id: 'FM-2379', tanggal: '09 Sep 2026', bahan: 'Vitamin C 10% + Ferulic Acid', stabilitas: 58, status: 'processing' },
  { id: 'FM-2375', tanggal: '08 Sep 2026', bahan: 'AHA 7% + BHA 2%', stabilitas: 39, status: 'incompatible' },
  { id: 'FM-2371', tanggal: '07 Sep 2026', bahan: 'Ceramide NP + Panthenol', stabilitas: 97, status: 'done' },
]

export const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  stable:       { label: 'Stabil',            cls: 'bg-success-100 text-success-700' },
  review:       { label: 'Perlu review',       cls: 'bg-amber-100 text-amber-600' },
  processing:   { label: 'Diproses',           cls: 'bg-ocean-50 text-ocean-600' },
  incompatible: { label: 'Tidak kompatibel',   cls: 'bg-danger-100 text-danger-600' },
  done:         { label: 'Selesai',            cls: 'bg-slate2 text-ink/60' },
}

export const FORMULA_INGREDIENTS = [
  { name: 'Aqua', pct: 62, tone: 'neutral' },
  { name: 'Niacinamide', pct: 5, tone: 'ocean' },
  { name: 'Glycerin', pct: 8, tone: 'sky' },
  { name: 'Centella Asiatica Extract', pct: 3, tone: 'ocean' },
  { name: 'Sodium Hyaluronate', pct: 1.2, tone: 'sky' },
  { name: 'Sisa bahan lainnya', pct: 20.8, tone: 'neutral' },
]

export const EPOCH_BARS = [38, 52, 61, 74, 79, 86, 90, 92]

export const COMPAT_ROWS = [
  { a: 'Niacinamide', b: 'Vitamin C (L-AA)', level: 'review', note: 'Stabil pada pH terbuffer, perlu uji lanjutan' },
  { a: 'Retinol', b: 'AHA/BHA', level: 'avoid', note: 'Berisiko iritasi, hindari kombinasi langsung' },
  { a: 'Centella Asiatica', b: 'Ceramide NP', level: 'safe', note: 'Kompatibel, mendukung barrier kulit' },
  { a: 'Sodium Hyaluronate', b: 'Glycerin', level: 'safe', note: 'Kompatibel, sinergis untuk hidrasi' },
]

export const COMPAT_STYLE: Record<string, { dot: string; label: string; text: string }> = {
  safe:   { dot: 'bg-success-500', label: 'Kompatibel',       text: 'text-success-700' },
  review: { dot: 'bg-amber-500',   label: 'Perlu tinjauan',   text: 'text-amber-600' },
  avoid:  { dot: 'bg-danger-500',  label: 'Tidak disarankan', text: 'text-danger-600' },
}

export const SIDEBAR_ITEMS = [
  { label: 'Ringkasan',          active: false },
  { label: 'Formulasi',          active: true },
  { label: 'Prediksi AI',        active: false },
  { label: 'Bahan Aktif',        active: false },
  { label: 'Riwayat Eksperimen', active: false },
  { label: 'Laporan',            active: false },
  { label: 'Laboratorium',       active: false}
]

export const FEATURES = [
  { icon: '⚡', title: 'Prediksi Instan', desc: 'Hasil prediksi stabilitas formulasi dalam hitungan detik, bukan minggu.' },
  { icon: '🧪', title: 'Validasi BPOM', desc: 'Cek otomatis batas regulasi BPOM untuk setiap bahan dalam formulasi.' },
  { icon: '🔬', title: 'Analisis Kompatibilitas', desc: 'Deteksi otomatis potensi konflik antar bahan aktif sebelum eksperimen.' },
  { icon: '📊', title: 'Laporan Eksperimen', desc: 'Ekspor laporan lengkap formulasi, prediksi, dan catatan tim peneliti.' },
]

export const BENEFITS = [
  { icon: '⚡', title: 'Prediksi Instan', desc: 'Prediksi stabilitas langsung terlihat saat bahan ditambahkan.' },
  { icon: '✅', title: 'Validasi BPOM', desc: 'Cek regulasi BPOM berjalan otomatis di latar belakang.' },
  { icon: '🔄', title: 'Manajemen Batch', desc: 'Pantau semua eksperimen aktif dalam satu tampilan terpusat.' },
  { icon: '🧠', title: 'Insight AI', desc: 'Model terus belajar dari data eksperimen untuk akurasi lebih tinggi.' },
]

export const HOW_IT_WORKS = [
  { step: 1, title: 'Masukkan Komposisi', desc: 'Input nama bahan aktif, konsentrasi, dan jenis basis produk ke dalam form formulasi.' },
  { step: 2, title: 'Jalankan Prediksi AI', desc: 'Model AI menganalisis kombinasi bahan dan memprediksi stabilitas, risiko iritasi, serta estimasi shelf life.' },
  { step: 3, title: 'Tinjau & Validasi', desc: 'Tim QA meninjau hasil prediksi dan memvalidasi terhadap regulasi BPOM secara otomatis.' },
  { step: 4, title: 'Ekspor Laporan', desc: 'Unduh laporan lengkap dalam format PDF atau ekspor data ke spreadsheet tim.' },
]

export const TESTIMONIALS = [
  { name: 'Dr. Amira Yasmin', role: 'Kepala Riset Formulasi', quote: 'Synthera memangkas waktu validasi formulasi kami dari 3 minggu menjadi 2 hari. Akurasi prediksinya konsisten di atas 90%.', seed: 'team-amira' },
  { name: 'Raka Pratama', role: 'Data Scientist', quote: 'Dashboard prediksi AI-nya intuitif. Saya bisa membandingkan ratusan kombinasi bahan aktif tanpa harus membuka spreadsheet sama sekali.', seed: 'team-raka' },
  { name: 'Salma Nur Fadhila', role: 'Formulator Senior', quote: 'Fitur validasi BPOM otomatis sangat membantu. Tidak perlu lagi cek manual satu per satu, langsung dapat flag kalau ada yang melebihi batas.', seed: 'team-salma' },
]

export const FAQ_ITEMS = [
  { q: 'Apa itu Synthera?', a: 'Synthera adalah platform AI untuk mempercepat riset dan prediksi formulasi produk kosmetik. Tim formulator bisa memasukkan komposisi bahan, lalu AI memprediksi stabilitas, kompatibilitas, dan estimasi shelf life dalam hitungan detik.' },
  { q: 'Bagaimana model prediksi bekerja?', a: 'Model kami dilatih menggunakan ribuan data eksperimen formulasi nyata. Saat kamu memasukkan kombinasi bahan aktif, model menghitung potensi interaksi kimia dan memberikan skor stabilitas beserta tingkat keyakinan.' },
  { q: 'Apakah Synthera mendukung validasi BPOM?', a: 'Ya. Synthera secara otomatis membandingkan setiap bahan dengan basis data regulasi BPOM terkini. Jika ada bahan yang mendekati atau melampaui batas, sistem langsung memberikan peringatan.' },
  { q: 'Berapa akurasi model prediksi saat ini?', a: 'Model versi 2.4 mencapai akurasi 92,4% berdasarkan validasi silang dengan 500 formulasi uji. Akurasi terus meningkat seiring bertambahnya data eksperimen baru.' },
  { q: 'Apakah data formulasi kami aman?', a: 'Semua data formulasi dienkripsi saat transit maupun saat tersimpan. Akses data dikontrol ketat berdasarkan peran pengguna — hanya anggota tim yang diberi izin yang dapat melihat formulasi tersebut.' },
  { q: 'Bisakah saya mengekspor hasil prediksi?', a: 'Ya. Setiap prediksi dan laporan eksperimen bisa diekspor dalam format PDF atau CSV langsung dari dashboard.' },
]

export const STATS = [
  { value: '1.248+', label: 'Formulasi Diuji', hint: '+64 minggu ini' },
  { value: '92,4%', label: 'Akurasi Model', hint: 'Naik 1,1% dari v2.3' },
  { value: '4,2x', label: 'Lebih Cepat', hint: 'Dibanding proses manual' },
  { value: '5+', label: 'Bahan Aktif', hint: 'Didukung penuh' },
]
