import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ScanFace,
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  GraduationCap,
  UserCheck,
  Clock,
  Database,
  CloudCheck,
  CloudOff,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, isSupabaseConfigured, isOnline } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Scan Absen Kelas', icon: ScanFace, highlight: true },
    { id: 'rekap', label: 'Rekap Absensi', icon: FileSpreadsheet },
    { id: 'students', label: 'Data Siswa', icon: Users },
    { id: 'classes', label: 'Data Kelas', icon: GraduationCap },
    { id: 'teachers', label: 'Data Guru', icon: UserCheck },
    { id: 'periods', label: 'Jam Pelajaran', icon: Clock },
    { id: 'settings', label: 'Supabase & Cloud', icon: Database },
  ];

  return (
    <header className="glass-panel no-print" style={{ margin: '16px 20px 0 20px', padding: '12px 24px', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Logo & Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
          }}>
            <ScanFace size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Presensi</span>
              <span style={{ color: '#10b981' }}>Pintar</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Absensi Wajah Kelas Siswa • Biometrik Cerdas
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`btn ${isActive ? (item.highlight ? 'btn-emerald' : 'btn-primary') : 'btn-secondary'}`}
                style={{
                  padding: '8px 14px',
                  fontSize: '0.8125rem',
                  borderRadius: '10px',
                  ...(item.highlight && !isActive ? {
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.1)',
                  } : {}),
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Database Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isSupabaseConfigured ? (
            <div
              onClick={() => setActiveTab('settings')}
              title={isOnline ? 'Supabase Database Terhubung' : 'Offline / Menggunakan Cache Lokal'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '9999px',
                background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                color: isOnline ? '#34d399' : '#fbbf24',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isOnline ? <CloudCheck size={14} /> : <CloudOff size={14} />}
              <span>{isOnline ? 'Supabase Sync' : 'Local Cache'}</span>
            </div>
          ) : (
            <div
              onClick={() => setActiveTab('settings')}
              title="Klik untuk konfigurasi Supabase Database"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '9999px',
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Database size={14} />
              <span>Mode Lokal (Demo)</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
