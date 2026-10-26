export type Gender = 'L' | 'P';
export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpa';
export type AttendanceMethod = 'face_scan' | 'manual';

export interface ClassItem {
  id: string;
  name: string;
  grade: string;
  major: string;
  homeroom_teacher?: string;
  academic_year?: string;
  created_at?: string;
}

export interface TeacherItem {
  id: string;
  nip: string;
  name: string;
  subject: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface PeriodItem {
  id: string;
  period_number: number;
  name: string;
  start_time: string; // e.g. "07:00"
  end_time: string;   // e.g. "07:45"
  is_active: boolean;
}

export interface StudentItem {
  id: string;
  nis: string;
  nisn?: string;
  name: string;
  gender: Gender;
  class_id: string;
  // Face descriptor is a 128-float vector representing facial geometry.
  // NO raw image or photo is saved for privacy and lightweight storage!
  face_descriptor?: number[] | null;
  is_enrolled: boolean;
  enrolled_at?: string;
  created_at?: string;
}

export interface AttendanceItem {
  id: string;
  student_id: string;
  class_id: string;
  teacher_id?: string;
  period_id?: string;
  date: string;       // YYYY-MM-DD
  scan_time: string;  // HH:mm:ss
  status: AttendanceStatus;
  confidence_score?: number; // e.g. 96.4
  method: AttendanceMethod;
  notes?: string;
  created_at?: string;
}

export interface AttendanceDetail extends AttendanceItem {
  student_name: string;
  student_nis: string;
  class_name: string;
  teacher_name?: string;
  period_name?: string;
}

export interface FaceDetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MatchResult {
  student: StudentItem;
  distance: number;
  confidence: number;
  box: FaceDetectionBox;
}

export interface ActiveClassSession {
  class_id: string;
  teacher_id: string;
  period_id: string;
  date: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
