import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import type { PeriodItem } from '../types';

export const PeriodsView: React.FC = () => {
  const { periods, addPeriod, updatePeriod, deletePeriod } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<PeriodItem | null>(null);

  // Form State
  const [formNumber, setFormNumber] = useState<number>(periods.length + 1);
  const [formName, setFormName] = useState<string>('');
  const [formStart, setFormStart] = useState<string>('07:00');
  const [formEnd, setFormEnd] = useState<string>('07:45');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  const handleOpenAdd = () => {
    const nextNum = periods.length > 0 ? Math.max(...periods.map((p) => p.period_number)) + 1 : 1;
    setFormNumber(nextNum);
    setFormName(`Jam Ke-${nextNum}`);
    setFormStart('07:00');
    setFormEnd('07:45');
    setFormIsActive(true);
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async () => {
    if (!formName.trim() || !formStart || !formEnd) {
      alert('Nama sesi, waktu mulai, dan selesai wajib diisi!');
      return;
    }
    await addPeriod({
      period_number: Number(formNumber),
      name: formName.trim(),
      start_time: formStart,
      end_time: formEnd,
      is_active: formIsActive,
    });
    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (p: PeriodItem) => {
    setEditingPeriod(p);
    setFormNumber(p.period_number);
    setFormName(p.name);
    setFormStart(p.start_time);
    setFormEnd(p.end_time);
    setFormIsActive(p.is_active);
  };

  const handleSaveEdit = async () => {
    if (!editingPeriod || !formName.trim() || !formStart || !formEnd) return;
    await updatePeriod(editingPeriod.id, {
      period_number: Number(formNumber),
      name: formName.trim(),
      start_time: formStart,
      end_time: formEnd,
      is_active: formIsActive,
    });
    setEditingPeriod(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus ${name}?`)) {
      await deletePeriod(id);
    }
  };

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
            Pengaturan <span style={{ color: '#10b981' }}>Jam Pelajaran</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Atur urutan jam pelajaran (Jam Ke-1, Ke-2, dst.) dan durasi waktu pembelajaran per sesi
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-emerald">
          <Plus size={16} />
          <span>Tambah Jam Pelajaran</span>
        </button>
      </div>

      {/* Grid of Periods */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '18px',
        }}
      >
        {periods.map((p) => (
          <div
            key={p.id}
            className="glass-card"
            style={{
              padding: '20px',
              borderLeft: `4px solid ${p.is_active ? '#10b981' : '#64748b'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                  }}
                >
                  #{p.period_number}
                </span>
                <h3 style={{ fontSize: '1.125rem' }}>{p.name}</h3>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="btn btn-secondary btn-icon"
                  style={{ width: '32px', height: '32px' }}
                  title="Edit Jam"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="btn btn-danger btn-icon"
                  style={{ width: '32px', height: '32px' }}
                  title="Hapus Jam"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                marginTop: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                <Clock size={16} color="#38bdf8" />
                <span>
                  {p.start_time} - {p.end_time}
                </span>
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  color: p.is_active ? '#34d399' : '#94a3b8',
                }}
              >
                {p.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {p.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Period */}
      {(isAddModalOpen || editingPeriod) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setIsAddModalOpen(false);
            setEditingPeriod(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '18px', fontSize: '1.25rem' }}>
              {editingPeriod ? 'Edit Jam Pelajaran' : 'Tambah Jam Pelajaran Baru'}
            </h3>

            <div className="form-group">
              <label className="form-label">Urutan Jam Ke- (Nomor) *</label>
              <input
                type="number"
                min="1"
                max="20"
                className="form-input"
                value={formNumber}
                onChange={(e) => setFormNumber(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nama Sesi Pelajaran *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Jam Ke-1 atau Jam Tambahan"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Waktu Mulai *</label>
                <input
                  type="time"
                  className="form-input"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Waktu Selesai *</label>
                <input
                  type="time"
                  className="form-input"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <input
                type="checkbox"
                id="periodActiveCheck"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
              />
              <label htmlFor="periodActiveCheck" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                Status Aktif untuk Absensi Kelas
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingPeriod(null);
                }}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                onClick={editingPeriod ? handleSaveEdit : handleSaveAdd}
                className="btn btn-primary"
              >
                {editingPeriod ? 'Simpan Perubahan' : 'Tambah Jam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
