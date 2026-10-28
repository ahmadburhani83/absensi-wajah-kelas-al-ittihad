-- =========================================================================
-- SISTEM PRESENSI WAJAH KELAS BERBASIS BIOMETRIK (NO IMAGE STORAGE)
-- Database Migration Script for Supabase (PostgreSQL)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL KELAS (CLASSES)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,       -- Contoh: "X MIPA 1", "XII RPL 2"
    grade VARCHAR(20) NOT NULL,              -- Contoh: "10", "11", "12"
    major VARCHAR(50) DEFAULT 'Umum',       -- Contoh: "MIPA", "IPS", "RPL", "TKJ"
    homeroom_teacher VARCHAR(100),           -- Nama Wali Kelas
    academic_year VARCHAR(20) DEFAULT '2026/2027',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL GURU (TEACHERS)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nip VARCHAR(30) UNIQUE,                  -- NIP / NUPTK
    name VARCHAR(100) NOT NULL,              -- Nama Lengkap beserta Gelar
    subject VARCHAR(100) NOT NULL,           -- Mata Pelajaran yang diampu
    phone VARCHAR(25),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL JAM PELAJARAN (PERIODS / SCHEDULE)
CREATE TABLE IF NOT EXISTS public.periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_number INT NOT NULL UNIQUE,       -- 1, 2, 3, dst
    name VARCHAR(50) NOT NULL,               -- "Jam Ke-1", "Jam Ke-2"
    start_time TIME NOT NULL,                -- '07:00'
    end_time TIME NOT NULL,                  -- '07:45'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL SISWA (STUDENTS)
-- CATATAN PRIVASI PENTING:
-- Tidak ada foto atau gambar wajah yang disimpan!
-- Hanya menyimpan face_descriptor berupa array 128-float (vektor representasi geometri wajah).
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nis VARCHAR(30) NOT NULL UNIQUE,         -- Nomor Induk Siswa
    nisn VARCHAR(30),                        -- NISN Nasional
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('L', 'P')),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    face_descriptor JSONB,                   -- Array 128 float angka: [0.123, -0.456, ...]
    is_enrolled BOOLEAN DEFAULT FALSE,       -- Status apakah wajah sudah didaftarkan
    enrolled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);

-- 5. TABEL ABSENSI (ATTENDANCES)
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    period_id UUID REFERENCES public.periods(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    scan_time TIME NOT NULL DEFAULT CURRENT_TIME,
    status VARCHAR(20) NOT NULL CHECK (status IN ('hadir', 'izin', 'sakit', 'alpa')),
    confidence_score NUMERIC(5, 2),          -- Persentase kecocokan (e.g., 94.50%)
    method VARCHAR(20) DEFAULT 'face_scan',  -- 'face_scan' atau 'manual'
    notes TEXT,                              -- Keterangan tambahan (e.g., "Izin dispensasi OSIS")
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Cegah duplikasi presensi siswa di jam pelajaran dan tanggal yang sama
    CONSTRAINT unique_student_session UNIQUE (student_id, date, period_id)
);

-- Indexing untuk rekap cepat
CREATE INDEX IF NOT EXISTS idx_attendances_date_class ON public.attendances(date, class_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student_id ON public.attendances(student_id);

-- 6. TABEL REKAP PRESENSI HARIAN (DAILY ATTENDANCES MATRIX)
-- Format: | nama siswa | tanggal | kelas | jam ke 1 | jam ke 2 | ... | jam N |
-- Memudahkan pembacaan langsung di Supabase Table Editor maupun ekspor data.
CREATE TABLE IF NOT EXISTS public.daily_attendances (
    id TEXT PRIMARY KEY,                     -- Kombinasi format: YYYY-MM-DD_<student_id>
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_name VARCHAR(100) NOT NULL,
    student_nis VARCHAR(30),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    class_name VARCHAR(50) NOT NULL,
    jam_1 VARCHAR(20) DEFAULT '-',
    jam_2 VARCHAR(20) DEFAULT '-',
    jam_3 VARCHAR(20) DEFAULT '-',
    jam_4 VARCHAR(20) DEFAULT '-',
    jam_5 VARCHAR(20) DEFAULT '-',
    jam_6 VARCHAR(20) DEFAULT '-',
    jam_7 VARCHAR(20) DEFAULT '-',
    jam_8 VARCHAR(20) DEFAULT '-',
    jam_9 VARCHAR(20) DEFAULT '-',
    jam_10 VARCHAR(20) DEFAULT '-',
    jam_11 VARCHAR(20) DEFAULT '-',
    jam_12 VARCHAR(20) DEFAULT '-',
    total_hadir INT DEFAULT 0,
    total_izin INT DEFAULT 0,
    total_sakit INT DEFAULT 0,
    total_alpa INT DEFAULT 0,
    persentase NUMERIC(5, 2) DEFAULT 0,
    last_scan_time TIME,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_daily_student_date UNIQUE (student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_attendances_date_class ON public.daily_attendances(date, class_id);
CREATE INDEX IF NOT EXISTS idx_daily_attendances_student ON public.daily_attendances(student_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Untuk kemudahan deployment awal di Vercel, kita aktifkan RLS dan izinkan
-- operasi baca/tulis melalui Anon Key.
-- =========================================================================

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all daily_attendances" ON public.daily_attendances FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Allow public insert classes" ON public.classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update classes" ON public.classes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete classes" ON public.classes FOR DELETE USING (true);

CREATE POLICY "Allow public read teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Allow public insert teachers" ON public.teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update teachers" ON public.teachers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete teachers" ON public.teachers FOR DELETE USING (true);

CREATE POLICY "Allow public read periods" ON public.periods FOR SELECT USING (true);
CREATE POLICY "Allow public insert periods" ON public.periods FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update periods" ON public.periods FOR UPDATE USING (true);
CREATE POLICY "Allow public delete periods" ON public.periods FOR DELETE USING (true);

CREATE POLICY "Allow public read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow public delete students" ON public.students FOR DELETE USING (true);

CREATE POLICY "Allow public read attendances" ON public.attendances FOR SELECT USING (true);
CREATE POLICY "Allow public insert attendances" ON public.attendances FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update attendances" ON public.attendances FOR UPDATE USING (true);
CREATE POLICY "Allow public delete attendances" ON public.attendances FOR DELETE USING (true);

-- =========================================================================
-- SEED DATA (DATA AWAL UNTUK PENGUJIAN LANGSUNG)
-- =========================================================================

-- Seed Jam Pelajaran
INSERT INTO public.periods (period_number, name, start_time, end_time) VALUES
(1, 'Jam Ke-1', '07:00:00', '07:45:00'),
(2, 'Jam Ke-2', '07:45:00', '08:30:00'),
(3, 'Jam Ke-3', '08:30:00', '09:15:00'),
(4, 'Jam Ke-4', '09:30:00', '10:15:00'),
(5, 'Jam Ke-5', '10:15:00', '11:00:00'),
(6, 'Jam Ke-6', '11:00:00', '11:45:00'),
(7, 'Jam Ke-7', '12:30:00', '13:15:00'),
(8, 'Jam Ke-8', '13:15:00', '14:00:00')
ON CONFLICT (period_number) DO NOTHING;

-- Seed Kelas Contoh
INSERT INTO public.classes (id, name, grade, major, homeroom_teacher) VALUES
('11111111-1111-1111-1111-111111111111', 'XII MIPA 1', '12', 'MIPA', 'Drs. H. Ahmad Dahlan, M.Pd'),
('22222222-2222-2222-2222-222222222222', 'XII RPL 1', '12', 'RPL', 'Siti Rahmawati, S.Kom, M.T'),
('33333333-3333-3333-3333-333333333333', 'XI IPS 2', '11', 'IPS', 'Bambang Triatmojo, S.Pd')
ON CONFLICT (name) DO NOTHING;

-- Seed Guru Contoh
INSERT INTO public.teachers (id, nip, name, subject, phone, email) VALUES
('44444444-4444-4444-4444-444444444444', '198503152010011002', 'Budi Santoso, M.Pd', 'Matematika Peminatan', '081234567890', 'budi.santoso@sekolah.sch.id'),
('55555555-5555-5555-5555-555555555555', '199008222015022001', 'Dewi Lestari, S.Pd', 'Bahasa Indonesia', '081298765432', 'dewi.lestari@sekolah.sch.id'),
('66666666-6666-6666-6666-666666666666', '198711042011011005', 'Rizky Firmansyah, S.Kom', 'Pemrograman Web & Mobile', '081377889900', 'rizky.f@sekolah.sch.id')
ON CONFLICT (nip) DO NOTHING;

-- Seed Siswa Contoh
INSERT INTO public.students (id, nis, nisn, name, gender, class_id, is_enrolled) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024001', '0061234567', 'Aditya Pratama', 'L', '22222222-2222-2222-2222-222222222222', FALSE),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024002', '0061234568', 'Anisa Rahmawati', 'P', '22222222-2222-2222-2222-222222222222', FALSE),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '2024003', '0061234569', 'Dimas Satria Wibowo', 'L', '22222222-2222-2222-2222-222222222222', FALSE),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '2024004', '0061234570', 'Fauzan Nur Hidayat', 'L', '22222222-2222-2222-2222-222222222222', FALSE),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2024005', '0061234571', 'Nabila Zahra Putri', 'P', '22222222-2222-2222-2222-222222222222', FALSE),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '2024006', '0061234572', 'Rizky Maulana', 'L', '11111111-1111-1111-1111-111111111111', FALSE),
('99999999-9999-9999-9999-999999999999', '2024007', '0061234573', 'Zahra Aulia', 'P', '11111111-1111-1111-1111-111111111111', FALSE)
ON CONFLICT (nis) DO NOTHING;
