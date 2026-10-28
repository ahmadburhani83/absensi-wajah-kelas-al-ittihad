import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { ScannerView } from './views/ScannerView';
import { RekapView } from './views/RekapView';
import { StudentsView } from './views/StudentsView';
import { ClassesView } from './views/ClassesView';
import { TeachersView } from './views/TeachersView';
import { PeriodsView } from './views/PeriodsView';
import { SettingsView } from './views/SettingsView';
import { ShieldCheck, ScanFace, Grid3X3, LayoutDashboard, Database, Menu } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  // Support direct deep-linking / intent calls from Android APK (e.g. ?tab=scanner or #scan)
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');

      if (hash === '#scan' || tabParam === 'scanner' || tabParam === 'scan') {
        setActiveTab('scanner');
      } else if (hash === '#rekap' || tabParam === 'rekap') {
        setActiveTab('rekap');
      } else if (hash === '#students' || tabParam === 'students') {
        setActiveTab('students');
      } else if (hash === '#periods' || tabParam === 'periods') {
        setActiveTab('periods');
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    return () => window.removeEventListener('hashchange', handleLocationChange);
  }, [setActiveTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'scanner':
        return <ScannerView />;
      case 'rekap':
        return <RekapView />;
      case 'students':
        return <StudentsView />;
      case 'classes':
        return <ClassesView />;
      case 'teachers':
        return <TeachersView />;
      case 'periods':
        return <PeriodsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {renderContent()}
      </main>

      <footer
        className="no-print"
        style={{
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(11, 15, 25, 0.9)',
          padding: '20px 24px',
          marginTop: '40px',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Presensi Pintar</span>
            <span>•</span>
            <span>Sistem Presensi Wajah Siswa Kelas Berbasis AI</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Zero Image Storage Guarantee • UU PDP & GDPR Compliant</span>
          </div>

          <div>
            <span>Dibuat dengan dedikasi untuk efisiensi guru di sekolah</span>
          </div>
        </div>
      </footer>

      {/* Mobile Quick Action Dock (Specifically for ~6-inch Android Phone / APK) */}
      <div className="mobile-action-dock no-print">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-app-drawer'))}
          className="dock-btn"
          aria-label="Menu Lengkap"
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`dock-btn ${activeTab === 'scanner' ? 'active-emerald' : ''}`}
        >
          <ScanFace size={20} />
          <span>Scan Absen</span>
        </button>
        <button
          onClick={() => setActiveTab('rekap')}
          className={`dock-btn ${activeTab === 'rekap' ? 'active-blue' : ''}`}
        >
          <Grid3X3 size={20} />
          <span>Rekap</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`dock-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Beranda</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`dock-btn ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Database size={20} />
          <span>Cloud</span>
        </button>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
