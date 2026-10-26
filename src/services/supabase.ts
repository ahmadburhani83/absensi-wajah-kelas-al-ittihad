import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ClassItem, TeacherItem, PeriodItem, StudentItem, AttendanceItem } from '../types';

const STORAGE_KEY_SUPABASE = 'app_presensi_supabase_credentials_v1';

export interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private currentUrl = '';
  private currentKey = '';

  constructor() {
    this.initClient();
  }

  // Get active credentials from environment or localStorage
  getCredentials(): SupabaseCredentials {
    const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    try {
      const stored = localStorage.getItem(STORAGE_KEY_SUPABASE);
      if (stored) {
        const parsed = JSON.parse(stored) as SupabaseCredentials;
        if (parsed.url && parsed.anonKey) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    return { url: envUrl, anonKey: envKey };
  }

  saveCredentials(url: string, anonKey: string): void {
    const trimmedUrl = url.trim();
    const trimmedKey = anonKey.trim();
    localStorage.setItem(
      STORAGE_KEY_SUPABASE,
      JSON.stringify({ url: trimmedUrl, anonKey: trimmedKey })
    );
    this.initClient(trimmedUrl, trimmedKey);
  }

  clearCredentials(): void {
    localStorage.removeItem(STORAGE_KEY_SUPABASE);
    this.client = null;
    this.currentUrl = '';
    this.currentKey = '';
  }

  initClient(customUrl?: string, customKey?: string): SupabaseClient | null {
    const creds = customUrl && customKey ? { url: customUrl, anonKey: customKey } : this.getCredentials();

    if (creds.url && creds.anonKey) {
      if (this.client && this.currentUrl === creds.url && this.currentKey === creds.anonKey) {
        return this.client;
      }
      try {
        this.client = createClient(creds.url, creds.anonKey);
        this.currentUrl = creds.url;
        this.currentKey = creds.anonKey;
        return this.client;
      } catch (err) {
        console.error('Error creating Supabase client:', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
    return this.client;
  }

  isConfigured(): boolean {
    const creds = this.getCredentials();
    return Boolean(creds.url && creds.anonKey && creds.url.startsWith('https://'));
  }

  getClient(): SupabaseClient | null {
    if (!this.client) {
      return this.initClient();
    }
    return this.client;
  }

  async testConnection(url?: string, key?: string): Promise<{ success: boolean; message: string }> {
    const testClient = url && key ? createClient(url.trim(), key.trim()) : this.getClient();
    if (!testClient) {
      return { success: false, message: 'URL Supabase atau Anon Key belum diatur.' };
    }

    try {
      // Query classes table limit 1
      const { error } = await testClient.from('classes').select('id').limit(1);
      if (error) {
        return { success: false, message: `Koneksi gagal: ${error.message}` };
      }
      return { success: true, message: 'Berhasil terhubung ke Supabase Database!' };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Kesalahan jaringan: ${errMsg}` };
    }
  }

  // ===================== CRUD OPERATIONS =====================

  // Classes
  async fetchClasses(): Promise<ClassItem[] | null> {
    const client = this.getClient();
    if (!client) return null;
    const { data, error } = await client.from('classes').select('*').order('name');
    if (error) {
      console.warn('Supabase fetchClasses error:', error);
      return null;
    }
    return data as ClassItem[];
  }

  async upsertClass(c: ClassItem): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    const { error } = await client.from('classes').upsert(c);
    return !error;
  }

  async deleteClass(id: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    const { error } = await client.from('classes').delete().eq('id', id);
    return !error;
  }

  // Teachers
  async fetchTeachers(): Promise<TeacherItem[] | null> {
    const client = this.getClient();
    if (!client) return null;
    const { data, error } = await client.from('teachers').select('*').order('name');
    if (error) {
      console.warn('Supabase fetchTeachers error:', error);
      return null;
    }
    return data as TeacherItem[];
  }

  async upsertTeacher(t: TeacherItem): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    const { error } = await client.from('teachers').upsert(t);
    return !error;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    const { error } = await client.from('teachers').delete().eq('id', id);
    return !error;
  }

  // Periods
  async fetchPeriods(): Promise<PeriodItem[] | null> {
    const client = this.getClient();
    if (!client) return null;
    const { data, error } = await client.from('periods').select('*').order('period_number');
    if (error) {
      console.warn('Supabase fetchPeriods error:', error);
      return null;
    }
    return data as PeriodItem[];
  }

  async upsertPeriod(p: PeriodItem): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    const { error } = await client.from('periods').upsert(p);
    return !error;
  }

  async deletePeriod(id: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    const { error } = await client.from('periods').delete().eq('id', id);
    return !error;
  }

  // Students
  async fetchStudents(): Promise<StudentItem[] | null> {
    const client = this.getClient();
    if (!client) return null;
    const { data, error } = await client.from('students').select('*').order('name');
    if (error) {
      console.warn('Supabase fetchStudents error:', error);
      return null;
    }
    return data as StudentItem[];
  }

  async upsertStudent(s: StudentItem): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    // Note: face_descriptor is JSONB array of 128 numbers
    const { error } = await client.from('students').upsert({
      id: s.id,
      nis: s.nis,
      nisn: s.nisn || null,
      name: s.name,
      gender: s.gender,
      class_id: s.class_id,
      face_descriptor: s.face_descriptor || null,
      is_enrolled: s.is_enrolled,
      enrolled_at: s.enrolled_at || null,
    });
    if (error) console.error('Supabase upsertStudent error:', error);
    return !error;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    const { error } = await client.from('students').delete().eq('id', id);
    return !error;
  }

  // Attendances
  async fetchAttendances(): Promise<AttendanceItem[] | null> {
    const client = this.getClient();
    if (!client) return null;
    const { data, error } = await client.from('attendances').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetchAttendances error:', error);
      return null;
    }
    return data as AttendanceItem[];
  }

  async upsertAttendance(a: AttendanceItem): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    const { error } = await client.from('attendances').upsert(a);
    if (error) console.error('Supabase upsertAttendance error:', error);
    return !error;
  }

  async deleteAttendance(id: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    const { error } = await client.from('attendances').delete().eq('id', id);
    return !error;
  }
}

export const supabaseService = new SupabaseService();
