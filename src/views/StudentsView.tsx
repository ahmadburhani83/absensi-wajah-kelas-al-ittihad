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
} from 'lucide-react';
import type { StudentItem, Gender } from '../types';

export const StudentsView: React.FC = () => {
  const {
    students,
    classes,
    addStudent,
    updateStudent,
    deleteStudent,
    enrollStudentFace,
    clearStudentFace,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [enrollingStudent, setEnrollingStudent] = useState<StudentItem | null>(null);

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

        <button onClick={handleOpenAdd} className="btn btn-emerald">
          <Plus size={16} />
          <span>Tambah Siswa Baru</span>
        </button>
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
    </div>
  );
};
