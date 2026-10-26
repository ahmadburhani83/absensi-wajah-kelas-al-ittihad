import type { ClassItem, TeacherItem, PeriodItem, StudentItem, AttendanceItem } from '../types';

const STORAGE_KEYS = {
  CLASSES: 'app_presensi_classes_v1',
  TEACHERS: 'app_presensi_teachers_v1',
  PERIODS: 'app_presensi_periods_v1',
  STUDENTS: 'app_presensi_students_v1',
  ATTENDANCES: 'app_presensi_attendances_v1',
  SUPABASE_CONFIG: 'app_presensi_supabase_config_v1',
};

// Initial Seed Data for immediate testing without setup
const SEED_PERIODS: PeriodItem[] = [
  { id: 'p-1', period_number: 1, name: 'Jam Ke-1', start_time: '07:00', end_time: '07:45', is_active: true },
  { id: 'p-2', period_number: 2, name: 'Jam Ke-2', start_time: '07:45', end_time: '08:30', is_active: true },
  { id: 'p-3', period_number: 3, name: 'Jam Ke-3', start_time: '08:30', end_time: '09:15', is_active: true },
  { id: 'p-4', period_number: 4, name: 'Jam Ke-4', start_time: '09:30', end_time: '10:15', is_active: true },
  { id: 'p-5', period_number: 5, name: 'Jam Ke-5', start_time: '10:15', end_time: '11:00', is_active: true },
  { id: 'p-6', period_number: 6, name: 'Jam Ke-6', start_time: '11:00', end_time: '11:45', is_active: true },
  { id: 'p-7', period_number: 7, name: 'Jam Ke-7', start_time: '12:30', end_time: '13:15', is_active: true },
  { id: 'p-8', period_number: 8, name: 'Jam Ke-8', start_time: '13:15', end_time: '14:00', is_active: true },
];

const SEED_CLASSES: ClassItem[] = [
  {
    id: 'c-1',
    name: 'XII RPL 1',
    grade: '12',
    major: 'Rekayasa Perangkat Lunak',
    homeroom_teacher: 'Siti Rahmawati, S.Kom, M.T',
    academic_year: '2026/2027',
  },
  {
    id: 'c-2',
    name: 'XII MIPA 1',
    grade: '12',
    major: 'MIPA',
    homeroom_teacher: 'Drs. H. Ahmad Dahlan, M.Pd',
    academic_year: '2026/2027',
  },
  {
    id: 'c-3',
    name: 'XI TKJ 2',
    grade: '11',
    major: 'Teknik Komputer & Jaringan',
    homeroom_teacher: 'Bambang Triatmojo, S.Pd',
    academic_year: '2026/2027',
  },
];

const SEED_TEACHERS: TeacherItem[] = [
  {
    id: 't-1',
    nip: '198503152010011002',
    name: 'Budi Santoso, M.Pd',
    subject: 'Matematika Peminatan',
    phone: '081234567890',
    email: 'budi.santoso@sekolah.sch.id',
    is_active: true,
  },
  {
    id: 't-2',
    nip: '198711042011011005',
    name: 'Rizky Firmansyah, S.Kom',
    subject: 'Pemrograman Web & Mobile',
    phone: '081377889900',
    email: 'rizky.f@sekolah.sch.id',
    is_active: true,
  },
  {
    id: 't-3',
    nip: '199008222015022001',
    name: 'Dewi Lestari, S.Pd',
    subject: 'Bahasa Indonesia',
    phone: '081298765432',
    email: 'dewi.lestari@sekolah.sch.id',
    is_active: true,
  },
];

const SEED_STUDENTS: StudentItem[] = [
  {
    id: 's-1',
    nis: '2024001',
    nisn: '0061234567',
    name: 'Aditya Pratama',
    gender: 'L',
    class_id: 'c-1',
    is_enrolled: false,
    face_descriptor: null,
  },
  {
    id: 's-2',
    nis: '2024002',
    nisn: '0061234568',
    name: 'Anisa Rahmawati',
    gender: 'P',
    class_id: 'c-1',
    is_enrolled: false,
    face_descriptor: null,
  },
  {
    id: 's-3',
    nis: '2024003',
    nisn: '0061234569',
    name: 'Dimas Satria Wibowo',
    gender: 'L',
    class_id: 'c-1',
    is_enrolled: false,
    face_descriptor: null,
  },
  {
    id: 's-4',
    nis: '2024004',
    nisn: '0061234570',
    name: 'Fauzan Nur Hidayat',
    gender: 'L',
    class_id: 'c-1',
    is_enrolled: false,
    face_descriptor: null,
  },
  {
    id: 's-5',
    nis: '2024005',
    nisn: '0061234571',
    name: 'Nabila Zahra Putri',
    gender: 'P',
    class_id: 'c-1',
    is_enrolled: false,
    face_descriptor: null,
  },
  {
    id: 's-6',
    nis: '2024006',
    nisn: '0061234572',
    name: 'Rizky Maulana',
    gender: 'L',
    class_id: 'c-2',
    is_enrolled: false,
    face_descriptor: null,
  },
  {
    id: 's-7',
    nis: '2024007',
    nisn: '0061234573',
    name: 'Zahra Aulia',
    gender: 'P',
    class_id: 'c-2',
    is_enrolled: false,
    face_descriptor: null,
  },
];

class LocalStorageService {
  // Generic helper
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  // Classes
  getClasses(): ClassItem[] {
    const data = this.getItem<ClassItem[]>(STORAGE_KEYS.CLASSES, []);
    if (data.length === 0) {
      this.setItem(STORAGE_KEYS.CLASSES, SEED_CLASSES);
      return SEED_CLASSES;
    }
    return data;
  }

  saveClasses(classes: ClassItem[]): void {
    this.setItem(STORAGE_KEYS.CLASSES, classes);
  }

  // Teachers
  getTeachers(): TeacherItem[] {
    const data = this.getItem<TeacherItem[]>(STORAGE_KEYS.TEACHERS, []);
    if (data.length === 0) {
      this.setItem(STORAGE_KEYS.TEACHERS, SEED_TEACHERS);
      return SEED_TEACHERS;
    }
    return data;
  }

  saveTeachers(teachers: TeacherItem[]): void {
    this.setItem(STORAGE_KEYS.TEACHERS, teachers);
  }

  // Periods
  getPeriods(): PeriodItem[] {
    const data = this.getItem<PeriodItem[]>(STORAGE_KEYS.PERIODS, []);
    if (data.length === 0) {
      this.setItem(STORAGE_KEYS.PERIODS, SEED_PERIODS);
      return SEED_PERIODS;
    }
    return data.sort((a, b) => a.period_number - b.period_number);
  }

  savePeriods(periods: PeriodItem[]): void {
    this.setItem(STORAGE_KEYS.PERIODS, periods.sort((a, b) => a.period_number - b.period_number));
  }

  // Students
  getStudents(): StudentItem[] {
    const data = this.getItem<StudentItem[]>(STORAGE_KEYS.STUDENTS, []);
    if (data.length === 0) {
      this.setItem(STORAGE_KEYS.STUDENTS, SEED_STUDENTS);
      return SEED_STUDENTS;
    }
    return data;
  }

  saveStudents(students: StudentItem[]): void {
    this.setItem(STORAGE_KEYS.STUDENTS, students);
  }

  // Attendances
  getAttendances(): AttendanceItem[] {
    return this.getItem<AttendanceItem[]>(STORAGE_KEYS.ATTENDANCES, []);
  }

  saveAttendances(attendances: AttendanceItem[]): void {
    this.setItem(STORAGE_KEYS.ATTENDANCES, attendances);
  }

  // Reset to initial seed
  resetDefaults(): void {
    this.setItem(STORAGE_KEYS.CLASSES, SEED_CLASSES);
    this.setItem(STORAGE_KEYS.TEACHERS, SEED_TEACHERS);
    this.setItem(STORAGE_KEYS.PERIODS, SEED_PERIODS);
    this.setItem(STORAGE_KEYS.STUDENTS, SEED_STUDENTS);
    this.setItem(STORAGE_KEYS.ATTENDANCES, []);
  }
}

export const storageService = new LocalStorageService();
