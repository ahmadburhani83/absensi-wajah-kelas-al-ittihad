import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { faceRecognitionService } from '../services/faceRecognition';
import { audioFeedback } from '../services/audioFeedback';
import confetti from 'canvas-confetti';
import {
  Camera,
  CameraOff,
  ScanFace,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import type { AttendanceStatus, MatchResult } from '../types';

export const ScannerView: React.FC = () => {
  const {
    classes,
    teachers,
    periods,
    students,
    attendances,
    saveAttendanceRecord,
    setActiveTab,
  } = useApp();

  // Session Settings
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(periods[0]?.id || '');
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Camera & Model State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Scanning Runtime State
  const [activeMatches, setActiveMatches] = useState<MatchResult[]>([]);
  const [recentScannedName, setRecentScannedName] = useState<{
    name: string;
    score: number;
    time: string;
  } | null>(null);

  // Manual note modal
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('izin');
  const [editNote, setEditNote] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<{ [studentId: string]: number }>({});

  // Filter students for chosen class
  const classStudents = students.filter((s) => s.class_id === selectedClassId);
  const enrolledClassStudents = classStudents.filter((s) => s.is_enrolled);

  // Get current session's attendance mapping: student_id -> AttendanceItem
  const sessionAttendances = attendances.filter(
    (a) =>
      a.class_id === selectedClassId &&
      a.date === sessionDate &&
      (selectedPeriodId ? a.period_id === selectedPeriodId : true)
  );

  const attendanceMap = new Map(sessionAttendances.map((a) => [a.student_id, a]));

  const hadirCount = sessionAttendances.filter((a) => a.status === 'hadir').length;
  const totalStudents = classStudents.length;
  const progressPercent =
    totalStudents > 0 ? Math.round((hadirCount / totalStudents) * 100) : 0;

  // Load available video inputs
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devs) => {
        const videoInputs = devs.filter((d) => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      });
    }
  }, [selectedDeviceId]);

  // Load neural models on mount
  useEffect(() => {
    if (!faceRecognitionService.isReady()) {
      setIsModelLoading(true);
      faceRecognitionService.loadModels().then((ok) => {
        setIsModelLoading(false);
        if (!ok) {
          setCameraError(
            'Gagal memuat model neural network AI. Pastikan folder /models tersedia.'
          );
        }
      });
    }
  }, []);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setActiveMatches([]);
  }, []);

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!faceRecognitionService.isReady()) {
        setIsModelLoading(true);
        await faceRecognitionService.loadModels();
        setIsModelLoading(false);
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(`Tidak dapat mengakses kamera: ${msg}`);
      setIsCameraActive(false);
    }
  };

  // Toggle camera
  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Main Recognition Loop
  useEffect(() => {
    if (!isCameraActive || !videoRef.current || !canvasRef.current) return;

    let isScanning = true;

    const runRecognition = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        !isScanning ||
        !video ||
        video.paused ||
        video.ended ||
        video.readyState < 2
      ) {
        if (isScanning) {
          scanLoopRef.current = requestAnimationFrame(runRecognition);
        }
        return;
      }

      // Sync canvas dimensions
      if (
        canvas &&
        (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)
      ) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      try {
        const matches = await faceRecognitionService.detectAndMatch(
          video,
          enrolledClassStudents
        );
        setActiveMatches(matches);

        // Process recognized matches
        const now = Date.now();
        for (const match of matches) {
          const student = match.student;
          const lastScanned = lastScannedTimeRef.current[student.id] || 0;

          // Cooldown of 6 seconds per student to avoid duplicate scans
          if (now - lastScanned > 6000) {
            lastScannedTimeRef.current[student.id] = now;

            // Check if already marked present in this session
            const existing = attendanceMap.get(student.id);
            if (existing && existing.status === 'hadir') {
              audioFeedback.playAlreadyScanned();
            } else {
              // Mark present
              const currentTimeStr = new Date().toTimeString().split(' ')[0];
              await saveAttendanceRecord({
                student_id: student.id,
                class_id: selectedClassId,
                teacher_id: selectedTeacherId || undefined,
                period_id: selectedPeriodId || undefined,
                date: sessionDate,
                scan_time: currentTimeStr,
                status: 'hadir',
                confidence_score: match.confidence,
                method: 'face_scan',
              });

              // Audio chime
              audioFeedback.playSuccess();

              // Confetti burst
              confetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#10b981', '#34d399', '#3b82f6'],
              });

              setRecentScannedName({
                name: student.name,
                score: match.confidence,
                time: currentTimeStr,
              });
            }
          }
        }
      } catch (e) {
        console.warn('Scan frame error:', e);
      }

      if (isScanning) {
        scanLoopRef.current = requestAnimationFrame(runRecognition);
      }
    };

    scanLoopRef.current = requestAnimationFrame(runRecognition);

    return () => {
      isScanning = false;
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
      }
    };
  }, [
    isCameraActive,
    enrolledClassStudents,
    selectedClassId,
    selectedTeacherId,
    selectedPeriodId,
    sessionDate,
    attendanceMap,
    saveAttendanceRecord,
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Manual status change handler
  const handleQuickStatus = async (
    studentId: string,
    status: AttendanceStatus,
    notes?: string
  ) => {
    const currentTimeStr = new Date().toTimeString().split(' ')[0];
    await saveAttendanceRecord({
      student_id: studentId,
      class_id: selectedClassId,
      teacher_id: selectedTeacherId || undefined,
      period_id: selectedPeriodId || undefined,
      date: sessionDate,
      scan_time: currentTimeStr,
      status,
      method: 'manual',
      notes: notes || undefined,
    });
  };

  const handleOpenEditNote = (studentId: string) => {
    const existing = attendanceMap.get(studentId);
    setEditingStudentId(studentId);
    setEditStatus(existing?.status || 'izin');
    setEditNote(existing?.notes || '');
  };

  const handleSaveEditNote = async () => {
    if (!editingStudentId) return;
    await handleQuickStatus(editingStudentId, editStatus, editNote);
    setEditingStudentId(null);
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Session Header Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        {/* Guru */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Guru Pengajar</label>
          <select
            className="form-select"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.subject})
              </option>
            ))}
          </select>
        </div>

        {/* Kelas */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Kelas Yang Diabsen</label>
          <select
            className="form-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.major}
              </option>
            ))}
          </select>
        </div>

        {/* Jam Pelajaran */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Jam Pelajaran Ke-</label>
          <select
            className="form-select"
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
          >
            {periods
              .filter((p) => p.is_active)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.start_time} - {p.end_time})
                </option>
              ))}
          </select>
        </div>

        {/* Tanggal */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Tanggal Presensi</label>
          <input
            type="date"
            className="form-input"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
        </div>
      </div>

      {/* Main Two-Column Scanner Interface */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 1.25fr) minmax(320px, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Camera Viewfinder & HUD */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ScanFace size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.125rem' }}>Live Scanner Wajah Siswa</h3>
            </div>

            {/* Camera selection dropdown if multiple cameras exist */}
            {devices.length > 1 && (
              <select
                className="form-select"
                style={{ width: 'auto', fontSize: '0.75rem', padding: '6px 10px' }}
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  if (isCameraActive) {
                    stopCamera();
                  }
                }}
              >
                {devices.map((d, idx) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Kamera ${idx + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Camera Viewfinder Container */}
          <div className="scanner-container">
            <video
              ref={videoRef}
              className="scanner-video"
              playsInline
              muted
              autoPlay
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Laser scanning line effect when camera is active */}
            {isCameraActive && <div className="scanner-laser-line" />}

            {/* Overlays / Target Bounding Boxes */}
            {isCameraActive && (
              <div className="scanner-overlay">
                {activeMatches.map((match, i) => (
                  <div
                    key={i}
                    className="hud-target-box"
                    style={{
                      left: `${(match.box.x / (videoRef.current?.videoWidth || 640)) * 100}%`,
                      top: `${(match.box.y / (videoRef.current?.videoHeight || 480)) * 100}%`,
                      width: `${(match.box.width / (videoRef.current?.videoWidth || 640)) * 100}%`,
                      height: `${(match.box.height / (videoRef.current?.videoHeight || 480)) * 100}%`,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-28px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(16, 185, 129, 0.95)',
                        color: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      }}
                    >
                      {match.student.name} • {match.confidence}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Camera Inactive Placeholder */}
            {!isCameraActive && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(10, 15, 29, 0.95)',
                  color: 'var(--text-muted)',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <CameraOff size={32} color="#94a3b8" />
                </div>
                <h4 style={{ color: '#fff', marginBottom: '6px' }}>Kamera Belum Aktif</h4>
                <p style={{ fontSize: '0.8125rem', maxWidth: '300px', marginBottom: '20px' }}>
                  Klik tombol di bawah untuk mengaktifkan kamera laptop / webcam dan memulai absensi.
                </p>
                <button
                  onClick={handleToggleCamera}
                  disabled={isModelLoading}
                  className="btn btn-emerald"
                  style={{ padding: '12px 28px', fontSize: '0.9375rem' }}
                >
                  {isModelLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Memuat AI Model...</span>
                    </>
                  ) : (
                    <>
                      <Camera size={18} />
                      <span>Aktifkan Kamera Kelas</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Camera Error Alert */}
          {cameraError && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fda4af',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertCircle size={18} />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Controls Bar Below Camera */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <button
              onClick={handleToggleCamera}
              className={`btn ${isCameraActive ? 'btn-danger' : 'btn-emerald'}`}
            >
              {isCameraActive ? (
                <>
                  <CameraOff size={16} />
                  <span>Matikan Kamera</span>
                </>
              ) : (
                <>
                  <Camera size={16} />
                  <span>Buka Kamera</span>
                </>
              )}
            </button>

            {/* Privacy note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                color: '#10b981',
              }}
            >
              <ShieldCheck size={14} />
              <span>Tanpa Simpan Foto Wajah (Aman & Legal)</span>
            </div>
          </div>

          {/* Last Recognized Toast Banner */}
          {recentScannedName && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="#34d399" />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>
                    {recentScannedName.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#34d399' }}>
                    Berhasil diabsen HADIR ({recentScannedName.score}%) • {recentScannedName.time}
                  </p>
                </div>
              </div>
              <Sparkles size={18} color="#34d399" />
            </div>
          )}
        </div>

        {/* Right Column: Live Session Student Roster */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.125rem' }}>Daftar Hadir Siswa Kelas</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {hadirCount} dari {totalStudents} Siswa Terabsen ({progressPercent}%)
              </p>
            </div>
            <button
              onClick={() => setActiveTab('rekap')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              <span>Selesai & Rekap</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '18px',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                borderRadius: '9999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          {/* Warning if no students have enrolled faces */}
          {enrolledClassStudents.length === 0 && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                fontSize: '0.8125rem',
                marginBottom: '16px',
              }}
            >
              Belum ada siswa di kelas ini yang didaftarkan wajahnya. Buka tab{' '}
              <strong
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() => setActiveTab('students')}
              >
                Data Siswa
              </strong>{' '}
              untuk mendaftarkan wajah siswa terlebih dahulu.
            </div>
          )}

          {/* Student List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '520px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {classStudents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '24px' }}>
                Tidak ada data siswa di kelas ini.
              </p>
            ) : (
              classStudents.map((student) => {
                const att = attendanceMap.get(student.id);
                const isHadir = att?.status === 'hadir';

                return (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isHadir
                        ? 'rgba(16, 185, 129, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${
                        isHadir ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'
                      }`,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {student.name}
                        </span>
                        {!student.is_enrolled && (
                          <span
                            title="Wajah belum didaftarkan"
                            style={{
                              fontSize: '0.625rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(148, 163, 184, 0.15)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            No Biometric
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        NIS: {student.nis} {att?.scan_time ? `• ${att.scan_time}` : ''}
                        {att?.notes ? ` • ${att.notes}` : ''}
                      </p>
                    </div>

                    {/* Quick Attendance Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {att ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className={`badge badge-${att.status}`}>
                            {att.status}
                          </span>
                          <button
                            onClick={() => handleOpenEditNote(student.id)}
                            title="Edit Catatan / Keterangan"
                            className="btn btn-secondary btn-icon"
                            style={{ width: '28px', height: '28px' }}
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleQuickStatus(student.id, 'hadir')}
                            title="Tandai Hadir Manual"
                            className="btn btn-emerald"
                            style={{ padding: '4px 8px', fontSize: '0.6875rem' }}
                          >
                            Hadir
                          </button>
                          <button
                            onClick={() => handleOpenEditNote(student.id)}
                            title="Izin / Sakit / Alpa"
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.6875rem' }}
                          >
                            I/S/A
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Manual Status & Notes Modal */}
      {editingStudentId && (
        <div className="modal-backdrop" onClick={() => setEditingStudentId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.125rem' }}>
              Ubah Status Presensi Siswa
            </h3>

            <div className="form-group">
              <label className="form-label">Status Kehadiran</label>
              <select
                className="form-select"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
              >
                <option value="hadir">Hadir</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
                <option value="alpa">Alpa (Tanpa Keterangan)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Catatan / Keterangan Tambahan</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Surat dokter terlampir / Lomba basket"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setEditingStudentId(null)}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditNote}
                className="btn btn-primary"
              >
                Simpan Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
