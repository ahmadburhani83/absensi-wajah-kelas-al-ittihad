import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  GraduationCap,
  CheckCircle2,
  ScanFace,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { classes, students, attendances, detailedAttendances, setActiveTab, periods } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter((a) => a.date === todayStr);

  const hadirCount = todayAttendances.filter((a) => a.status === 'hadir').length;
  const izinCount = todayAttendances.filter((a) => a.status === 'izin').length;
  const sakitCount = todayAttendances.filter((a) => a.status === 'sakit').length;
  const alpaCount = todayAttendances.filter((a) => a.status === 'alpa').length;

  const totalToday = todayAttendances.length;
  const presenceRate = totalToday > 0 ? Math.round((hadirCount / totalToday) * 100) : 0;

  const enrolledCount = students.filter((s) => s.is_enrolled).length;
  const enrolledPercent = students.length > 0 ? Math.round((enrolledCount / students.length) * 100) : 0;

  // Recent 5 scans
  const recentScans = detailedAttendances.slice(0, 5);

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Hero Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '32px',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.85) 0%, rgba(30, 41, 59, 0.7) 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div style={{ maxWidth: '650px', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '14px' }}>
            <Sparkles size={14} />
            <span>Sistem Presensi Biometrik Guru Masuk Kelas</span>
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '10px', lineHeight: '1.2' }}>
            Selamat Datang di <span style={{ color: '#10b981' }}>Presensi Pintar</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.6' }}>
            Guru masuk kelas, pilih jam pelajaran & kelas, lalu scan wajah siswa secara instan.
            Data otomatis terangkum dalam rekap absensi tanpa menyimpan foto wajah untuk privasi maksimal.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('scanner')}
              className="btn btn-emerald"
              style={{ padding: '12px 24px', fontSize: '0.9375rem' }}
            >
              <ScanFace size={18} />
              <span>Mulai Scan Absen Kelas</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setActiveTab('rekap')}
              className="btn btn-secondary"
              style={{ padding: '12px 20px', fontSize: '0.9375rem' }}
            >
              <FileSpreadsheet size={18} />
              <span>Rekap Absensi</span>
            </button>
          </div>
        </div>

        {/* Privacy Pill badge card */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            maxWidth: '360px',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <ShieldCheck size={20} />
            </div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Jaminan Privasi Siswa</h4>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Sistem ini <strong style={{ color: '#fff' }}>TIDAK menyimpan gambar/foto hasil scan wajah</strong> ke database. Hanya vektor matematika 128-float yang diolah di browser secara lokal.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Total Siswa */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Siswa
              </p>
              <h3 style={{ fontSize: '1.875rem', marginTop: '4px' }}>{students.length}</h3>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span style={{ color: '#22d3ee', fontWeight: 600 }}>{enrolledCount} ({enrolledPercent}%)</span> wajah terdaftar
          </div>
        </div>

        {/* Total Kelas */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Kelas
              </p>
              <h3 style={{ fontSize: '1.875rem', marginTop: '4px' }}>{classes.length}</h3>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={22} />
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {classes.map((c) => c.name).slice(0, 3).join(', ')}{classes.length > 3 ? '...' : ''}
          </p>
        </div>

        {/* Hadir Hari Ini */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Hadir Hari Ini
              </p>
              <h3 style={{ fontSize: '1.875rem', marginTop: '4px', color: '#34d399' }}>{hadirCount}</h3>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
            <span style={{ color: '#60a5fa' }}>{izinCount} Izin</span> •{' '}
            <span style={{ color: '#fbbf24' }}>{sakitCount} Sakit</span> •{' '}
            <span style={{ color: '#fb7185' }}>{alpaCount} Alpa</span>
          </div>
        </div>

        {/* Tingkat Kehadiran */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase' }}>
                % Kehadiran Hari Ini
              </p>
              <h3 style={{ fontSize: '1.875rem', marginTop: '4px', color: '#60a5fa' }}>
                {totalToday > 0 ? `${presenceRate}%` : '-'}
              </h3>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} />
            </div>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${presenceRate}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #3b82f6)', borderRadius: '9999px' }} />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Scans & Jam Pelajaran */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Recent Scans Feed */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.125rem' }}>Aktivitas Scan Terkini</h3>
            <button
              onClick={() => setActiveTab('rekap')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              Lihat Semua
            </button>
          </div>

          {recentScans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p>Belum ada aktivitas presensi yang dicatat hari ini.</p>
              <button
                onClick={() => setActiveTab('scanner')}
                className="btn btn-emerald"
                style={{ marginTop: '14px', fontSize: '0.8125rem' }}
              >
                Mulai Scan Kelas Sekarang
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentScans.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ScanFace size={18} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.student_name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.class_name} • {item.period_name || 'Jam Pelajaran'}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${item.status}`}>
                      {item.status}
                    </span>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      {item.scan_time} {item.confidence_score ? `(${item.confidence_score}%)` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jam Pelajaran Schedule Quick View */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.125rem' }}>Jadwal Jam Pelajaran</h3>
            <button
              onClick={() => setActiveTab('periods')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              Kelola Jam
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {periods.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#60a5fa' }}>{p.name}</span>
                  <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: p.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)', color: p.is_active ? '#34d399' : '#94a3b8' }}>
                    {p.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {p.start_time} - {p.end_time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
