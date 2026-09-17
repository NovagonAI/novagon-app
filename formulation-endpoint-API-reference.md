# Formulation Endpoint — API Reference Lengkap

> Disusun 17 September 2026 dari hasil investigasi langsung terhadap `app.py` (formulation-endpoint) dan `src/formulation/` (formulation-core) di instance Cloudeka. Dokumen ini mencakup **semua** endpoint yang ditemukan di kode, termasuk yang belum pernah dites atau diketahui belum berfungsi — status tiap endpoint ditandai eksplisit, bukan diasumsikan baik.

---

## 0. Akses & Keamanan

### Base URL saat ini (sementara, lewat Cloudflare Tunnel)
```
https://minolta-bargains-shakespeare-gear.trycloudflare.com
```

**⚠️ Catatan penting soal URL ini:**
- Dibuat lewat `cloudflared tunnel --url http://localhost:8000` tanpa akun Cloudflare — "quick tunnel", tidak ada jaminan uptime.
- URL **acak dan berubah** setiap kali proses `cloudflared` direstart. Kalau instance Cloudeka restart, logout, atau proses `cloudflared`/`uvicorn` di-kill, URL ini mati dan tidak bisa dipakai lagi — perlu dijalankan ulang untuk dapat URL baru.
- Proses berjalan di background lewat `nohup ... &` di terminal Cloudeka. Cek status dengan `jobs -l`.
- Bukan solusi permanen/produksi. Untuk deploy permanen, lihat bagian 8 (To-Do).

### Autentikasi
```json
"auth": "off"
```
**Endpoint ini TIDAK punya autentikasi sama sekali.** Siapa pun yang punya URL bisa memanggil semua endpoint, termasuk `/v1/train` yang bisa memicu training ulang model. Jangan sebar URL ini secara publik/luas — hanya untuk demo terbatas dengan pengawasan.

### CORS
```json
"cors": "*"
```
Semua origin diizinkan.

### Rate limit
```json
"daily_quota": null
```
Tidak ada kuota harian yang di-set saat ini.

---

## 1. `GET /v1/health`

**Status: ✅ Teruji, berfungsi.**

Cek status server. Tidak butuh parameter.

### Contoh response
```json
{
  "status": "ok",
  "endpoint_build": "2026-09-17T09:52:22+00:00",
  "core_tag": "d90b3c4",
  "artifact_release_tag": "artifacts-v1.20260917",
  "registry_version": "reg-2026.09.13-v1",
  "resident_head": "H6",
  "uptime_s": 875.899,
  "cors": "*",
  "auth": "off",
  "daily_quota": null
}
```

### Penjelasan field
| Field | Arti |
|---|---|
| `status` | `"ok"` kalau server hidup |
| `endpoint_build` | Timestamp build endpoint saat ini |
| `core_tag` | Commit hash `formulation-core` yang dipakai (dibaca via `git`, di-cache) |
| `artifact_release_tag` | Tag rilis artifact model yang sedang diserve |
| `registry_version` | Versi registry ingredient yang dipakai |
| `resident_head` | Head yang terakhir/sedang di-load di memori (bisa `null`) |
| `uptime_s` | Berapa detik server sudah hidup sejak start |
| `cors` | Kebijakan CORS aktif |
| `auth` | Status autentikasi (`"off"` = tidak ada) |
| `daily_quota` | Batas request harian, `null` = tidak ada |

---

## 2. `GET /v1/heads`

**Status: ✅ Diketahui berfungsi (dipakai untuk audit gate di sesi-sesi sebelumnya), belum dites ulang lewat tunnel di sesi ini.**

Daftar semua 13 head beserta status gate-nya. Berguna untuk melihat sekilas semua model tanpa perlu buka `manifest.json` satu-satu.

**⚠️ Bug diketahui (belum diperbaiki):** field `value` yang dikembalikan selalu menunjukkan metrik **headline**, bukan metrik `_served`. Untuk head yang `headline≠served` (H1, H3, H6, H11 — lihat ADR 0001), angka yang ditampilkan **bukan** angka yang benar-benar diserve ke user. Ini tercatat di to-do sebagai perlu ditambahkan field `value_served` terpisah.

---

## 3. `GET /v1/ingredients`

**Status: ⏸️ Belum pernah dites di sesi manapun.**

Diasumsikan mengembalikan daftar ingredient yang dikenal oleh registry (dipakai untuk pencocokan nama saat predict). Belum diverifikasi format response-nya.

---

## 4. `POST /v1/predict/{head_id}`

**Status: Bervariasi per head — lihat tabel di bagian 5.**

### Request body (`PredictIn`)
```json
{
  "formula": {
    "lines": [
      {"inci_name": "string", "wt_pct": 0.0, "ing_id": "string (opsional)", "cas": "string (opsional)", "label": "string (opsional)"}
    ]
  },
  "conditions": {},
  "product_type": "face_leave_on",
  "image_b64": null
}
```

| Field | Tipe | Wajib? | Keterangan |
|---|---|---|---|
| `formula.lines` | list of `LineIn` | Ya (bisa kosong `[]` untuk head berbasis gambar) | Daftar ingredient dan persentase berat |
| `formula.lines[].inci_name` | string | Salah satu dari inci_name/label wajib | Nama ingredient — bisa nama INCI generik atau nama dagang vendor, tergantung head |
| `formula.lines[].wt_pct` | float | Ya per line | Persentase berat (0–100) |
| `formula.lines[].ing_id` | string | Tidak | ID registry, kalau ada diprioritaskan untuk matching |
| `formula.lines[].cas` | string | Tidak | Nomor CAS, dipakai sebagai fallback matching |
| `conditions` | dict | Tidak | Default kosong — belum jelas dipakai untuk apa (kemungkinan suhu/pH, belum diverifikasi) |
| `product_type` | string | Tidak | Default `"face_leave_on"` — kemungkinan mempengaruhi constraint check, belum diverifikasi penuh |
| `image_b64` | string/null | Tidak (kecuali H11) | Gambar dalam base64, dipakai untuk head berbasis vision (H11) |

### Response body (skema umum, semua head)
```json
{
  "head": "string",
  "target": {"kind": "scalar|class", "name": "string", "unit": "string"},
  "prediction": {
    "kind": "scalar",
    "unit": "string",
    "name": "string",
    "value": 0.0,
    "lo": 0.0,
    "hi": 0.0,
    "extras": {"matched_ingredients": 0.0, "...": "..."}
  },
  "uncertainty": {
    "level": 0.9,
    "method": "split_conformal|conformal_set|none",
    "band": "low|medium|high",
    "ood": true
  },
  "provenance": {
    "model_version": "string",
    "git_commit": "string",
    "registry_version": "string",
    "train_rows": 0,
    "split": "string",
    "gate": "pass|fail|not_measured",
    "method_doi": ["string"],
    "data": [{"name": "string", "licence": "string", "class": "string", "doi": "string", "paper": "string", "card": "string"}],
    "attribution": "string|null"
  },
  "verdict": {
    "status": "pass|warn|fail",
    "findings": [
      {
        "rule": "string",
        "severity": "warn|fail",
        "message": "string",
        "source": "string",
        "ing_id": "string|null",
        "inci_name": "string|null",
        "observed": 0.0,
        "limit": 0.0,
        "condition": "string|null",
        "suggestion": "string|null"
      }
    ],
    "halal_claimable": true,
    "certifiable": true,
    "manufacturing_note": "string"
  },
  "routed_from": null,
  "warnings": ["string"]
}
```

### Penjelasan field penting
| Field | Arti |
|---|---|
| `prediction.value` | Nilai prediksi utama |
| `prediction.lo` / `hi` | Interval kepercayaan (conformal prediction) |
| `prediction.extras.matched_ingredients` | Berapa ingredient dari request yang cocok dengan fitur training model |
| `uncertainty.ood` | `true` kalau formula berada di luar training set (out-of-distribution) |
| `provenance.gate` | Status lulus/gagal model ini terhadap threshold kualitasnya — **`gate: fail` bukan berarti API error**, cuma menunjukkan kualitas model di bawah standar |
| `verdict.status` | Hasil constraint check (halal, brand rules, range typis bahan) — independen dari kualitas model ML |
| `verdict.findings[].rule` | Kode aturan yang dilanggar/warning (R1 = total wt_pct harus 100, R5 = di luar range typis, R7 = brand rules, R8 = ingredient tidak dikenal registry, dst) |
| `warnings` | Peringatan level response, termasuk kalau gate fail atau ada ingredient yang tidak match apapun |

### Respons error (422) saat model tidak bisa diserve
```json
{
  "type": "https://formulation.invalid/problems/nothing-matched",
  "title": "Nothing matched",
  "status": 422,
  "detail": "this artefact carries no feature recipe, so it cannot be served",
  "instance": "/v1/predict/{head_id}"
}
```

---

## 5. Status Predict per Head (H1–H13)

| Head | Endpoint status | Input yang dibutuhkan | Gate | Catatan |
|---|---|---|---|---|
| **H1** | ✅ Berfungsi | `formula.lines`, **nama vendor dagang** (mis. `Texapon SB 3 KC`) untuk match penuh; nama INCI generik cuma partial match | `fail` (0.8317 headline / 0.7964 served) | 100 fitur, headline≠served (ADR 0001) |
| **H2** | ✅ Berfungsi | Sama seperti H1 — nama vendor dagang | `fail` (0.1406) | 100 fitur, headline=served |
| **H3** | ⏸️ Belum dites lewat API di sesi ini | Diasumsikan `formula.lines`, INCI generik (SPF) | `fail` (0.9936 headline / 0.9289 served) — sempat bug tampil `pass`, sudah diperbaiki | Bug gate sudah di-fix di `train.py` |
| **H4** | ⏸️ Belum dites | Diasumsikan `formula.lines` | `not_measured` | Di bawah floor 40 baris data, by design |
| **H5** | ⚠️ Berfungsi tapi **akurasi fitur belum terverifikasi penuh** | `formula.lines`, INCI generik | `fail` (0.5018) | Lihat detail bug di bagian 6 |
| **H6** | ❌ **Tidak berfungsi** — selalu 422 `NothingMatched` | Seharusnya SMILES + suhu, **belum ada mekanisme serving-nya sama sekali** | `fail` (0.6702 headline / 0.7321 served) | Model berbasis struktur molekul (RDKit), bukan formula/resep. Endpoint belum diimplementasikan untuk ini. |
| **H7** | ⏸️ Belum dites | `served=False` by design | `fail` (0.6236) | Input transkriptomik, sengaja tidak diserve lewat endpoint resep |
| **H8** | ⏸️ Belum dites | `served=False` by design | `fail` (0.8242) | Dataset partial, sengaja tidak diserve |
| **H9** | ⏸️ Belum diaudit sama sekali | Diasumsikan gambar (skin concern) | Dual-gate (F1 + fairness/tone-gap) — belum ada angka spesifik dicatat | *"Both gates must pass together. Passing F1 while failing the tone gap is a failing head."* |
| **H10** | ⏸️ Belum dites, tapi `available=False` | Input spektrum warna, belum ada jalur UI/API | `pass` (0.0213 mae) | Gate pass, tapi `available=False` karena belum ada jalur input spektrum di endpoint |
| **H11** | ❌ **Belum pernah dites end-to-end** | `image_b64` (field sudah ada di `PredictIn`), butuh foto vial/jar | `fail` (0.6236–0.7039 tergantung arm, vs gate 0.84) | Raw image archive (358 MB, figshare) **tidak ada di instance Cloudeka** — tidak bisa dites tanpa upload gambar contoh dulu |
| **H12** | ❌ Tidak jalan di Cloudeka by design | — | — | *"Runs on the laptop only. Its output is private until the competition ends, by Round 16."* — terkait kompetisi eksternal |
| **H13** | ⏸️ Belum dites | Kemungkinan lewat `/v1/train` dulu (train-on-the-spot) | `not_measured` selalu (relatif ladder, bukan angka absolut) | Tidak punya `model.joblib` statis — dilatih on-demand per request |

---

## 6. Bug/Isu Teknis yang Diketahui (Detail)

### 6.1 H5 — Recipe sudah dibuat manual, tapi belum tervalidasi penuh

**Kronologi:**
1. `data/processed/H5/recipe.json` awalnya **tidak pernah ada** — `products.py` (script ingest H5) tidak punya `RECIPE_PATH`/fungsi `_recipe()`, berbeda dari `shampoo.py` (H1) dan `rheology.py` (H2) yang punya.
2. Recipe dibuat manual berdasarkan struktur `Recipe`/`Descriptor` yang ada di `src/formulation/serve/features.py`, lalu disuntikkan ke `model.joblib` H5 (di kedua repo: `formulation-core` dan `formulation-endpoint`).
3. Ditambahkan juga field baru `Recipe.presence_columns` (patch di `features.py`, **sudah di-commit & push** ke `NovagonAI/formulation-core`) supaya kolom `wt::` H5 diperlakukan sebagai presence (0/1), bukan weight percent — sesuai desain aslinya (`products.py` docstring: *"Presence, not weight... wt:: columns here are 1 for present and 0 for absent"*).
4. **Divalidasi pakai `check_recipe()`** (fungsi resmi di `src/formulation/publish/artefact.py` yang membandingkan hasil rekonstruksi recipe dengan baris asli `train.parquet`) — hasilnya: **56 kolom tidak cocok** (`RecipeDisagrees`).

**Rincian 56 kolom yang tidak cocok:**
- **29 kolom `desc_share_*` dan `desc_top3_*`** — recipe manual menghitung share/top3 hanya dari ingredient yang match 696-kolom vocabulary, sementara aslinya (`function_shares()` di `products.py`) dihitung dari **seluruh** ingredient mentah produk (termasuk yang di luar vocabulary). `Recipe` di level `features.py` saat ini tidak punya mekanisme untuk membawa daftar ingredient mentah lengkap — ini butuh perubahan desain, bukan sekadar isi data.
- **1 kolom `desc_n_ingredients`** — didekati sama dengan `desc_n_known` (jumlah ingredient matched), padahal aslinya total ingredient mentah (termasuk yang tidak match vocabulary). Sudah didokumentasikan sebagai approksimasi di commit message.
- **≈20 kolom `wt::`** dengan ejaan ingredient duplikat (mis. `LAURETH 4` vs `LAURETH-4`, `COCO GLUCOSIDE` vs `COCO-GLUCOSIDE`, `PHENYL TRIMETHICONE` vs `PHENYLTRIMETHICONE`) — vocabulary H5 punya dua kolom terpisah untuk ingredient yang sama karena fungsi `normalise()` **sengaja mempertahankan tanda hubung** (`-`) di dalam nama (untuk kasus seperti `C12-15 ALKYL BENZOATE` yang butuh tanda hubung agar tetap valid). Efek sampingnya, ejaan dengan spasi dan ejaan dengan hyphen dianggap dua ingredient berbeda oleh sistem, padahal secara kimia sama. Ini bug/trade-off di level kurasi vocabulary H5, perlu retrain dengan normalisasi tambahan untuk diperbaiki dengan benar.

**Kesimpulan:** endpoint `/v1/predict/H5` **merespons tanpa error** dan sudah menunjukkan `matched_ingredients` yang masuk akal, tapi sebagian fitur turunan (`desc_share_*`, `desc_top3_*`) yang dikirim ke model **terbukti berbeda** dari yang model pelajari saat training. Fungsi resmi `publish()` di proyek ini **akan menolak otomatis** kalau dicoba mempublikasikan H5 secara resmi (karena memanggil `check_recipe()` sendiri), jadi tidak ada risiko ini "sengaja" ter-deploy permanen — tapi versi yang jalan sekarang di endpoint (hasil suntik manual, bukan lewat `publish()` resmi) tetap membawa ketidakcocokan ini.

### 6.2 H6 — Tidak ada jalur serving sama sekali

Model H6 memprediksi CMC (critical micelle concentration) dari **struktur molekul tunggal** (SMILES), bukan dari komposisi formula. Fitur-fiturnya (`desc_molar_mass`, `desc_logp_crippen`, `desc_fp_*` fingerprint Morgan, dll) dihitung lewat RDKit dari string SMILES + suhu (lihat `src/formulation/ingest/cmc.py`). Skema `PredictIn` di `app.py` **tidak punya field untuk SMILES** — cuma ada `formula`, `conditions`, `product_type`, `image_b64`. Mengirim request format formula biasa akan selalu gagal dengan 422 `NothingMatched` karena `bundle.get("recipe")` untuk H6 kosong (`recipe: None` dikonfirmasi lewat inspeksi `model.joblib`). **Ini bukan bug — ini fitur yang belum diimplementasikan.**

### 6.3 H11 — Field sudah ada, belum pernah dites

`PredictIn.image_b64` sudah ada di skema, dan mekanisme fitur (`src/formulation/features/vial.py`) sudah lengkap — deteksi lid jar, profil brightness, chroma vs background, creaming index. Tapi:
- Raw image archive (358 MB dari figshare, DOI `10.6084/m9.figshare.c.7132624`) **tidak ada di instance Cloudeka** (`find` untuk `.zip` di seluruh `data/` mengembalikan kosong, folder `data/raw/` bahkan tidak ada).
- Belum ada satu pun percobaan request `image_b64` yang berhasil — status endpoint untuk H11 **sepenuhnya belum diverifikasi**, hanya diasumsikan berdasarkan baca kode.
- Bahkan kalau berhasil, F1 terbaik yang tercatat (0.7039, arm "profile only" yang dipakai di serving) masih jauh di bawah gate 0.84. Arsitektur yang lebih baik (ResNet embedding, F1 0.77–0.79) **sengaja tidak diserve** karena serving image tidak membawa `torch`.

### 6.4 `/v1/heads` — angka `value` salah untuk head dengan gap headline/served

Field `value` di response `/v1/heads` selalu menunjukkan metrik headline, bukan `_served`. Untuk H1, H3, H6, H11 (semua punya gap headline≠served per ADR 0001), angka yang ditampilkan **bukan** angka yang benar-benar diserve ke user. Belum diperbaiki — masuk to-do.

---

## 7. Endpoint Lain (Belum Diverifikasi Sama Sekali)

Endpoint-endpoint berikut ditemukan lewat `grep "@app\.\(post\|get\)"` di `app.py`, tapi **belum pernah dipanggil/dites** di sesi manapun. Dicatat di sini supaya lengkap, dengan asumsi berdasarkan nama class model Pydantic yang ditemukan — bisa jadi ada detail yang meleset dari asumsi ini.

### `POST /v1/explain/{head_id}`
Kemungkinan mengembalikan penjelasan/explainability (feature importance atau semacamnya) untuk prediksi head tertentu. Request body memakai model `ExplainIn` — isi field-nya belum sempat dilihat detail (baru ditemukan barisnya di `app.py`, isi class belum di-`sed`).

### `POST /v1/optimize/ask`
Bagian dari optimizer ask/tell loop (gaya Bayesian optimization). Request body (`OptimizeIn`):
```json
{
  "space": [],
  "q": 5,
  "product_type": "face_leave_on",
  "seed": 0,
  "state": null,
  "observations": [],
  "values": []
}
```
| Field | Tipe | Keterangan |
|---|---|---|
| `space` | list of `DimensionIn` | Ruang pencarian — isi `DimensionIn` belum diverifikasi |
| `q` | int | Default 5 — kemungkinan jumlah kandidat yang diminta per iterasi |
| `product_type` | string | Default `"face_leave_on"` |
| `seed` | int | Seed random |
| `state` | string/null | Menurut komentar kode: *"the request and comes back signed, so a second replica can answer the next call and a restart loses nothing (ADR 0005)"* — state dikirim balik ke client, bukan disimpan di server |
| `observations` | list of list of float | Data hasil eksperimen sebelumnya |
| `values` | list of float | Nilai target dari observasi tersebut |

### `POST /v1/optimize/tell`
Pasangan dari `/ask` — kemungkinan mengirim hasil observasi baru kembali ke optimizer. Skema request belum diverifikasi.

### `POST /v1/constraints/check`
Request body memakai model `ConstraintIn` — isi field belum di-`sed`, tapi berdasarkan konteks (verdict di response predict), kemungkinan menerima formula dan mengembalikan hasil constraint check saja (halal, brand rules, range typis) **tanpa** menjalankan model ML — berguna untuk validasi cepat formula tanpa biaya komputasi prediksi.

### `POST /v1/claims/check`
Request body memakai model `ClaimIn` — isi field belum di-`sed`. Kemungkinan untuk validasi klaim produk (misal "hypoallergenic", "cruelty-free") terhadap komposisi formula.

### `POST /v1/cost`
Request body memakai model `CostIn` — isi field belum di-`sed`. Kemungkinan menghitung estimasi biaya produksi dari formula.

### `POST /v1/ingest/infer-schema`
Menerima file upload (`UploadFile`, lihat baris 606 & 614 di `app.py`: fungsi `_read_upload()` dan route `infer_schema_route()`). Kemungkinan untuk mendeteksi skema/struktur dari file data yang di-upload user (misal CSV formula) sebelum diproses lebih lanjut.

### `POST /v1/train`
Trigger training model. Kemungkinan dipakai untuk H13 ("train-on-the-spot" — head generik yang tidak punya `model.joblib` statis, dilatih on-demand per request). Belum ada dokumentasi skema request/response. **Endpoint ini paling berisiko kalau URL bocor** — training bisa memakan resource besar dan berjalan tanpa autentikasi.

---

## 8. To-Do / Pending (Belum Selesai)

- [ ] **Konfirmasi token GitHub lama (`gho_qIzGF...`) sudah di-revoke** — sempat ke-paste mentah ke chat beberapa sesi lalu, belum ada konfirmasi eksplisit
- [ ] Perbaiki 56 offender recipe H5 (lihat 6.1) — butuh keputusan desain: redesign `Recipe` supaya bisa akses raw ingredient list untuk `desc_share_*`/`desc_top3_*`, dan retrain H5 dengan vocabulary yang sudah dinormalisasi (gabungkan duplikat ejaan)
- [ ] Implementasikan jalur serving H6 (SMILES-based) — perlu field baru di `PredictIn` dan mekanisme recipe baru yang beda total dari formula-based
- [ ] Uji H11 end-to-end — perlu upload sample foto vial ke instance dulu (raw archive tidak ada di Cloudeka), lalu tes `image_b64`
- [ ] Uji H3, H4, H7, H8, H10 lewat API — belum satupun dicoba di sesi manapun
- [ ] Audit H9, H12, H13 — status gate dan mekanisme serving-nya belum diperiksa sama sekali
- [ ] Tambahkan `_recipe()` permanen ke `src/formulation/ingest/products.py` (meniru pola `shampoo.py`) — supaya retrain H5 berikutnya tidak menghilangkan recipe yang sudah diperbaiki
- [ ] Perbaiki `/v1/heads` supaya expose `value_served` selain `value` (headline) — lihat 6.4
- [ ] Jalankan `formulation.publish.artefact.publish("H5", ...)` secara resmi setelah recipe H5 benar-benar valid (saat ini akan ditolak otomatis oleh `RecipeDisagrees`)
- [ ] Verifikasi skema request/response untuk: `/v1/explain`, `/v1/optimize/ask`, `/v1/optimize/tell`, `/v1/constraints/check`, `/v1/claims/check`, `/v1/cost`, `/v1/ingest/infer-schema`, `/v1/train` — semuanya baru diketahui dari nama route & model Pydantic, belum pernah dipanggil
- [ ] Deploy permanen (bukan tunnel sementara) — kemungkinan lewat Hugging Face Space (masih blocked, butuh HF write token dari user) atau opsi lain
- [ ] Pertimbangkan menyalakan autentikasi (`auth` saat ini `"off"`) sebelum endpoint dipakai di luar demo internal

---

## 9. Cara Menjalankan Ulang Server + Tunnel (Referensi Cepat)

```bash
# 1. Pastikan server uvicorn jalan (dari dalam formulation-endpoint)
cd ~/work/formulation-endpoint
pkill -f "uvicorn app:app"   # matikan proses lama kalau ada
nohup uvicorn app:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
sleep 3
curl -s http://localhost:8000/v1/health

# 2. Jalankan Cloudflare Tunnel (background, biar terminal bebas)
cd ~
nohup ~/cloudflared tunnel --url http://localhost:8000 > ~/cloudflared.log 2>&1 &
sleep 5
grep trycloudflare ~/cloudflared.log
```

URL baru akan muncul di output `grep` terakhir — **selalu beda dari sesi sebelumnya**, jadi perlu dicek ulang tiap kali dijalankan.

Cek proses yang jalan:
```bash
jobs -l
ps aux | grep -E "uvicorn|cloudflared"
```

Matikan semua:
```bash
pkill -f "uvicorn app:app"
pkill -f "cloudflared tunnel"
```
