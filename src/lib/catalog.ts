import type { HeadId } from './api-types'

/** The six wizard steps, in the order the stepper shows them. */
export const STEPS = [
  'Tipe Produk',
  'Spesifikasi Produk',
  'Input Formulasi',
  'Analisis Formulasi',
  'Kontribusi Bahan',
  'Optimasi',
] as const

export type ProductTypeId =
  | 'moisturizer'
  | 'shampoo'
  | 'facewash'
  | 'powder'
  | 'foundation'
  | 'serum'
  | 'bodywash'
  | 'sunscreen'
  | 'scrub'

export interface Qtpp {
  bentuk: string
  rute: string
  warna: string
  viskositas: string
  ph: string
  stabilitas: string
  ukuranPartikel: string
  bahanAktif: string
  keamanan: string
  aroma: string
}

export interface ProductType {
  id: ProductTypeId
  label: string
  sub: string
  image: string
  /** Value the endpoint expects in `product_type`. */
  apiType: string
  /** Heads worth running for this dosage form; the first is the headline score. */
  heads: HeadId[]
  forms: string[]
  qtpp: Partial<Qtpp>
}

export const PRODUCT_TYPES: ProductType[] = [
  {
    id: 'moisturizer',
    label: 'Pelembab / Moisturizer',
    sub: '(Krim, Gel-Cream, Lotion)',
    image: '/figma/type-moisturizer.png',
    apiType: 'face_leave_on',
    heads: ['H1', 'H2', 'H4'],
    forms: ['Krim', 'Gel-Cream', 'Lotion'],
    qtpp: { bentuk: 'Krim / gel-cream / lotion', warna: 'Cairan jernih, berwarna kuning pucat', viskositas: '1.000-2.000 cPs', ph: '5.5-6.5', stabilitas: '1 tahun' },
  },
  {
    id: 'shampoo',
    label: 'Sampo',
    sub: '(Cair (Liquid), Gel, Solid (Bar))',
    image: '/figma/type-shampoo.png',
    apiType: 'rinse_off',
    heads: ['H1', 'H2', 'H6'],
    forms: ['Cair (Liquid)', 'Gel', 'Solid (Bar)'],
    qtpp: { bentuk: 'Cairan kental (sampo)', warna: 'Cairan kental homogen, transparan', viskositas: '3.000-6.000 cPs', ph: '5.0-6.5', stabilitas: '2 tahun' },
  },
  {
    id: 'facewash',
    label: 'Pembersih Wajah',
    sub: '(Gel, Foam, Cream, Liquid)',
    image: '/figma/type-facewash.png',
    apiType: 'rinse_off',
    heads: ['H1', 'H2', 'H6'],
    forms: ['Gel', 'Foam', 'Cream', 'Liquid'],
    qtpp: { bentuk: 'Gel pembersih', warna: 'Gel transparan homogen', viskositas: '2.000-5.000 cPs', ph: '5.0-6.0', stabilitas: '2 tahun' },
  },
  {
    id: 'powder',
    label: 'Loose Powder',
    sub: '(Powders: Silica-based, Starch-based, Talc-based)',
    image: '/figma/type-powder.png',
    apiType: 'face_leave_on',
    heads: ['H5'],
    forms: ['Silica-based', 'Starch-based', 'Talc-based'],
    qtpp: { bentuk: 'Serbuk tabur', warna: 'Serbuk halus homogen, translucent', viskositas: '- (serbuk)', ph: '- (anhidrat)', stabilitas: '2 tahun', ukuranPartikel: '5-20 mikrometer' },
  },
  {
    id: 'foundation',
    label: 'Foundation',
    sub: '(Liquid, Cream, Powder, Cushion)',
    image: '/figma/type-foundation.png',
    apiType: 'face_leave_on',
    heads: ['H1', 'H2', 'H5'],
    forms: ['Liquid', 'Cream', 'Powder', 'Cushion'],
    qtpp: { bentuk: 'Emulsi pigmen (liquid / cream)', warna: 'Emulsi opak homogen sesuai shade', viskositas: '8.000-20.000 cPs', ph: '6.0-7.0', stabilitas: '2 tahun', ukuranPartikel: 'Pigmen < 10 mikrometer' },
  },
  {
    id: 'serum',
    label: 'Serum Wajah',
    sub: '(Water-based, Oil-based, Emulsion-based)',
    image: '/figma/type-serum.png',
    apiType: 'face_leave_on',
    heads: ['H1', 'H2'],
    forms: ['Water-based', 'Oil-based', 'Emulsion-based'],
    qtpp: { bentuk: 'Serum', warna: 'Cairan jernih, tidak berwarna', viskositas: '500-1.500 cPs', ph: '5.0-6.0', stabilitas: '1 tahun' },
  },
  {
    id: 'bodywash',
    label: 'Body Wash',
    sub: '(Liquid Gel, Cream Soap, Bar Soap)',
    image: '/figma/type-bodywash.png',
    apiType: 'rinse_off',
    heads: ['H1', 'H2', 'H6'],
    forms: ['Liquid Gel', 'Cream Soap', 'Bar Soap'],
    qtpp: { bentuk: 'Cairan kental (body wash)', warna: 'Cairan kental, transparan hingga opak', viskositas: '4.000-8.000 cPs', ph: '5.5-6.5', stabilitas: '2 tahun' },
  },
  {
    id: 'sunscreen',
    label: 'Sunscreen',
    sub: '(Lotion, Cream, Gel, Stick, Spray)',
    image: '/figma/type-sunscreen.png',
    apiType: 'face_leave_on',
    heads: ['H3', 'H1', 'H2'],
    forms: ['Lotion', 'Cream', 'Gel', 'Stick', 'Spray'],
    qtpp: { bentuk: 'Losion / krim tabir surya', warna: 'Krim putih homogen', viskositas: '5.000-15.000 cPs', ph: '5.5-7.0', stabilitas: '2 tahun', bahanAktif: 'Filter UV, target SPF 30 / PA+++' },
  },
  {
    id: 'scrub',
    label: 'Body Scrub',
    sub: '(Krim, Gel, Paste)',
    image: '/figma/type-scrub.png',
    apiType: 'rinse_off',
    heads: ['H1', 'H2'],
    forms: ['Krim', 'Gel', 'Paste'],
    qtpp: { bentuk: 'Krim / gel scrub', warna: 'Krim opak dengan partikel scrub', viskositas: '15.000-30.000 cPs', ph: '5.5-6.5', stabilitas: '1 tahun', ukuranPartikel: '200-500 mikrometer (partikel scrub)' },
  },
]

export const productType = (id: ProductTypeId | string | undefined) =>
  PRODUCT_TYPES.find((p) => p.id === id) ?? PRODUCT_TYPES[0]

export const EMPTY_QTPP: Qtpp = {
  bentuk: '',
  rute: 'Topikal',
  warna: '',
  viskositas: '',
  ph: '',
  stabilitas: '',
  ukuranPartikel: '',
  bahanAktif: '',
  keamanan: 'Tidak menimbulkan iritasi primer maupun sensitisasi',
  aroma: '',
}

/** QTPP fields as the pharmacist listed them; the first four match the Figma card. */
export const QTPP_FIELDS: Array<{ key: keyof Qtpp; label: string; hint: string; group: 'utama' | 'tambahan' }> = [
  { key: 'warna', label: 'Warna:', hint: 'Penampilan / organoleptis: warna, kejernihan, homogenitas', group: 'utama' },
  { key: 'viskositas', label: 'Kekentalan (Viskositas):', hint: 'Rentang target dalam cPs pada 25 °C', group: 'utama' },
  { key: 'ph', label: 'Derajat Keasaman (pH):', hint: 'Sesuaikan dengan area aplikasi (wajah ± 5,5, kulit kepala 5,0-6,5)', group: 'utama' },
  { key: 'stabilitas', label: 'Stabilitas & Masa Simpan:', hint: 'Umur simpan target dan kondisi uji (mis. 40 °C/75% RH, 6 bulan)', group: 'utama' },
  { key: 'bentuk', label: 'Bentuk Sediaan:', hint: 'Krim, gel, serum, emulsi, lotion, cleanser', group: 'tambahan' },
  { key: 'rute', label: 'Rute Penggunaan:', hint: 'Topikal', group: 'tambahan' },
  { key: 'aroma', label: 'Aroma:', hint: 'Tidak berbau / wangi ringan / tanpa parfum', group: 'tambahan' },
  { key: 'ukuranPartikel', label: 'Ukuran Partikel:', hint: 'Droplet emulsi (mis. 0,1-1 µm) atau partikel serbuk', group: 'tambahan' },
  { key: 'bahanAktif', label: 'Kandungan Bahan Aktif:', hint: 'Nama dan kadar target, mis. Niacinamide 5%', group: 'tambahan' },
  { key: 'keamanan', label: 'Target Keamanan:', hint: 'Iritasi, sensitisasi, kompatibilitas kulit sensitif', group: 'tambahan' },
]

export const HEAD_LABEL: Record<HeadId, string> = {
  H1: 'Stabilitas emulsi',
  H2: 'Viskositas (10 s⁻¹)',
  H3: 'SPF tabir surya',
  H4: 'Tekstur sensorik',
  H5: 'Keluarga produk',
  H6: 'CMC & HLB surfaktan',
  H7: 'Penemuan bahan (transkriptomik)',
  H8: 'Efikasi bahan alam / jamu',
  H9: 'Masalah kulit dari gambar',
  H10: 'Warna kulit (ITA)',
  H11: 'Mikrostruktur emulsi',
  H12: 'Ekstraksi tabel formulasi',
  H13: 'Latih di tempat',
}

/** Skin type narratives shown in "Laporan Kulit". The Oily text is the Figma copy. */
export const SKIN_TYPES: Record<string, { title: string; text: string }> = {
  oily: {
    title: 'Oily',
    text: 'Jenis kulit yang ditandai dengan produksi sebum (minyak alami) berlebih oleh kelenjar sebasea, sehingga membuat permukaan wajah tampak mengkilap, terasa lengket, dan lebih rentan terhadap pori-pori tersumbat serta jerawat.',
  },
  dry: {
    title: 'Dry',
    text: 'Jenis kulit dengan produksi sebum rendah dan fungsi sawar kulit yang lemah, sehingga terasa kering, kasar, mudah mengelupas, dan cepat kehilangan air (TEWL tinggi).',
  },
  sensitive: {
    title: 'Sensitive',
    text: 'Kulit yang mudah bereaksi terhadap rangsangan luar: kemerahan, perih, atau gatal. Membutuhkan formula bebas alkohol dan parfum dengan pH mendekati fisiologis.',
  },
  normal: {
    title: 'Normal / Kombinasi',
    text: 'Produksi sebum seimbang, tekstur halus dengan pori yang tidak menonjol. Area T dapat sedikit lebih berminyak dibanding pipi.',
  },
}
