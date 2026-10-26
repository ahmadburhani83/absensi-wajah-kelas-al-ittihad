# 🎓 Presensi Pintar — Sistem Absensi Wajah Siswa Kelas

Aplikasi Presensi Wajah Siswa modern, cepat, dan akurat yang dirancang khusus untuk kebutuhan guru saat masuk ke ruang kelas. Dibangun dengan standar rekayasa perangkat lunak profesional: **Full Client-side AI Biometrics**, **Zero-Image Storage (Privasi Terjamin)**, serta siap di-deploy ke **GitHub**, **Vercel**, dan **Supabase**.

---

## ✨ Fitur Utama

1. **📷 Presensi Wajah Real-Time di Kelas (Face Recognition)**
   - Saat guru masuk kelas: pilih **Nama Guru**, **Kelas**, dan **Jam Pelajaran ke-berapa**.
   - Kamera langsung mendeteksi wajah siswa secara otomatis menggunakan jaringan syaraf tiruan (*Neural Network: TinyFaceDetector + FaceRecognitionNet*).
   - Indikator bounding box dinamis (HUD), audio chime sukses instan (*Web Audio API*), dan animasi selebrasi.
   - Fitur *anti-duplicate scan* otomatis (mencegah siswa terabsen ganda pada sesi yang sama).

2. **🔒 Jaminan Privasi (Tanpa Simpan Foto/Gambar Wajah)**
   - **TIDAK ADA FOTO ATAU GAMBAR WAJAH YANG DISIMPAN KE DATABASE ATAU SERVER.**
   - Saat pendaftaran wajah siswa, model AI mengekstraksi **vektor matematis 128-dimensi (`Float32Array[128]`)** yang merepresentasikan kontur geometri wajah.
   - Sesuai dengan standar kepatuhan privasi data internasional (GDPR) dan UU Perlindungan Data Pribadi (UU PDP).

3. **⏰ Pengaturan Jam Pelajaran Dinamis**
   - Mendukung pengaturan jam pelajaran ke berapa (Jam Ke-1, Jam Ke-2, Jam Ke-3, dst.).
   - Pengaturan jam mulai dan jam selesai untuk tiap sesi.
   - Status aktif/nonaktif per jam pelajaran.

4. **📊 Rekap Absensi Berdasarkan Kelas & Tanggal**
   - Filter lengkap: **Berdasarkan Kelas**, **Rentang Tanggal**, **Jam Pelajaran**, dan **Status Kehadiran**.
   - Kartu statistik: Total Siswa, Hadir, Izin, Sakit, Alpa, dan Persentase Kehadiran.
   - **Ekspor Excel / CSV** (dengan encoding UTF-8 BOM rapi untuk Microsoft Excel).
   - **Cetak Berita Acara Presensi Resmi (Format Cetak / PDF)** lengkap dengan kolom tanda tangan Guru Mata Pelajaran dan Wali Kelas.

5. **🛠️ Manajemen Data Lengkap (Full CRUD)**
   - **CRUD Siswa**: Tambah, edit, hapus data siswa, pendaftaran wajah biometrik, dan reset data biometrik.
   - **CRUD Kelas**: Tambah, edit, hapus kelas, tingkat (10, 11, 12, dll), jurusan, dan wali kelas.
   - **CRUD Guru**: Tambah, edit, hapus data guru, NIP, mata pelajaran yang diampu, dan kontak.
   - **CRUD Absensi**: Koreksi status kehadiran manual (misal: ubah dari Alpa menjadi Izin/Sakit), catatan dispensasi, dan hapus riwayat.

6. **☁️ Dual-Mode: Supabase Cloud + Local Storage Offline Fallback**
   - Jika belum menghubungkan Supabase, aplikasi **langsung berfungsi 100% menggunakan LocalStorage / Demo Mode**.
   - Cukup masukkan URL & Anon Key Supabase di tab pengaturan untuk menyinkronkan seluruh data secara real-time ke cloud PostgreSQL.

---

## 🗄️ Struktur Database Supabase

Seluruh skrip SQL telah disediakan pada file [`supabase_schema.sql`](./supabase_schema.sql):

- `classes`: Menyimpan data kelas, tingkat, jurusan, dan wali kelas.
- `teachers`: Menyimpan data guru dan mata pelajaran yang diampu.
- `periods`: Menyimpan jam pelajaran (Jam Ke-1, 2, dst.), jam mulai, dan jam selesai.
- `students`: Menyimpan data siswa dan `face_descriptor` (JSON array 128 angka float).
- `attendances`: Menyimpan riwayat presensi siswa per tanggal dan jam pelajaran.

---

## 🚀 Panduan Setup & Publikasi

### 1. Jalankan di Komputer Lokal

```bash
# Masuk ke folder proyek
cd absensi-wajah-kelas

# Install dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

Buka `http://localhost:5173` di browser Anda.

---

### 2. Setup Supabase (Database Cloud)

1. Buka [https://supabase.com](https://supabase.com) dan buat proyek baru (*New Project*).
2. Di Dashboard Supabase, buka menu **SQL Editor**.
3. Buka file [`supabase_schema.sql`](./supabase_schema.sql) di repositori ini, salin seluruh isinya, tempel ke SQL Editor Supabase, lalu klik **Run**.
4. Ambil kredensial proyek di menu **Project Settings > API**:
   - `Project URL`
   - `Project API Keys (anon public)`
5. Masukkan kedua nilai tersebut ke file `.env` di proyek Anda:
   ```env
   VITE_SUPABASE_URL=https://proyek-anda.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
   *(Atau masukkan langsung melalui menu **Supabase & Cloud** di antarmuka aplikasi web).*

---

### 3. Publikasikan ke GitHub

Inisialisasi git dan unggah ke repositori GitHub Anda:

```bash
# Inisialisasi git
git init
git add .
git commit -m "feat: initial commit presensi wajah kelas"

# Hubungkan ke repository GitHub Anda
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO-ANDA.git
git push -u origin main
```

---

### 4. Deploy ke Vercel (1-Click)

1. Buka [https://vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik **Add New... > Project** dan pilih repositori GitHub `absensi-wajah-kelas` yang baru saja Anda buat.
3. Pada bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL` = URL Supabase Anda
   - `VITE_SUPABASE_ANON_KEY` = Anon Key Supabase Anda
4. Klik **Deploy**.
5. File `vercel.json` sudah dikonfigurasi untuk menangani *Single Page Application routing* dan *browser caching* untuk model neural network AI di folder `/models`.

---

## 💻 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Modern Custom CSS System (Glassmorphism, Dark Theme, Micro-animations)
- **Face Recognition AI**: `@vladmandic/face-api` (TinyFaceDetector, 68 Face Landmarks, FaceRecognitionNet)
- **Audio Synthesis**: Web Audio API (Zero external MP3 dependency)
- **Database & Backend**: Supabase (PostgreSQL, Row Level Security)
- **Deployment**: Vercel & GitHub

---

## 📋 Lisensi & Kepatuhan Privasi

Aplikasi ini mematuhi standar privasi biometrik: **Tidak ada penyimpanan citra visual/foto wajah**. Model neural network hanya mengekstraksi vektor matematis fitur wajah untuk keperluan pencocokan kehadiran di kelas.
