import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { faceRecognitionService } from '../services/faceRecognition';
import { audioFeedback } from '../services/audioFeedback';
import {
  Plus,
  Edit,
  Trash2,
  ScanFace,
  Search,
  CheckCircle2,
  AlertCircle,
  Camera,
  CameraOff,
  ShieldCheck,
  RefreshCw,
  X,
  Upload,
  Download,
  FileCheck,
} from 'lucide-react';
import type { StudentItem, Gender } from '../types';

interface ParsedStudentRow {
  nis: string;
  nisn?: string;
  name: string;
  className: string;
  classId: string;
  gender: Gender;
  isDuplicate: boolean;
  isValid: boolean;
  errorReason?: string;
}

export const StudentsView: React.FC = () => {
  const {
    students,
    classes,
    addStudent,
    updateStudent,
    deleteStudent,
    enrollStudentFace,
    clearStudentFace,
    importStudentsBatch,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [enrollingStudent, setEnrollingStudent] = useState<StudentItem | null>(null);

  // Upload Student State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [defaultImportClassId, setDefaultImportClassId] = useState<string>(classes[0]?.id || '');
  const [rawUploadedText, setRawUploadedText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form Student State
  const [formNis, setFormNis] = useState<string>('');
  const [formNisn, setFormNisn] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formGender, setFormGender] = useState<Gender>('L');
  const [formClassId, setFormClassId] = useState<string>(classes[0]?.id || '');

  // Camera Enrollment State
  const [isEnrollCameraActive, setIsEnrollCameraActive] = useState<boolean>(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedDescriptor, setExtractedDescriptor] = useState<number[] | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (filterClassId !== 'all' && s.class_id !== filterClassId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchNis = s.nis.toLowerCase().includes(q);
      if (!matchName && !matchNis) return false;
    }
    return true;
  });

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormNis('');
    setFormNisn('');
    setFormName('');
    setFormGender('L');
    setFormClassId(filterClassId !== 'all' ? filterClassId : classes[0]?.id || '');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async () => {
    if (!formNis.trim() || !formName.trim() || !formClassId) {
      alert('NIS, Nama, dan Kelas wajib diisi!');
      return;
    }

    // Check duplicate NIS
    if (students.some((s) => s.nis.trim() === formNis.trim())) {
      alert(`Siswa dengan NIS ${formNis} sudah terdaftar!`);
      return;
    }

    await addStudent({
      nis: formNis.trim(),
      nisn: formNisn.trim() || undefined,
      name: formName.trim(),
      gender: formGender,
      class_id: formClassId,
    });
    setIsAddModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (s: StudentItem) => {
    setEditingStudent(s);
    setFormNis(s.nis);
    setFormNisn(s.nisn || '');
    setFormName(s.name);
    setFormGender(s.gender);
    setFormClassId(s.class_id);
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    if (!formNis.trim() || !formName.trim()) {
      alert('NIS dan Nama tidak boleh kosong!');
      return;
    }

    await updateStudent(editingStudent.id, {
      nis: formNis.trim(),
      nisn: formNisn.trim() || undefined,
      name: formName.trim(),
      gender: formGender,
      class_id: formClassId,
    });
    setEditingStudent(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data siswa ${name}? Riwayat presensi terkait juga akan dihapus.`)) {
      await deleteStudent(id);
    }
  };

  // ==================== TEMPLATE & UPLOAD SISWA ====================
  const handleDownloadTemplate = () => {
    const sampleClasses = classes.map((c) => c.name).join(', ') || 'X-RPL-1, X-TKJ-1';
    const csvContent =
`# TEMPLATE IMPORT DATA SISWA - AL-ITTIHAD
# PANDUAN PENGISIAN:
# 1. Baris diawali tanda '#' adalah petunjuk dan otomatis diabaikan saat import.
# 2. Kolom: NIS, NISN, Nama Siswa, Kelas, Jenis Kelamin (L/P)
# 3. Kelas yang tersedia di sistem saat ini: ${sampleClasses}
# 4. Jenis Kelamin isi 'L' (Laki-laki) atau 'P' (Perempuan).
NIS,NISN,Nama Siswa,Kelas,Jenis Kelamin
2026001,0081234561,Ahmad Fauzi,${classes[0]?.name || 'X-RPL-1'},L
2026002,0081234562,Siti Nurhaliza,${classes[0]?.name || 'X-RPL-1'},P
2026003,0081234563,Budi Santoso,${classes[1]?.name || classes[0]?.name || 'X-TKJ-1'},L
2026004,0081234564,Dewi Lestari,${classes[1]?.name || classes[0]?.name || 'X-TKJ-1'},P
`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_siswa_al_ittihad.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCSVContent = (content: string, defaultClassId: string): ParsedStudentRow[] => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    if (lines.length === 0) return [];

    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    const parseLine = (line: string): string[] => {
      const values: string[] = [];
      let inQuote = false;
      let current = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuote = !inQuote;
        } else if (char === separator && !inQuote) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));
      return values;
    };

    const firstRowValues = parseLine(lines[0]).map((v) => v.toLowerCase());
    let startIndex = 0;
    let colNis = 0;
    let colNisn = 1;
    let colName = 2;
    let colClass = 3;
    let colGender = 4;

    const hasHeader = firstRowValues.some(
      (v) => v.includes('nis') || v.includes('nama') || v.includes('siswa') || v.includes('kelas')
    );

    if (hasHeader) {
      startIndex = 1;
      firstRowValues.forEach((col, idx) => {
        if (col === 'nis') colNis = idx;
        else if (col.includes('nisn')) colNisn = idx;
        else if (col.includes('nama')) colName = idx;
        else if (col.includes('kelas') || col.includes('class')) colClass = idx;
        else if (col.includes('kelamin') || col.includes('gender') || col === 'l/p') colGender = idx;
      });
    }

    const parsed: ParsedStudentRow[] = [];
    const seenNisInBatch = new Set<string>();

    for (let i = startIndex; i < lines.length; i++) {
      const parts = parseLine(lines[i]);
      if (parts.length === 0 || parts.every((p) => !p)) continue;

      const nis = (parts[colNis] || '').trim();
      const nisn = parts[colNisn]?.trim() || undefined;
      const name = (parts[colName] || '').trim();
      const rawClass = (parts[colClass] || '').trim();
      const rawGender = (parts[colGender] || 'L').toUpperCase().trim();

      let gender: Gender = 'L';
      if (rawGender.startsWith('P') || rawGender.includes('PEREMPUAN') || rawGender.includes('FEMALE')) {
        gender = 'P';
      }

      let matchedClass = classes.find(
        (c) =>
          c.name.toLowerCase() === rawClass.toLowerCase() ||
          c.id.toLowerCase() === rawClass.toLowerCase()
      );
      if (!matchedClass && defaultClassId) {
        matchedClass = classes.find((c) => c.id === defaultClassId);
      }

      const isValid = Boolean(nis && name && (matchedClass || defaultClassId));
      let errorReason = '';
      if (!nis) errorReason = 'NIS kosong';
      else if (!name) errorReason = 'Nama kosong';
      else if (!matchedClass && !defaultClassId) errorReason = 'Kelas tidak ditemukan';

      const isExisting = students.some((s) => s.nis.trim().toLowerCase() === nis.toLowerCase());
      const isDuplicateInBatch = seenNisInBatch.has(nis.toLowerCase());
      const isDuplicate = isExisting || isDuplicateInBatch;

      if (!isDuplicate && nis) {
        seenNisInBatch.add(nis.toLowerCase());
      }

      parsed.push({
        nis,
        nisn,
        name,
        className: matchedClass?.name || rawClass || 'Kelas Default',
        classId: matchedClass?.id || defaultClassId || classes[0]?.id || '',
        gender,
        isValid: isValid && !isDuplicate,
        isDuplicate,
        errorReason: isDuplicate ? (isExisting ? 'NIS sudah terdaftar' : 'NIS kembar di file') : errorReason,
      });
    }

    return parsed;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      setRawUploadedText(text);
      const defaultClass = defaultImportClassId || classes[0]?.id || '';
      setDefaultImportClassId(defaultClass);
      const results = parseCSVContent(text, defaultClass);
      setParsedRows(results);
      setIsUploadModalOpen(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDefaultClassChange = (newClassId: string) => {
    setDefaultImportClassId(newClassId);
    if (rawUploadedText) {
      const refreshed = parseCSVContent(rawUploadedText, newClassId);
      setParsedRows(refreshed);
    }
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('Tidak ada baris siswa valid untuk di-import.');
      return;
    }

    const payload = validRows.map((r) => ({
      nis: r.nis,
      nisn: r.nisn,
      name: r.name,
      gender: r.gender,
      class_id: r.classId,
    }));

    const result = await importStudentsBatch(payload);
    audioFeedback.playSuccess();
    setIsUploadModalOpen(false);
    alert(
      `Import selesai! Berhasil menambahkan ${result.addedCount} siswa baru.${
        result.skippedCount > 0 ? ` (${result.skippedCount} siswa dilewati karena duplikat).` : ''
      }`
    );
  };

  // Camera Management for Enrollment
  const stopEnrollCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsEnrollCameraActive(false);
  }, []);

  const startEnrollCamera = async () => {
    setEnrollError(null);
    setEnrollSuccessMessage(null);
    try {
      if (!faceRecognitionService.isReady()) {
        await faceRecognitionService.loadModels();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsEnrollCameraActive(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEnrollError(`Kamera gagal dibuka: ${msg}`);
      setIsEnrollCameraActive(false);
    }
  };

  const handleOpenEnroll = async (s: StudentItem) => {
    setEnrollingStudent(s);
    setExtractedDescriptor(null);
    setEnrollSuccessMessage(null);
    setEnrollError(null);
  };

  const handleCloseEnroll = () => {
    stopEnrollCamera();
    setEnrollingStudent(null);
    setExtractedDescriptor(null);
  };

  const handleCaptureFace = async () => {
    if (!videoRef.current) return;
    setIsExtracting(true);
    setEnrollError(null);

    try {
      audioFeedback.playShutter();
      const res = await faceRecognitionService.extractDescriptor(videoRef.current);
      if (!res || !res.descriptor || res.descriptor.length === 0) {
        setEnrollError('Wajah tidak terdeteksi. Pastikan wajah menghadap lurus ke kamera dengan pencahayaan cukup.');
        setIsExtracting(false);
        return;
      }

      setExtractedDescriptor(res.descriptor);
      setEnrollSuccessMessage('Wajah berhasil diekstraksi! Vektor representasi 128-float siap disimpan.');
    } catch (err) {
      setEnrollError('Gagal mendeteksi wajah.');
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveEnrollment = async () => {
    if (!enrollingStudent || !extractedDescriptor) return;
    await enrollStudentFace(enrollingStudent.id, extractedDescriptor);
    audioFeedback.playSuccess();
    handleCloseEnroll();
  };

  const handleClearBiometric = async (studentId: string, name: string) => {
    if (confirm(`Hapus template biometrik wajah siswa ${name}? Siswa harus didaftarkan ulang untuk scan wajah.`)) {
      await clearStudentFace(studentId);
    }
  };

  useEffect(() => {
    return () => {
      stopEnrollCamera();
    };
  }, [stopEnrollCamera]);

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div
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
            Data Siswa & <span style={{ color: '#10b981' }}>Pendaftaran Wajah</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Kelola data murid, kelas, serta pendaftaran biometrik vektor wajah 128-dimensi (tanpa simpan foto)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Download Template CSV */}
          <button
            onClick={handleDownloadTemplate}
            className="btn btn-secondary"
            title="Download Template Format CSV untuk Import Data Siswa"
          >
            <Download size={16} />
            <span>Download Template</span>
          </button>

          {/* Upload Data Siswa */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary"
            title="Upload file CSV data siswa"
          >
            <Upload size={16} />
            <span>Upload Data Siswa</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.txt"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {/* Tambah Siswa Baru */}
          <button onClick={handleOpenAdd} className="btn btn-emerald">
            <Plus size={16} />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '18px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ minWidth: '220px' }}>
            <select
              className="form-select"
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
            >
              <option value="all">Semua Kelas ({students.length} Siswa)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({students.filter((s) => s.class_id === c.id).length} Siswa)
                </option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Cari berdasarkan nama atau NIS..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>Biometrik Standar UU PDP & GDPR Compliant</span>
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="table-container">
          <table className="app-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>No</th>
                <th>NIS / NISN</th>
                <th>Nama Lengkap</th>
                <th>L/P</th>
                <th>Kelas</th>
                <th>Status Wajah (Biometrik)</th>
                <th style={{ textAlign: 'center', width: '220px' }}>Aksi & Pendaftaran</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Tidak ada siswa yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const cls = classes.find((c) => c.id === s.class_id);
                  return (
                    <tr key={s.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.nis}</div>
                        {s.nisn && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            NISN: {s.nisn}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.gender}</td>
                      <td>{cls?.name || '-'}</td>
                      <td>
                        {s.is_enrolled ? (
                          <span className="badge badge-enrolled">
                            <CheckCircle2 size={12} />
                            Wajah Terdaftar
                          </span>
                        ) : (
                          <span className="badge badge-not-enrolled">
                            Belum Didaftarkan
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleOpenEnroll(s)}
                            className={`btn ${s.is_enrolled ? 'btn-secondary' : 'btn-emerald'}`}
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            title="Daftarkan / Scan Ulang Wajah Siswa"
                          >
                            <ScanFace size={14} />
                            <span>{s.is_enrolled ? 'Daftar Ulang' : 'Daftar Wajah'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="btn btn-secondary btn-icon"
                            title="Edit Data Siswa"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className="btn btn-danger btn-icon"
                            title="Hapus Siswa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Siswa */}
      {(isAddModalOpen || editingStudent) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setIsAddModalOpen(false);
            setEditingStudent(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '18px', fontSize: '1.25rem' }}>
              {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            </h3>

            <div className="form-group">
              <label className="form-label">Nomor Induk Siswa (NIS) *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 2024001"
                value={formNis}
                onChange={(e) => setFormNis(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">NISN (Nasional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 0061234567"
                value={formNisn}
                onChange={(e) => setFormNisn(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nama Lengkap Siswa *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Muhammad Rizky Pratama"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jenis Kelamin</label>
              <select
                className="form-select"
                value={formGender}
                onChange={(e) => setFormGender(e.target.value as Gender)}
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Kelas *</label>
              <select
                className="form-select"
                value={formClassId}
                onChange={(e) => setFormClassId(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.major})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                onClick={editingStudent ? handleSaveEdit : handleSaveAdd}
                className="btn btn-primary"
              >
                {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pendaftaran Wajah (Face Biometric Enrollment) */}
      {enrollingStudent && (
        <div className="modal-backdrop" onClick={handleCloseEnroll}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Daftarkan Wajah: {enrollingStudent.name}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  NIS: {enrollingStudent.nis} • Ekstraksi Biometrik 128-dimensi
                </p>
              </div>
              <button onClick={handleCloseEnroll} className="btn btn-secondary btn-icon">
                <X size={16} />
              </button>
            </div>

            {/* Privacy Note */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <ShieldCheck size={16} />
              <span>
                <strong>Aman & Terjamin:</strong> Kamera hanya membaca titik koordinat wajah. Foto/gambar TIDAK PERNAH disimpan atau diunggah ke server.
              </span>
            </div>

            {/* Camera View for Enrollment */}
            <div className="scanner-container" style={{ aspectRatio: '16 / 10', maxHeight: '340px' }}>
              <video
                ref={videoRef}
                className="scanner-video"
                playsInline
                muted
                autoPlay
              />

              {!isEnrollCameraActive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#090d16',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <CameraOff size={32} color="#64748b" style={{ marginBottom: '12px' }} />
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Klik tombol di bawah untuk membuka kamera dan memindai wajah siswa
                  </p>
                  <button onClick={startEnrollCamera} className="btn btn-emerald">
                    <Camera size={16} />
                    <span>Nyalakan Kamera</span>
                  </button>
                </div>
              )}
            </div>

            {/* Alerts */}
            {enrollError && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fda4af',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{enrollError}</span>
              </div>
            )}

            {enrollSuccessMessage && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{enrollSuccessMessage}</span>
              </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                {enrollingStudent.is_enrolled && (
                  <button
                    onClick={() => handleClearBiometric(enrollingStudent.id, enrollingStudent.name)}
                    className="btn btn-danger"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  >
                    Hapus Biometrik Tersimpan
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {isEnrollCameraActive && (
                  <button
                    onClick={handleCaptureFace}
                    disabled={isExtracting}
                    className="btn btn-secondary"
                  >
                    {isExtracting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Menganalisis...</span>
                      </>
                    ) : (
                      <>
                        <ScanFace size={16} />
                        <span>Pindai Wajah</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handleSaveEnrollment}
                  disabled={!extractedDescriptor}
                  className="btn btn-emerald"
                >
                  <CheckCircle2 size={16} />
                  <span>Simpan Biometrik</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload & Konfirmasi Import Siswa */}
      {isUploadModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsUploadModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '850px', padding: '24px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCheck size={22} color="#10b981" />
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Preview & Konfirmasi Import Siswa</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="btn btn-secondary btn-icon"
                style={{ width: '32px', height: '32px', borderRadius: '8px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Statistics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <div className="glass-card" style={{ padding: '12px' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  TOTAL DATA TERBACA
                </span>
                <h4 style={{ fontSize: '1.35rem', marginTop: '2px' }}>{parsedRows.length}</h4>
              </div>
              <div className="glass-card" style={{ padding: '12px', borderLeft: '3px solid #10b981' }}>
                <span style={{ fontSize: '0.6875rem', color: '#34d399', fontWeight: 600 }}>
                  SIAP DI-IMPORT
                </span>
                <h4 style={{ fontSize: '1.35rem', marginTop: '2px', color: '#34d399' }}>
                  {parsedRows.filter((r) => r.isValid).length}
                </h4>
              </div>
              <div className="glass-card" style={{ padding: '12px', borderLeft: '3px solid #f43f5e' }}>
                <span style={{ fontSize: '0.6875rem', color: '#fb7185', fontWeight: 600 }}>
                  DUPLIKAT / DILEWATI
                </span>
                <h4 style={{ fontSize: '1.35rem', marginTop: '2px', color: '#fb7185' }}>
                  {parsedRows.filter((r) => !r.isValid).length}
                </h4>
              </div>
            </div>

            {/* Default Class Fallback */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">
                Kelas Default (Digunakan jika nama kelas di file tidak persis sama):
              </label>
              <select
                className="form-select"
                value={defaultImportClassId}
                onChange={(e) => handleDefaultClassChange(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.major}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview Table */}
            <div
              className="table-container"
              style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '20px' }}
            >
              <table className="app-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                    <th>NIS</th>
                    <th>Nama Siswa</th>
                    <th>Kelas</th>
                    <th style={{ width: '45px', textAlign: 'center' }}>L/P</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}
                      >
                        Tidak ada data siswa yang terbaca dari file.
                      </td>
                    </tr>
                  ) : (
                    parsedRows.map((row, idx) => (
                      <tr key={idx} style={{ opacity: row.isValid ? 1 : 0.65 }}>
                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{row.nis}</td>
                        <td>{row.name}</td>
                        <td>{row.className}</td>
                        <td style={{ textAlign: 'center' }}>{row.gender}</td>
                        <td>
                          {row.isValid ? (
                            <span className="badge badge-emerald">
                              <CheckCircle2 size={12} /> Siap
                            </span>
                          ) : (
                            <span className="badge badge-danger" title={row.errorReason}>
                              <AlertCircle size={12} /> {row.errorReason || 'Tidak Valid'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-emerald"
                disabled={parsedRows.filter((r) => r.isValid).length === 0}
                onClick={handleConfirmImport}
              >
                <Upload size={16} />
                <span>
                  Konfirmasi & Import ({parsedRows.filter((r) => r.isValid).length} Siswa)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
