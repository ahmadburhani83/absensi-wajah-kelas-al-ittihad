import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Download,
  Printer,
  Search,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import type { AttendanceStatus, AttendanceDetail, AttendanceMethod } from '../types';

export const RekapView: React.FC = () => {
  const {
    classes,
    teachers,
    periods,
    students,
    detailedAttendances,
    saveAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
  } = useApp();

  // Filters
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterPeriodId, setFilterPeriodId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AttendanceDetail | null>(null);

  // Form states for Add/Edit
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formClassId, setFormClassId] = useState<string>(classes[0]?.id || '');
  const [formTeacherId, setFormTeacherId] = useState<string>(teachers[0]?.id || '');
  const [formPeriodId, setFormPeriodId] = useState<string>(periods[0]?.id || '');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<AttendanceStatus>('hadir');
  const [formMethod, setFormMethod] = useState<AttendanceMethod>('manual');
  const [formNotes, setFormNotes] = useState<string>('');

  // Apply filters
  const filteredData = detailedAttendances.filter((item) => {
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

  // Calculate statistics
  const total = filteredData.length;
  const hadir = filteredData.filter((i) => i.status === 'hadir').length;
  const izin = filteredData.filter((i) => i.status === 'izin').length;
  const sakit = filteredData.filter((i) => i.status === 'sakit').length;
  const alpa = filteredData.filter((i) => i.status === 'alpa').length;
  const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;

  // Selected class metadata for report header
  const currentClassObj = classes.find((c) => c.id === filterClassId);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data absensi untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Tanggal',
      'Waktu Scan',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Jam Pelajaran',
      'Guru Pengajar',
      'Status',
      'Akurasi Scan',
      'Metode',
      'Keterangan',
    ];

    const rows = filteredData.map((item, idx) => [
      idx + 1,
      item.date,
      item.scan_time,
      `'${item.student_nis}`,
      `"${item.student_name}"`,
      `"${item.class_name}"`,
      `"${item.period_name || '-'}"`,
      `"${item.teacher_name || '-'}"`,
      item.status.toUpperCase(),
      item.confidence_score ? `${item.confidence_score}%` : '-',
      item.method,
      `"${item.notes || ''}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `Rekap_Presensi_${filterClassId !== 'all' ? currentClassObj?.name || 'Kelas' : 'Semua'}_${
      filterDate || 'SemuaTanggal'
    }.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Edit Modal
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
    setFormDate(new Date().toISOString().split('T')[0]);
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

    await saveAttendanceRecord({
      student_id: formStudentId,
      class_id: classId,
      teacher_id: formTeacherId || undefined,
      period_id: formPeriodId || undefined,
      date: formDate,
      scan_time: nowTime,
      status: formStatus,
      method: formMethod,
      notes: formNotes || undefined,
    });
    setIsAddModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus data presensi untuk siswa ${name}?`)) {
      await deleteAttendanceRecord(id);
    }
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Printable Official Document Header (Visible ONLY when printing) */}
      <div className="print-only" style={{ display: 'none', marginBottom: '24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase' }}>
          BERITA ACARA & REKAPITULASI PRESENSI KELAS
        </h2>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '4px' }}>
          SMA / SMK NEGERI PEMBELAJARAN DIGITAL
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '4px' }}>
          Tahun Ajaran 2026/2027 • Sistem Absensi Presensi Pintar Biometrik
        </p>
        <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', textAlign: 'left', marginBottom: '14px' }}>
          <div>
            <p><strong>Kelas:</strong> {currentClassObj?.name || 'Semua Kelas'}</p>
            <p><strong>Wali Kelas:</strong> {currentClassObj?.homeroom_teacher || '-'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p><strong>Tanggal:</strong> {filterDate || 'Semua Periode'}</p>
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
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', lineHeight: '1.2' }}>
            Rekap Absensi <span style={{ color: '#10b981' }}>Berdasarkan Kelas</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Laporan lengkap kehadiran siswa, verifikasi scan wajah, edit & cetak berita acara
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleOpenAdd} className="btn btn-emerald">
            <Plus size={16} />
            <span>Input Presensi Manual</span>
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download size={16} />
            <span>Ekspor Excel / CSV</span>
          </button>
          <button onClick={() => window.print()} className="btn btn-primary">
            <Printer size={16} />
            <span>Cetak Rekap / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Hidden on print) */}
      <div
        className="glass-panel no-print"
        style={{
          padding: '20px',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          alignItems: 'center',
        }}
      >
        {/* Filter Kelas */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Filter Kelas</label>
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
          <label className="form-label">Filter Tanggal</label>
          <input
            type="date"
            className="form-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        {/* Filter Jam Pelajaran */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Jam Pelajaran</label>
          <select
            className="form-select"
            value={filterPeriodId}
            onChange={(e) => setFilterPeriodId(e.target.value)}
          >
            <option value="all">Semua Jam</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.start_time}-{p.end_time})
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Status Kehadiran</label>
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

        {/* Search Query */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Cari Nama / NIS</label>
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
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <div className="glass-panel" style={{ padding: '16px' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL REKAP</p>
          <h3 style={{ fontSize: '1.5rem', marginTop: '4px' }}>{total}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '16px', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399' }}>HADIR</p>
          <h3 style={{ fontSize: '1.5rem', marginTop: '4px', color: '#34d399' }}>{hadir}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '16px', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60a5fa' }}>IZIN</p>
          <h3 style={{ fontSize: '1.5rem', marginTop: '4px', color: '#60a5fa' }}>{izin}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '16px', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24' }}>SAKIT</p>
          <h3 style={{ fontSize: '1.5rem', marginTop: '4px', color: '#fbbf24' }}>{sakit}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '16px', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fb7185' }}>ALPA</p>
          <h3 style={{ fontSize: '1.5rem', marginTop: '4px', color: '#fb7185' }}>{alpa}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>% KEHADIRAN</p>
          <h3 style={{ fontSize: '1.5rem', marginTop: '4px', color: '#38bdf8' }}>{rate}%</h3>
        </div>
      </div>

      {/* Main Table */}
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
                <th className="no-print" style={{ textAlign: 'center', width: '90px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Tidak ada data presensi yang sesuai dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
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
                    <td>{item.period_name || '-'}</td>
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

      {/* Print Signatures Block (Visible ONLY when printing) */}
      <div
        className="print-only"
        style={{
          display: 'none',
          marginTop: '40px',
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

      {/* Modal Edit Presensi */}
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
    </div>
  );
};
