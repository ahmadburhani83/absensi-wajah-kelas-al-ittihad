import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabaseService } from '../services/supabase';
import {
  Database,
  CloudCheck,
  Copy,
  Check,
  RefreshCw,
  Globe,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { isSupabaseConfigured, syncWithSupabase, resetToSampleData } = useApp();

  const currentCreds = supabaseService.getCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState<string>(currentCreds.url);
  const [supabaseKey, setSupabaseKey] = useState<string>(currentCreds.anonKey);

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const handleSaveCredentials = () => {
    supabaseService.saveCredentials(supabaseUrl, supabaseKey);
    setTestResult(null);
    setSyncResult(null);
    alert('Kredensial Supabase berhasil disimpan di konfigurasi aplikasi!');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await supabaseService.testConnection(supabaseUrl, supabaseKey);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const res = await syncWithSupabase();
    setSyncResult(res);
    setIsSyncing(false);
  };

  const handleCopySql = () => {
    const sqlText = `-- Jalankan script ini di Supabase SQL Editor:
-- Script lengkap telah disediakan di file 'supabase_schema.sql' di root proyek Anda.
-- File tersebut berisi tabel: classes, teachers, periods, students (biometric vector tanpa foto), attendances, dan RLS policies.`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.75rem', lineHeight: '1.2' }}>
          Integrasi <span style={{ color: '#10b981' }}>Supabase, GitHub & Vercel</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
          Konfigurasi koneksi cloud database, deployment ke Vercel, dan manajemen repository GitHub
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left Column: Supabase Connection */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem' }}>Koneksi Supabase Cloud</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Database PostgreSQL dengan Row Level Security
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Project URL (VITE_SUPABASE_URL)</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anon Public API Key (VITE_SUPABASE_ANON_KEY)</label>
            <input
              type="password"
              className="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
            />
          </div>

          {/* Buttons: Test & Save */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !supabaseUrl || !supabaseKey}
              className="btn btn-secondary"
            >
              {isTesting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Menguji...</span>
                </>
              ) : (
                <>
                  <CloudCheck size={16} />
                  <span>Uji Koneksi</span>
                </>
              )}
            </button>

            <button onClick={handleSaveCredentials} className="btn btn-primary">
              <span>Simpan Kredensial</span>
            </button>
          </div>

          {/* Test connection alert */}
          {testResult && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.3)'}`,
                color: testResult.success ? '#34d399' : '#fda4af',
                fontSize: '0.8125rem',
              }}
            >
              {testResult.message}
            </div>
          )}

          {/* Sync Local to Supabase */}
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '24px', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '0.9375rem', marginBottom: '8px' }}>Sinkronisasi Data Lokal ke Supabase</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
              Jika Anda telah menginput kelas, guru, siswa, atau presensi di mode offline/lokal, klik tombol berikut untuk mengunggah semuanya ke database Supabase.
            </p>
            <button
              onClick={handleSync}
              disabled={isSyncing || !isSupabaseConfigured}
              className="btn btn-emerald"
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Sedang Sinkronisasi...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Sinkronkan Sekarang</span>
                </>
              )}
            </button>

            {syncResult && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: syncResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  border: `1px solid ${syncResult.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.3)'}`,
                  color: syncResult.success ? '#34d399' : '#fda4af',
                  fontSize: '0.75rem',
                }}
              >
                {syncResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deployment & Setup Guides */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* SQL Schema helper */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} color="#60a5fa" />
                <h4 style={{ fontSize: '0.9375rem' }}>Skema SQL Supabase</h4>
              </div>
              <button
                onClick={handleCopySql}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              >
                {copiedSql ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                <span>{copiedSql ? 'Tersalin!' : 'Info SQL'}</span>
              </button>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Skrip SQL lengkap untuk membuat tabel kelas, guru, jam pelajaran, siswa (dengan kolom biometrik <code>face_descriptor jsonb</code>), serta tabel presensi telah tersedia di file <strong>`supabase_schema.sql`</strong> di folder proyek Anda. Cukup salin isinya ke <strong>Supabase Dashboard &gt; SQL Editor</strong> dan klik <strong>Run</strong>.
            </p>
          </div>

          {/* GitHub & Vercel Publishing Step-by-Step */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '0.9375rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="#22d3ee" />
              <span>Langkah Publikasi ke GitHub & Vercel</span>
            </h4>

            <ol style={{ paddingLeft: '20px', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
              <li>
                <strong style={{ color: '#fff' }}>Publish ke GitHub:</strong>
                <br />
                Buka terminal dan jalankan:
                <pre
                  style={{
                    background: '#090d16',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    margin: '6px 0',
                    color: '#34d399',
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                  }}
                >
                  git add .
                  <br />
                  git commit -m "feat: absensi wajah kelas siswa"
                  <br />
                  git remote add origin https://github.com/USERNAME/REPO.git
                  <br />
                  git push -u origin main
                </pre>
              </li>

              <li style={{ marginTop: '10px' }}>
                <strong style={{ color: '#fff' }}>Deploy ke Vercel:</strong>
                <br />
                1. Buka <strong>vercel.com</strong> dan pilih "Add New Project".
                <br />
                2. Import repositori GitHub di atas.
                <br />
                3. Tambahkan Environment Variables:
                <br />
                • <code>VITE_SUPABASE_URL</code>
                <br />
                • <code>VITE_SUPABASE_ANON_KEY</code>
                <br />
                4. Klik <strong>Deploy</strong> (Konfigurasi <code>vercel.json</code> sudah otomatis disertakan).
              </li>
            </ol>
          </div>

          {/* Reset Demo Data */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '0.875rem' }}>Reset Data Awal (Demo)</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Kembalikan data kelas, guru, jam pelajaran, dan siswa ke data contoh bawaan
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('Kembalikan semua data ke sampel awal? Riwayat presensi lokal akan dibersihkan.')) {
                  resetToSampleData();
                  alert('Data berhasil di-reset!');
                }
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem' }}
            >
              <RotateCcw size={14} />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
