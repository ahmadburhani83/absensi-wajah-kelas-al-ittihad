import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  X,
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
  ChevronRight,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  desc: string;
  color?: string;
  badge?: string;
  bgActive?: string;
  borderColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, isSupabaseConfigured, isOnline, theme, toggleTheme } = useApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to open-drawer events (e.g. from bottom action dock)
  useEffect(() => {
    const handleOpenDrawer = () => setIsDrawerOpen(true);
    window.addEventListener('open-app-drawer', handleOpenDrawer);
    return () => window.removeEventListener('open-app-drawer', handleOpenDrawer);
  }, []);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsDrawerOpen(false);
  };

  const navSections: NavSection[] = [
    {
      title: 'Aktivitas Kelas',
      items: [
        {
          id: 'scanner',
          label: 'Scan Absen Kelas',
          icon: ScanFace,
          desc: 'Presensi wajah siswa otomatis',
          badge: 'Utama',
          color: '#10b981',
          bgActive: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.1) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.4)',
        },
        {
          id: 'rekap',
          label: 'Rekap Absensi',
          icon: FileSpreadsheet,
          desc: 'Matriks Jam 1 s/d Jam N & Export',
          badge: 'Matriks',
          color: '#3b82f6',
          bgActive: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.1) 100%)',
          borderColor: 'rgba(59, 130, 246, 0.4)',
        },
      ],
    },
    {
      title: 'Master Data',
      items: [
        {
          id: 'students',
          label: 'Data Siswa',
          icon: Users,
          desc: 'Daftar siswa & pendaftaran wajah',
          color: '#8b5cf6',
        },
        {
          id: 'classes',
          label: 'Data Kelas',
          icon: GraduationCap,
          desc: 'Kelola kelas, jurusan, wali kelas',
          color: '#06b6d4',
        },
        {
          id: 'teachers',
          label: 'Data Guru',
          icon: UserCheck,
          desc: 'Daftar guru pengajar & mapel',
          color: '#f59e0b',
        },
        {
          id: 'periods',
          label: 'Jam Pelajaran',
          icon: Clock,
          desc: 'Atur jam 1-2, 3-4, 5-6, 8-9',
          color: '#ec4899',
        },
      ],
    },
    {
      title: 'Sistem & Cloud',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Statistik',
          icon: LayoutDashboard,
          desc: 'Ringkasan kehadiran & grafik',
          color: '#64748b',
        },
        {
          id: 'settings',
          label: 'Supabase & Cloud',
          icon: Database,
          desc: 'Database online & sinkronisasi',
          color: '#10b981',
        },
      ],
    },
  ];

  return (
    <>
      {/* Top Navbar Header */}
      <header className="app-navbar no-print">
        <div className="navbar-container">
          {/* Top Left: Hamburger Button (☰) & Brand */}
          <div className="navbar-left">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="hamburger-btn"
              aria-label="Buka Menu Navigasi"
              title="Menu Navigasi"
            >
              <Menu size={22} />
            </button>

            <div
              className="navbar-brand"
              onClick={() => setActiveTab('dashboard')}
              role="button"
              tabIndex={0}
            >
              <div className="brand-logo-badge">
                <ScanFace size={20} color="#ffffff" />
              </div>
              <div className="brand-text">
                <div className="brand-title">
                  <span>Presensi</span>
                  <span className="brand-accent">Pintar</span>
                </div>
                <div className="brand-subtitle">Al-Ittihad • Wajah Siswa</div>
              </div>
            </div>
          </div>

          {/* Top Right: Status Pill & Quick Action */}
          <div className="navbar-right">
            {/* Quick Scan Action */}
            <button
              onClick={() => setActiveTab('scanner')}
              className={`btn btn-sm ${activeTab === 'scanner' ? 'btn-emerald' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
            >
              <ScanFace size={16} />
              <span className="hide-on-mobile-xs">Scan</span>
            </button>

            {/* Quick Rekap Action */}
            <button
              onClick={() => setActiveTab('rekap')}
              className={`btn btn-sm ${activeTab === 'rekap' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
            >
              <FileSpreadsheet size={16} />
              <span className="hide-on-mobile-xs">Rekap</span>
            </button>

            {/* Theme Toggle (Dark / Light) */}
            <button
              onClick={toggleTheme}
              className="btn btn-secondary btn-icon"
              title={theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
              aria-label="Ganti Tema"
              style={{ width: '34px', height: '34px', borderRadius: '9px', padding: 0 }}
            >
              {theme === 'dark' ? (
                <Sun size={16} color="#fbbf24" />
              ) : (
                <Moon size={16} color="#3b82f6" />
              )}
            </button>

            {/* Supabase Status Pill */}
            <div
              onClick={() => setActiveTab('settings')}
              className="status-pill"
              title={
                isSupabaseConfigured
                  ? (isOnline ? 'Supabase Terhubung' : 'Offline / Mode Cache')
                  : 'Mode Demo Lokal (Klik untuk koneksi Supabase)'
              }
            >
              {isSupabaseConfigured ? (
                <>
                  {isOnline ? (
                    <CloudCheck size={14} color="#34d399" />
                  ) : (
                    <CloudOff size={14} color="#fbbf24" />
                  )}
                  <span className="hide-on-mobile-sm">
                    {isOnline ? 'Cloud' : 'Offline'}
                  </span>
                </>
              ) : (
                <>
                  <Database size={14} color="#94a3b8" />
                  <span className="hide-on-mobile-sm">Lokal</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Slide-In Navigation Drawer (Hamburger Menu Sheet) */}
      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <aside
            className="drawer-panel"
            onClick={(e) => e.stopPropagation()}
            aria-label="Panel Navigasi"
          >
            {/* Drawer Header */}
            <div className="drawer-header">
              <div className="drawer-brand">
                <div className="brand-logo-badge">
                  <ScanFace size={22} color="#ffffff" />
                </div>
                <div>
                  <h2 className="drawer-title">
                    <span>Presensi</span>
                    <span className="brand-accent"> Pintar</span>
                  </h2>
                  <p className="drawer-subtitle">SMK / MA Al-Ittihad</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="drawer-close-btn"
                aria-label="Tutup Menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body - Sections & Menu Items */}
            <div className="drawer-body">
              {navSections.map((sec) => (
                <div key={sec.title} className="drawer-section">
                  <div className="drawer-section-title">{sec.title}</div>
                  <div className="drawer-section-list">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`drawer-item ${isActive ? 'active' : ''}`}
                          style={{
                            background: isActive
                              ? (item.bgActive || 'rgba(59, 130, 246, 0.18)')
                              : undefined,
                            borderColor: isActive
                              ? (item.borderColor || 'rgba(59, 130, 246, 0.4)')
                              : 'transparent',
                          }}
                        >
                          <div
                            className="drawer-item-icon"
                            style={{
                              color: item.color || '#3b82f6',
                              background: isActive
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(255, 255, 255, 0.04)',
                            }}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="drawer-item-content">
                            <div className="drawer-item-label-row">
                              <span className="drawer-item-label">{item.label}</span>
                              {item.badge && (
                                <span className={`badge-pill ${item.id === 'scanner' ? 'badge-emerald' : 'badge-blue'}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <span className="drawer-item-desc">{item.desc}</span>
                          </div>
                          <ChevronRight
                            size={16}
                            className="drawer-item-arrow"
                            style={{ opacity: isActive ? 1 : 0.4 }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="drawer-footer">
              {/* Quick Theme Switch Row in Drawer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {theme === 'dark' ? <Moon size={16} color="#60a5fa" /> : <Sun size={16} color="#f59e0b" />}
                  <span>Mode {theme === 'dark' ? 'Gelap (Dark)' : 'Terang (Light)'}</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '8px' }}
                >
                  Ubah ke {theme === 'dark' ? 'Terang' : 'Gelap'}
                </button>
              </div>

              <div className="drawer-footer-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="#10b981" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Privasi Terjamin</span>
                </div>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Hanya 128-vektor matematika wajah yang diproses. Foto tidak disimpan ke server.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
