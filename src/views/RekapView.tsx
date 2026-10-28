import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Download,
  Printer,
  Search,
  Plus,
  Edit,
  Trash2,
  Grid3X3,
  List,
} from 'lucide-react';
import type { AttendanceStatus, AttendanceDetail, AttendanceMethod } from '../types';

export const RekapView: React.FC = () => {
  const {
    classes,
    teachers,
    periods,
    students,
    attendances,
    detailedAttendances,
    saveAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
  } = useApp();

  // View Mode: 'matrix' (Nama Siswa x Jam Ke 1 s/d N) or 'list' (Log detail)
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');

  // Filters
  const [filterClassId, setFilterClassId] = useState<string>(classes[0]?.id || 'all');
  const [filterDate, setFilterDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterPeriodId, setFilterPeriodId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AttendanceDetail | null>(null);

  // Cell quick edit modal for matrix view
  const [matrixCellEdit, setMatrixCellEdit] = useState<{
    studentId: string;
    studentName: string;
    periodNumber: number;
    currentStatus?: AttendanceStatus;
    notes?: string;
  } | null>(null);

  // Form states for Add/Edit
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formClassId, setFormClassId] = useState<string>(classes[0]?.id || '');
  const [formTeacherId, setFormTeacherId] = useState<string>(teachers[0]?.id || '');
  const [formPeriodId, setFormPeriodId] = useState<string>(periods[0]?.id || '');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<AttendanceStatus>('hadir');
  const [formMethod, setFormMethod] = useState<AttendanceMethod>('manual');
  const [formNotes, setFormNotes] = useState<string>('');

  // Calculate distinct individual lesson hours from active periods (e.g. 1, 2, 3, 4, 5, 6, 7, 8, 9)
  const individualHours = useMemo(() => {
    let maxHour = 8;
    periods.forEach((p) => {
      const end = p.period_end_number || p.period_number;
      if (end > maxHour) maxHour = end;
    });
    // Create array [1, 2, 3, ..., maxHour]
    const hours: number[] = [];
    for (let i = 1; i <= maxHour; i++) {
      hours.push(i);
    }
    return hours;
  }, [periods]);

  // Filter students for the Matrix view
  const matrixStudents = useMemo(() => {
    return students.filter((s) => {
      if (filterClassId !== 'all' && s.class_id !== filterClassId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q);
      }
      return true;
    });
  }, [students, filterClassId, searchQuery]);

  // Lookup attendance record for a student on filterDate for a specific hour (1..N)
  const getAttendanceForHour = (studentId: string, hourNum: number) => {
    return attendances.find((a) => {
      if (a.student_id !== studentId || a.date !== filterDate) return false;

      // 1. Direct period_number range match
      if (a.period_number) {
        const end = a.period_end_number || a.period_number;
        if (hourNum >= a.period_number && hourNum <= end) return true;
      }

      // 2. Fallback to period_id lookup in periods list
      if (a.period_id) {
        const matchedPeriod = periods.find((p) => p.id === a.period_id);
        if (matchedPeriod) {
          const end = matchedPeriod.period_end_number || matchedPeriod.period_number;
          if (hourNum >= matchedPeriod.period_number && hourNum <= end) return true;
        }
      }

      return false;
    });
  };

  // Filtered data for the List / Log view
  const filteredListData = detailedAttendances.filter((item) => {
    if (filterClassId !== 'all' && item.class_id !== filterClassId) return false;
    if (filterDate && item.date !== filterDate) return false;
    if (filterPeriodId !== 'all' && item.period_id !== filterPeriodId) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.student_name.toLowerCase().includes(q);
      const matchNis = item.student_nis.toLowerCase().includes(q);
      const matchClass = item.class_name.toLowerCase().includes(q);
      if (!matchName && !matchNis && !matchClass) return false;
    }
    return true;
  });

  // Calculate statistics for the selected class & date
  const todayClassAttendances = attendances.filter(
    (a) => (filterClassId === 'all' || a.class_id === filterClassId) && a.date === filterDate
  );

  const totalRecs = todayClassAttendances.length;
  const hadirCount = todayClassAttendances.filter((i) => i.status === 'hadir').length;
  const izinCount = todayClassAttendances.filter((i) => i.status === 'izin').length;
  const sakitCount = todayClassAttendances.filter((i) => i.status === 'sakit').length;
  const alpaCount = todayClassAttendances.filter((i) => i.status === 'alpa').length;
  const rate = totalRecs > 0 ? Math.round((hadirCount / totalRecs) * 100) : 0;

  const currentClassObj = classes.find((c) => c.id === filterClassId);

  // Export Matrix CSV
  const handleExportMatrixCSV = () => {
    if (matrixStudents.length === 0) {
      alert('Tidak ada data siswa untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'L/P',
      'Kelas',
      'Tanggal',
      ...individualHours.map((h) => `Jam Ke-${h}`),
      'Total Hadir',
      'Total Izin',
      'Total Sakit',
      'Total Alpa',
      '% Kehadiran',
    ];

    const rows = matrixStudents.map((s, idx) => {
      const cls = classes.find((c) => c.id === s.class_id);
      let sHadir = 0;
      let sIzin = 0;
      let sSakit = 0;
      let sAlpa = 0;

      const hourCells = individualHours.map((h) => {
        const att = getAttendanceForHour(s.id, h);
        if (!att) return '-';
        if (att.status === 'hadir') {
          sHadir++;
          return 'H';
        }
        if (att.status === 'izin') {
          sIzin++;
          return 'I';
        }
        if (att.status === 'sakit') {
          sSakit++;
          return 'S';
        }
        if (att.status === 'alpa') {
          sAlpa++;
          return 'A';
        }
        return '-';
      });

      const totalRecorded = sHadir + sIzin + sSakit + sAlpa;
      const pct = totalRecorded > 0 ? `${Math.round((sHadir / totalRecorded) * 100)}%` : '0%';

      return [
        idx + 1,
        `'${s.nis}`,
        `"${s.name}"`,
        s.gender,
        `"${cls?.name || '-'}"`,
        filterDate,
        ...hourCells,
        sHadir,
        sIzin,
        sSakit,
        sAlpa,
        pct,
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `Rekap_Matriks_Absensi_${currentClassObj?.name || 'SemuaKelas'}_${filterDate}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Edit Modal (List view)
  const handleOpenEdit = (item: AttendanceDetail) => {
    setEditingItem(item);
    setFormStatus(item.status);
    setFormNotes(item.notes || '');
    setFormPeriodId(item.period_id || periods[0]?.id || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    await updateAttendanceRecord(editingItem.id, {
      status: formStatus,
      period_id: formPeriodId,
      notes: formNotes,
    });
    setEditingItem(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormStudentId(students[0]?.id || '');
    setFormClassId(filterClassId !== 'all' ? filterClassId : classes[0]?.id || '');
    setFormTeacherId(teachers[0]?.id || '');
    setFormPeriodId(periods[0]?.id || '');
    setFormDate(filterDate || new Date().toISOString().split('T')[0]);
    setFormStatus('hadir');
    setFormMethod('manual');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async () => {
    if (!formStudentId) {
      alert('Pilih siswa terlebih dahulu!');
      return;
    }
    const student = students.find((s) => s.id === formStudentId);
    const classId = student ? student.class_id : formClassId;
    const nowTime = new Date().toTimeString().split(' ')[0];

    const curPeriod = periods.find((p) => p.id === formPeriodId);
    const startNum = curPeriod?.period_number || 1;
    const endNum = curPeriod?.period_end_number || startNum;

    await saveAttendanceRecord({
      student_id: formStudentId,
      class_id: classId,
      teacher_id: formTeacherId || undefined,
      period_id: formPeriodId || undefined,
      period_number: startNum,
      period_end_number: endNum,
      date: formDate,
      scan_time: nowTime,
      status: formStatus,
      method: formMethod,
      notes: formNotes || undefined,
    });
    setIsAddModalOpen(false);
  };

  // Quick cell click on Matrix view
  const handleCellClick = (studentId: string, studentName: string, hourNum: number) => {
    const existing = getAttendanceForHour(studentId, hourNum);
    setMatrixCellEdit({
      studentId,
      studentName,
      periodNumber: hourNum,
      currentStatus: existing?.status || 'hadir',
      notes: existing?.notes || '',
    });
  };

  const handleSaveCellEdit = async () => {
    if (!matrixCellEdit) return;
    const nowTime = new Date().toTimeString().split(' ')[0];
    const student = students.find((s) => s.id === matrixCellEdit.studentId);
    if (!student) return;

    // Find if there's a period matching this hour
    const matchedPeriod = periods.find(
      (p) =>
        matrixCellEdit.periodNumber >= p.period_number &&
        matrixCellEdit.periodNumber <= (p.period_end_number || p.period_number)
    );

    await saveAttendanceRecord({
      student_id: matrixCellEdit.studentId,
      class_id: student.class_id,
      period_id: matchedPeriod?.id || undefined,
      period_number: matrixCellEdit.periodNumber,
      period_end_number: matrixCellEdit.periodNumber,
      date: filterDate,
      scan_time: nowTime,
      status: matrixCellEdit.currentStatus || 'hadir',
      method: 'manual',
      notes: matrixCellEdit.notes || undefined,
    });
    setMatrixCellEdit(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus data presensi untuk siswa ${name}?`)) {
      await deleteAttendanceRecord(id);
    }
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1500px', margin: '0 auto' }}>
      {/* Printable Official Document Header (Visible ONLY when printing) */}
      <div className="print-only" style={{ display: 'none', marginBottom: '24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase' }}>
          BERITA ACARA & MATRIKS REKAPITULASI PRESENSI KELAS
        </h2>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '2px' }}>
          SISTEM PRESENSI WAJAH BIOMETRIK CERDAS
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '2px' }}>
          Tahun Ajaran 2026/2027 • Format Matriks Jam Pelajaran
        </p>
        <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', textAlign: 'left', marginBottom: '12px' }}>
          <div>
            <p><strong>Kelas:</strong> {currentClassObj?.name || 'Semua Kelas'} ({currentClassObj?.major || ''})</p>
            <p><strong>Wali Kelas:</strong> {currentClassObj?.homeroom_teacher || '-'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p><strong>Tanggal:</strong> {filterDate}</p>
            <p><strong>Dicetak Pada:</strong> {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Screen Page Header (Hidden on print) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', lineHeight: '1.2' }}>
            Rekap Absensi <span style={{ color: '#10b981' }}>Berdasarkan Kelas</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Format Matriks Jam Pelajaran: <strong>Nama Siswa | Jam Ke-1 | Jam Ke-2 | ... | Jam Ke-N</strong>
          </p>
        </div>

        {/* View Switcher Tabs & Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Mode Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setViewMode('matrix')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.8125rem',
                borderRadius: '8px',
                background: viewMode === 'matrix' ? '#10b981' : 'transparent',
                color: '#fff',
              }}
            >
              <Grid3X3 size={15} />
              <span>Matriks Jam Pelajaran</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.8125rem',
                borderRadius: '8px',
                background: viewMode === 'list' ? '#3b82f6' : 'transparent',
                color: '#fff',
              }}
            >
              <List size={15} />
              <span>Log Riwayat</span>
            </button>
          </div>

          <button onClick={handleOpenAdd} className="btn btn-emerald">
            <Plus size={16} />
            <span>Input Presensi</span>
          </button>
          <button onClick={handleExportMatrixCSV} className="btn btn-secondary">
            <Download size={16} />
            <span>Ekspor Excel/CSV</span>
          </button>
          <button onClick={() => window.print()} className="btn btn-primary">
            <Printer size={16} />
            <span>Cetak Berita Acara</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Hidden on print) */}
      <div
        className="glass-panel no-print"
        style={{
          padding: '18px 20px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          alignItems: 'center',
        }}
      >
        {/* Filter Kelas */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Pilih Kelas *</label>
          <select
            className="form-select"
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
          >
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.major})
              </option>
            ))}
          </select>
        </div>

        {/* Filter Tanggal */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Tanggal Presensi *</label>
          <input
            type="date"
            className="form-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        {/* Search Siswa */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Cari Nama Siswa / NIS</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ketik nama atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        {viewMode === 'list' && (
          <>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Filter Jam Pelajaran</label>
              <select
                className="form-select"
                value={filterPeriodId}
                onChange={(e) => setFilterPeriodId(e.target.value)}
              >
                <option value="all">Semua Jam</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Filter Status</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="hadir">Hadir</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
                <option value="alpa">Alpa</option>
              </select>
            </div>
          </>
        )}

        {/* Info Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Keterangan Status:</span>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#34d399', fontWeight: 700 }}>H = Hadir</span>
            <span style={{ color: '#60a5fa', fontWeight: 700 }}>I = Izin</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>S = Sakit</span>
            <span style={{ color: '#fb7185', fontWeight: 700 }}>A = Alpa</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div className="glass-panel" style={{ padding: '14px' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL PRESENSI</p>
          <h3 style={{ fontSize: '1.375rem', marginTop: '2px' }}>{totalRecs}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '14px', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#34d399' }}>HADIR (H)</p>
          <h3 style={{ fontSize: '1.375rem', marginTop: '2px', color: '#34d399' }}>{hadirCount}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '14px', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#60a5fa' }}>IZIN (I)</p>
          <h3 style={{ fontSize: '1.375rem', marginTop: '2px', color: '#60a5fa' }}>{izinCount}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '14px', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#fbbf24' }}>SAKIT (S)</p>
          <h3 style={{ fontSize: '1.375rem', marginTop: '2px', color: '#fbbf24' }}>{sakitCount}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '14px', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#fb7185' }}>ALPA (A)</p>
          <h3 style={{ fontSize: '1.375rem', marginTop: '2px', color: '#fb7185' }}>{alpaCount}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '14px' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)' }}>% KEHADIRAN</p>
          <h3 style={{ fontSize: '1.375rem', marginTop: '2px', color: '#38bdf8' }}>{rate}%</h3>
        </div>
      </div>

      {/* VIEW 1: MATRIX JAM PELAJARAN (Nama Siswa | Jam 1 | Jam 2 | Jam 3 | ... | Jam N) */}
      {viewMode === 'matrix' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Grid3X3 size={18} color="#10b981" />
              <h3 style={{ fontSize: '1.125rem' }}>
                Matriks Kehadiran Siswa per Jam Pelajaran
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Klik pada kotak jam siswa untuk mengubah status atau menambah catatan
            </span>
          </div>

          <div className="table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: '38px', textAlign: 'center' }}>No</th>
                  <th style={{ minWidth: '85px' }}>NIS</th>
                  <th className="sticky-col-th" style={{ minWidth: '160px', left: 0 }}>Nama Siswa</th>
                  <th style={{ width: '40px', textAlign: 'center' }}>L/P</th>

                  {/* Dynamic Period Columns: Jam 1, Jam 2, Jam 3, ..., Jam N */}
                  {individualHours.map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'center',
                        minWidth: '58px',
                        background: 'rgba(30, 41, 59, 0.7)',
                        color: '#38bdf8',
                        padding: '8px 4px',
                      }}
                      title={`Jam Pelajaran Ke-${h}`}
                    >
                      <div>Jam {h}</div>
                    </th>
                  ))}

                  {/* Summary Columns */}
                  <th style={{ textAlign: 'center', minWidth: '40px', color: '#34d399' }}>H</th>
                  <th style={{ textAlign: 'center', minWidth: '40px', color: '#60a5fa' }}>I</th>
                  <th style={{ textAlign: 'center', minWidth: '40px', color: '#fbbf24' }}>S</th>
                  <th style={{ textAlign: 'center', minWidth: '40px', color: '#fb7185' }}>A</th>
                  <th style={{ textAlign: 'center', minWidth: '55px' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {matrixStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={individualHours.length + 9}
                      style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}
                    >
                      Tidak ada data siswa untuk kelas yang dipilih.
                    </td>
                  </tr>
                ) : (
                  matrixStudents.map((student, idx) => {
                    let sHadir = 0;
                    let sIzin = 0;
                    let sSakit = 0;
                    let sAlpa = 0;

                    return (
                      <tr key={student.id}>
                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                          {student.nis}
                        </td>
                        <td className="sticky-col-student" style={{ fontWeight: 600, left: 0 }}>
                          {student.name}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.8125rem' }}>
                          {student.gender}
                        </td>

                        {/* Hour status cells */}
                        {individualHours.map((h) => {
                          const att = getAttendanceForHour(student.id, h);
                          if (att) {
                            if (att.status === 'hadir') sHadir++;
                            else if (att.status === 'izin') sIzin++;
                            else if (att.status === 'sakit') sSakit++;
                            else if (att.status === 'alpa') sAlpa++;
                          }

                          return (
                            <td
                              key={h}
                              style={{ textAlign: 'center', padding: '6px 4px' }}
                              onClick={() => handleCellClick(student.id, student.name, h)}
                            >
                              {att ? (
                                <span
                                  className={`badge badge-${att.status}`}
                                  style={{
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 800,
                                  }}
                                  title={`Jam ${h}: ${att.status.toUpperCase()} (${att.scan_time || ''}) ${
                                    att.notes ? '• ' + att.notes : ''
                                  } - Klik untuk ubah`}
                                >
                                  {att.status === 'hadir' && 'H'}
                                  {att.status === 'izin' && 'I'}
                                  {att.status === 'sakit' && 'S'}
                                  {att.status === 'alpa' && 'A'}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: '26px',
                                    height: '24px',
                                    lineHeight: '24px',
                                    borderRadius: '4px',
                                    color: 'var(--text-dim)',
                                    cursor: 'pointer',
                                    fontSize: '0.8125rem',
                                  }}
                                  title={`Jam ${h}: Belum diabsen - Klik untuk input`}
                                >
                                  -
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Totals */}
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#34d399' }}>
                          {sHadir}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#60a5fa' }}>
                          {sIzin}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#fbbf24' }}>
                          {sSakit}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#fb7185' }}>
                          {sAlpa}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#38bdf8' }}>
                          {sHadir + sIzin + sSakit + sAlpa > 0
                            ? `${Math.round(
                                (sHadir / (sHadir + sIzin + sSakit + sAlpa)) * 100
                              )}%`
                            : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: LOG DETAIL PRESENSI */}
      {viewMode === 'list' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div className="table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Tanggal & Waktu</th>
                  <th>Siswa</th>
                  <th>Kelas</th>
                  <th>Jam Pelajaran</th>
                  <th>Guru</th>
                  <th>Status</th>
                  <th>Metode</th>
                  <th>Catatan</th>
                  <th className="no-print" style={{ textAlign: 'center', width: '90px' }}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredListData.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Tidak ada data presensi yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredListData.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.date}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {item.scan_time}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.student_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          NIS: {item.student_nis}
                        </div>
                      </td>
                      <td>{item.class_name}</td>
                      <td>
                        {item.period_name ||
                          (item.period_number
                            ? `Jam Ke-${item.period_number}${
                                item.period_end_number && item.period_end_number > item.period_number
                                  ? '-' + item.period_end_number
                                  : ''
                              }`
                            : '-')}
                      </td>
                      <td>{item.teacher_name || '-'}</td>
                      <td>
                        <span className={`badge badge-${item.status}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: item.method === 'face_scan' ? '#34d399' : 'var(--text-muted)' }}>
                          {item.method === 'face_scan' ? 'Face Scan' : 'Manual'}
                          {item.confidence_score ? ` (${item.confidence_score}%)` : ''}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: item.notes ? 'var(--text-main)' : 'var(--text-dim)' }}>
                          {item.notes || '-'}
                        </span>
                      </td>
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Presensi"
                            className="btn btn-secondary btn-icon"
                            style={{ width: '32px', height: '32px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.student_name)}
                            title="Hapus Presensi"
                            className="btn btn-danger btn-icon"
                            style={{ width: '32px', height: '32px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Signatures Block (Visible ONLY when printing) */}
      <div
        className="print-only"
        style={{
          display: 'none',
          marginTop: '36px',
          pageBreakInside: 'avoid',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px', textAlign: 'center' }}>
          <div>
            <p>Mengetahui,</p>
            <p>Wali Kelas {currentClassObj?.name || ''}</p>
            <div style={{ height: '70px' }} />
            <p style={{ fontWeight: 700, textDecoration: 'underline' }}>
              {currentClassObj?.homeroom_teacher || '(.........................................)'}
            </p>
            <p style={{ fontSize: '0.8rem' }}>NIP. ........................................</p>
          </div>

          <div>
            <p>Guru Mata Pelajaran,</p>
            <div style={{ height: '70px' }} />
            <p style={{ fontWeight: 700, textDecoration: 'underline' }}>
              (.........................................)
            </p>
            <p style={{ fontSize: '0.8rem' }}>NIP. ........................................</p>
          </div>
        </div>
      </div>

      {/* Quick Matrix Cell Edit Modal */}
      {matrixCellEdit && (
        <div className="modal-backdrop" onClick={() => setMatrixCellEdit(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '6px', fontSize: '1.25rem' }}>
              Ubah Status Jam Ke-{matrixCellEdit.periodNumber}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Siswa: <strong>{matrixCellEdit.studentName}</strong> • Tanggal: {filterDate}
            </p>

            <div className="form-group">
              <label className="form-label">Status Kehadiran</label>
              <select
                className="form-select"
                value={matrixCellEdit.currentStatus || 'hadir'}
                onChange={(e) =>
                  setMatrixCellEdit({
                    ...matrixCellEdit,
                    currentStatus: e.target.value as AttendanceStatus,
                  })
                }
              >
                <option value="hadir">Hadir (H)</option>
                <option value="izin">Izin (I)</option>
                <option value="sakit">Sakit (S)</option>
                <option value="alpa">Alpa (A)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Catatan / Keterangan (Opsional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Misal: Izin olimpiade / Sakit demam"
                value={matrixCellEdit.notes || ''}
                onChange={(e) =>
                  setMatrixCellEdit({ ...matrixCellEdit, notes: e.target.value })
                }
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setMatrixCellEdit(null)} className="btn btn-secondary">
                Batal
              </button>
              <button onClick={handleSaveCellEdit} className="btn btn-emerald">
                Simpan Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Presensi Manual */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>
              Input Presensi Manual
            </h3>

            <div className="form-group">
              <label className="form-label">Pilih Siswa</label>
              <select
                className="form-select"
                value={formStudentId}
                onChange={(e) => setFormStudentId(e.target.value)}
              >
                {students.map((s) => {
                  const cls = classes.find((c) => c.id === s.class_id);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({cls?.name || 'Kelas -'} • NIS: {s.nis})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Guru Pengajar</label>
              <select
                className="form-select"
                value={formTeacherId}
                onChange={(e) => setFormTeacherId(e.target.value)}
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subject})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Jam Pelajaran</label>
              <select
                className="form-select"
                value={formPeriodId}
                onChange={(e) => setFormPeriodId(e.target.value)}
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.start_time} - {p.end_time})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tanggal Presensi</label>
              <input
                type="date"
                className="form-input"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as AttendanceStatus)}
              >
                <option value="hadir">Hadir</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
                <option value="alpa">Alpa</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Catatan / Keterangan</label>
              <input
                type="text"
                className="form-input"
                placeholder="Catatan opsional..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                Batal
              </button>
              <button onClick={handleSaveAdd} className="btn btn-emerald">
                Simpan Presensi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Presensi (List View) */}
      {editingItem && (
        <div className="modal-backdrop" onClick={() => setEditingItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>
              Edit Presensi: {editingItem.student_name}
            </h3>

            <div className="form-group">
              <label className="form-label">Status Presensi</label>
              <select
                className="form-select"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as AttendanceStatus)}
              >
                <option value="hadir">Hadir</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
                <option value="alpa">Alpa</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Jam Pelajaran</label>
              <select
                className="form-select"
                value={formPeriodId}
                onChange={(e) => setFormPeriodId(e.target.value)}
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.start_time} - {p.end_time})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Catatan / Keterangan</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Sakit flu / Izin olimpiade"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setEditingItem(null)} className="btn btn-secondary">
                Batal
              </button>
              <button onClick={handleSaveEdit} className="btn btn-primary">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
