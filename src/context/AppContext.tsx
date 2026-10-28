import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  ClassItem,
  TeacherItem,
  PeriodItem,
  StudentItem,
  AttendanceItem,
  AttendanceDetail,
  DailyAttendanceItem,
} from '../types';
import { storageService } from '../services/storage';
import { supabaseService } from '../services/supabase';

interface AppContextType {
  classes: ClassItem[];
  teachers: TeacherItem[];
  periods: PeriodItem[];
  students: StudentItem[];
  attendances: AttendanceItem[];
  dailyAttendances: DailyAttendanceItem[];
  detailedAttendances: AttendanceDetail[];
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  isOnline: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // CRUD Class
  addClass: (cls: Omit<ClassItem, 'id'>) => Promise<string>;
  updateClass: (id: string, cls: Partial<ClassItem>) => Promise<boolean>;
  deleteClass: (id: string) => Promise<boolean>;

  // CRUD Teacher
  addTeacher: (teacher: Omit<TeacherItem, 'id'>) => Promise<string>;
  updateTeacher: (id: string, teacher: Partial<TeacherItem>) => Promise<boolean>;
  deleteTeacher: (id: string) => Promise<boolean>;

  // CRUD Period
  addPeriod: (period: Omit<PeriodItem, 'id'>) => Promise<string>;
  updatePeriod: (id: string, period: Partial<PeriodItem>) => Promise<boolean>;
  deletePeriod: (id: string) => Promise<boolean>;

  // CRUD Student
  addStudent: (student: Omit<StudentItem, 'id' | 'is_enrolled'>) => Promise<string>;
  updateStudent: (id: string, student: Partial<StudentItem>) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;
  enrollStudentFace: (id: string, descriptor: number[]) => Promise<boolean>;
  clearStudentFace: (id: string) => Promise<boolean>;

  // CRUD Attendance
  saveAttendanceRecord: (record: Omit<AttendanceItem, 'id' | 'created_at'>) => Promise<string>;
  updateAttendanceRecord: (id: string, updates: Partial<AttendanceItem>) => Promise<boolean>;
  deleteAttendanceRecord: (id: string) => Promise<boolean>;

  // Sync & Management
  refreshData: () => Promise<void>;
  syncWithSupabase: () => Promise<{ success: boolean; message: string }>;
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [dailyAttendances, setDailyAttendances] = useState<DailyAttendanceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState<boolean>(supabaseService.isConfigured());
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Initialize and load data
  const loadLocalData = useCallback(() => {
    setClasses(storageService.getClasses());
    setTeachers(storageService.getTeachers());
    setPeriods(storageService.getPeriods());
    setStudents(storageService.getStudents());
    setAttendances(storageService.getAttendances());
    setDailyAttendances(storageService.getDailyAttendances());
    setIsSupabaseConfigured(supabaseService.isConfigured());
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    loadLocalData();

    // If Supabase is connected, attempt background pull to ensure fresh sync
    if (supabaseService.isConfigured()) {
      try {
        const [cloudClasses, cloudTeachers, cloudPeriods, cloudStudents, cloudAttendances, cloudDaily] =
          await Promise.all([
            supabaseService.fetchClasses(),
            supabaseService.fetchTeachers(),
            supabaseService.fetchPeriods(),
            supabaseService.fetchStudents(),
            supabaseService.fetchAttendances(),
            supabaseService.fetchDailyAttendances(),
          ]);

        if (cloudClasses) {
          setClasses(cloudClasses);
          storageService.saveClasses(cloudClasses);
        }
        if (cloudTeachers) {
          setTeachers(cloudTeachers);
          storageService.saveTeachers(cloudTeachers);
        }
        if (cloudPeriods) {
          setPeriods(cloudPeriods);
          storageService.savePeriods(cloudPeriods);
        }
        if (cloudStudents) {
          setStudents(cloudStudents);
          storageService.saveStudents(cloudStudents);
        }
        if (cloudAttendances) {
          setAttendances(cloudAttendances);
          storageService.saveAttendances(cloudAttendances);
        }
        if (cloudDaily && cloudDaily.length > 0) {
          setDailyAttendances(cloudDaily);
          storageService.saveDailyAttendances(cloudDaily);
        }
        setIsOnline(true);
      } catch (err) {
        console.warn('Could not sync with Supabase in background:', err);
        setIsOnline(false);
      }
    }
    setIsLoading(false);
  }, [loadLocalData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Compute detailed attendances for reporting
  const detailedAttendances: AttendanceDetail[] = attendances.map((att) => {
    const student = students.find((s) => s.id === att.student_id);
    const cls = classes.find((c) => c.id === att.class_id);
    const teacher = teachers.find((t) => t.id === att.teacher_id);
    const period = periods.find((p) => p.id === att.period_id);

    return {
      ...att,
      student_name: student?.name || 'Siswa Tidak Dikenal',
      student_nis: student?.nis || '-',
      class_name: cls?.name || '-',
      teacher_name: teacher?.name || '-',
      period_name: period?.name || '-',
    };
  });

  // ==================== CLASS CRUD ====================
  const addClass = async (clsData: Omit<ClassItem, 'id'>): Promise<string> => {
    const newClass: ClassItem = {
      ...clsData,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    const updated = [...classes, newClass];
    setClasses(updated);
    storageService.saveClasses(updated);

    if (supabaseService.isConfigured()) {
      supabaseService.upsertClass(newClass).catch(console.error);
    }
    return newClass.id;
  };

  const updateClass = async (id: string, updates: Partial<ClassItem>): Promise<boolean> => {
    const updated = classes.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setClasses(updated);
    storageService.saveClasses(updated);

    const changedItem = updated.find((c) => c.id === id);
    if (changedItem && supabaseService.isConfigured()) {
      supabaseService.upsertClass(changedItem).catch(console.error);
    }
    return true;
  };

  const deleteClass = async (id: string): Promise<boolean> => {
    const updated = classes.filter((c) => c.id !== id);
    setClasses(updated);
    storageService.saveClasses(updated);

    // Also remove associated students or update their class
    const updatedStudents = students.filter((s) => s.class_id !== id);
    setStudents(updatedStudents);
    storageService.saveStudents(updatedStudents);

    if (supabaseService.isConfigured()) {
      supabaseService.deleteClass(id).catch(console.error);
    }
    return true;
  };

  // ==================== TEACHER CRUD ====================
  const addTeacher = async (teacherData: Omit<TeacherItem, 'id'>): Promise<string> => {
    const newTeacher: TeacherItem = {
      ...teacherData,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    const updated = [...teachers, newTeacher];
    setTeachers(updated);
    storageService.saveTeachers(updated);

    if (supabaseService.isConfigured()) {
      supabaseService.upsertTeacher(newTeacher).catch(console.error);
    }
    return newTeacher.id;
  };

  const updateTeacher = async (id: string, updates: Partial<TeacherItem>): Promise<boolean> => {
    const updated = teachers.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTeachers(updated);
    storageService.saveTeachers(updated);

    const changedItem = updated.find((t) => t.id === id);
    if (changedItem && supabaseService.isConfigured()) {
      supabaseService.upsertTeacher(changedItem).catch(console.error);
    }
    return true;
  };

  const deleteTeacher = async (id: string): Promise<boolean> => {
    const updated = teachers.filter((t) => t.id !== id);
    setTeachers(updated);
    storageService.saveTeachers(updated);

    if (supabaseService.isConfigured()) {
      supabaseService.deleteTeacher(id).catch(console.error);
    }
    return true;
  };

  // ==================== PERIOD CRUD ====================
  const addPeriod = async (periodData: Omit<PeriodItem, 'id'>): Promise<string> => {
    const newPeriod: PeriodItem = {
      ...periodData,
      id: generateId(),
    };
    const updated = [...periods, newPeriod].sort((a, b) => a.period_number - b.period_number);
    setPeriods(updated);
    storageService.savePeriods(updated);

    if (supabaseService.isConfigured()) {
      supabaseService.upsertPeriod(newPeriod).catch(console.error);
    }
    return newPeriod.id;
  };

  const updatePeriod = async (id: string, updates: Partial<PeriodItem>): Promise<boolean> => {
    const updated = periods
      .map((p) => (p.id === id ? { ...p, ...updates } : p))
      .sort((a, b) => a.period_number - b.period_number);
    setPeriods(updated);
    storageService.savePeriods(updated);

    const changedItem = updated.find((p) => p.id === id);
    if (changedItem && supabaseService.isConfigured()) {
      supabaseService.upsertPeriod(changedItem).catch(console.error);
    }
    return true;
  };

  const deletePeriod = async (id: string): Promise<boolean> => {
    const updated = periods.filter((p) => p.id !== id);
    setPeriods(updated);
    storageService.savePeriods(updated);

    if (supabaseService.isConfigured()) {
      supabaseService.deletePeriod(id).catch(console.error);
    }
    return true;
  };

  // ==================== STUDENT CRUD ====================
  const addStudent = async (studentData: Omit<StudentItem, 'id' | 'is_enrolled'>): Promise<string> => {
    const newStudent: StudentItem = {
      ...studentData,
      id: generateId(),
      is_enrolled: false,
      face_descriptor: null,
      created_at: new Date().toISOString(),
    };
    const updated = [...students, newStudent];
    setStudents(updated);
    storageService.saveStudents(updated);

    if (supabaseService.isConfigured()) {
      supabaseService.upsertStudent(newStudent).catch(console.error);
    }
    return newStudent.id;
  };

  const updateStudent = async (id: string, updates: Partial<StudentItem>): Promise<boolean> => {
    const updated = students.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setStudents(updated);
    storageService.saveStudents(updated);

    const changedItem = updated.find((s) => s.id === id);
    if (changedItem && supabaseService.isConfigured()) {
      supabaseService.upsertStudent(changedItem).catch(console.error);
    }
    return true;
  };

  const deleteStudent = async (id: string): Promise<boolean> => {
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    storageService.saveStudents(updated);

    // Also delete student's attendance records
    const updatedAtt = attendances.filter((a) => a.student_id !== id);
    setAttendances(updatedAtt);
    storageService.saveAttendances(updatedAtt);

    if (supabaseService.isConfigured()) {
      supabaseService.deleteStudent(id).catch(console.error);
    }
    return true;
  };

  const enrollStudentFace = async (id: string, descriptor: number[]): Promise<boolean> => {
    const updated = students.map((s) =>
      s.id === id
        ? {
            ...s,
            face_descriptor: descriptor,
            is_enrolled: true,
            enrolled_at: new Date().toISOString(),
          }
        : s
    );
    setStudents(updated);
    storageService.saveStudents(updated);

    const changedItem = updated.find((s) => s.id === id);
    if (changedItem && supabaseService.isConfigured()) {
      supabaseService.upsertStudent(changedItem).catch(console.error);
    }
    return true;
  };

  const clearStudentFace = async (id: string): Promise<boolean> => {
    const updated = students.map((s) =>
      s.id === id
        ? {
            ...s,
            face_descriptor: null,
            is_enrolled: false,
            enrolled_at: undefined,
          }
        : s
    );
    setStudents(updated);
    storageService.saveStudents(updated);

    const changedItem = updated.find((s) => s.id === id);
    if (changedItem && supabaseService.isConfigured()) {
      supabaseService.upsertStudent(changedItem).catch(console.error);
    }
    return true;
  };

  // Helper to sync Daily Attendance Matrix row (| nama siswa | jam ke 1 | ... | jam N |)
  const syncDailyAttendanceRow = (
    studentId: string,
    date: string,
    currentAttendances: AttendanceItem[]
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    const cls = classes.find((c) => c.id === student.class_id);
    const className = cls?.name || 'Kelas';

    const studentAttsOnDate = currentAttendances.filter(
      (a) => a.student_id === studentId && a.date === date
    );

    const dailyRow = storageService.computeDailyRow(
      student,
      className,
      date,
      studentAttsOnDate
    );

    setDailyAttendances((prev) => {
      const idx = prev.findIndex((d) => d.id === dailyRow.id);
      let nextDaily: DailyAttendanceItem[];
      if (idx >= 0) {
        nextDaily = [...prev];
        nextDaily[idx] = dailyRow;
      } else {
        nextDaily = [dailyRow, ...prev];
      }
      storageService.saveDailyAttendances(nextDaily);
      return nextDaily;
    });

    if (supabaseService.isConfigured()) {
      supabaseService.upsertDailyAttendance(dailyRow).catch(console.error);
    }
  };

  // ==================== ATTENDANCE CRUD ====================
  const saveAttendanceRecord = async (
    record: Omit<AttendanceItem, 'id' | 'created_at'>
  ): Promise<string> => {
    // Check if an existing record exists for this student on the same date and period
    const existingIndex = attendances.findIndex(
      (a) =>
        a.student_id === record.student_id &&
        a.date === record.date &&
        (record.period_id ? a.period_id === record.period_id : true)
    );

    let finalId: string;
    let updated: AttendanceItem[];

    if (existingIndex >= 0) {
      finalId = attendances[existingIndex].id;
      const updatedItem: AttendanceItem = {
        ...attendances[existingIndex],
        ...record,
        id: finalId,
      };
      updated = [...attendances];
      updated[existingIndex] = updatedItem;
      setAttendances(updated);
      storageService.saveAttendances(updated);

      if (supabaseService.isConfigured()) {
        supabaseService.upsertAttendance(updatedItem).catch(console.error);
      }
    } else {
      finalId = generateId();
      const newItem: AttendanceItem = {
        ...record,
        id: finalId,
        created_at: new Date().toISOString(),
      };
      updated = [newItem, ...attendances];
      setAttendances(updated);
      storageService.saveAttendances(updated);

      if (supabaseService.isConfigured()) {
        supabaseService.upsertAttendance(newItem).catch(console.error);
      }
    }

    // Always update database daily matrix row: | nama siswa | jam ke 1 | jam ke 2 | ... | jam N |
    syncDailyAttendanceRow(record.student_id, record.date, updated);

    return finalId;
  };

  const updateAttendanceRecord = async (
    id: string,
    updates: Partial<AttendanceItem>
  ): Promise<boolean> => {
    const updated = attendances.map((a) => (a.id === id ? { ...a, ...updates } : a));
    setAttendances(updated);
    storageService.saveAttendances(updated);

    const changedItem = updated.find((a) => a.id === id);
    if (changedItem) {
      if (supabaseService.isConfigured()) {
        supabaseService.upsertAttendance(changedItem).catch(console.error);
      }
      syncDailyAttendanceRow(changedItem.student_id, changedItem.date, updated);
    }
    return true;
  };

  const deleteAttendanceRecord = async (id: string): Promise<boolean> => {
    const target = attendances.find((a) => a.id === id);
    const updated = attendances.filter((a) => a.id !== id);
    setAttendances(updated);
    storageService.saveAttendances(updated);

    if (supabaseService.isConfigured()) {
      supabaseService.deleteAttendance(id).catch(console.error);
    }

    if (target) {
      syncDailyAttendanceRow(target.student_id, target.date, updated);
    }
    return true;
  };

  // Sync all local data up to Supabase
  const syncWithSupabase = async (): Promise<{ success: boolean; message: string }> => {
    if (!supabaseService.isConfigured()) {
      return { success: false, message: 'Supabase belum dikonfigurasi.' };
    }

    try {
      // Test connection first
      const test = await supabaseService.testConnection();
      if (!test.success) return test;

      // Push classes
      for (const c of classes) {
        await supabaseService.upsertClass(c);
      }
      // Push teachers
      for (const t of teachers) {
        await supabaseService.upsertTeacher(t);
      }
      // Push periods
      for (const p of periods) {
        await supabaseService.upsertPeriod(p);
      }
      // Push students
      for (const s of students) {
        await supabaseService.upsertStudent(s);
      }
      // Push attendances
      for (const a of attendances) {
        await supabaseService.upsertAttendance(a);
      }
      // Push daily attendances matrix (| nama siswa | jam ke 1 | ... | jam N |)
      for (const d of dailyAttendances) {
        await supabaseService.upsertDailyAttendance(d);
      }

      await refreshData();
      return { success: true, message: 'Sinkronisasi berhasil! Semua data tersimpan di Supabase.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Gagal sinkronisasi: ${msg}` };
    }
  };

  const resetToSampleData = () => {
    storageService.resetDefaults();
    loadLocalData();
  };

  return (
    <AppContext.Provider
      value={{
        classes,
        teachers,
        periods,
        students,
        attendances,
        dailyAttendances,
        detailedAttendances,
        isLoading,
        isSupabaseConfigured,
        isOnline,
        activeTab,
        setActiveTab,
        addClass,
        updateClass,
        deleteClass,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addPeriod,
        updatePeriod,
        deletePeriod,
        addStudent,
        updateStudent,
        deleteStudent,
        enrollStudentFace,
        clearStudentFace,
        saveAttendanceRecord,
        updateAttendanceRecord,
        deleteAttendanceRecord,
        refreshData,
        syncWithSupabase,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
