import React from 'react';
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
import { ShieldCheck } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();

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
