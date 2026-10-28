import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Plus, Edit, Trash2, CheckCircle2, XCircle, Sparkles, BookOpen } from 'lucide-react';
import type { PeriodItem } from '../types';

export const PeriodsView: React.FC = () => {
  const { periods, addPeriod, updatePeriod, deletePeriod } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<PeriodItem | null>(null);

  // Form State
  const [formStartNum, setFormStartNum] = useState<number>(1);
  const [formEndNum, setFormEndNum] = useState<number>(1);
  const [formName, setFormName] = useState<string>('Jam Ke-1');
  const [formStart, setFormStart] = useState<string>('07:00');
  const [formEnd, setFormEnd] = useState<string>('07:45');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  const handleOpenAdd = () => {
    let nextStart = 1;
    if (periods.length > 0) {
      const maxEnd = Math.max(
        ...periods.map((p) => p.period_end_number || p.period_number)
      );
      nextStart = maxEnd + 1;
    }
    const nextEnd = nextStart + 1; // Default to 2 JP block, very common in schools
    setFormStartNum(nextStart);
    setFormEndNum(nextEnd);
    setFormName(`Jam Ke ${nextStart}-${nextEnd}`);
    setFormStart('07:00');
    setFormEnd('08:30');
    setFormIsActive(true);
    setIsAddModalOpen(true);
  };

  const updateRange = (start: number, end: number) => {
    const validEnd = Math.max(start, end);
    setFormStartNum(start);
    setFormEndNum(validEnd);
    if (start === validEnd) {
      setFormName(`Jam Ke-${start}`);
    } else {
      setFormName(`Jam Ke ${start}-${validEnd}`);
    }
  };

  const handleSaveAdd = async () => {
    if (!formName.trim() || !formStart || !formEnd) {
      alert('Nama sesi, waktu mulai, dan selesai wajib diisi!');
      return;
    }
    await addPeriod({
      period_number: Number(formStartNum),
      period_end_number: Number(formEndNum),
      name: formName.trim(),
      start_time: formStart,
      end_time: formEnd,
      is_active: formIsActive,
    });
    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (p: PeriodItem) => {
    setEditingPeriod(p);
    setFormStartNum(p.period_number);
    setFormEndNum(p.period_end_number || p.period_number);
    setFormName(p.name);
    setFormStart(p.start_time);
    setFormEnd(p.end_time);
    setFormIsActive(p.is_active);
  };

  const handleSaveEdit = async () => {
    if (!editingPeriod || !formName.trim() || !formStart || !formEnd) return;
    await updatePeriod(editingPeriod.id, {
      period_number: Number(formStartNum),
      period_end_number: Number(formEndNum),
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

  // Preset Template loader
  const handleApplyPresetBlock = async () => {
    if (
      !confirm(
        'Terapkan template jam mengajar guru fleksibel (Jam 1-2, Jam 3-4, Jam 5, Jam 6-7, Jam 8-9)? Jam yang ada saat ini akan digantikan.'
      )
    ) {
      return;
    }

    // Delete existing
    for (const p of periods) {
      await deletePeriod(p.id);
    }

    // Add preset
    const presets: Omit<PeriodItem, 'id'>[] = [
      {
        period_number: 1,
        period_end_number: 2,
        name: 'Jam Ke 1-2',
        start_time: '07:00',
        end_time: '08:30',
        is_active: true,
      },
      {
        period_number: 3,
        period_end_number: 4,
        name: 'Jam Ke 3-4',
        start_time: '08:30',
        end_time: '10:00',
        is_active: true,
      },
      {
        period_number: 5,
        period_end_number: 5,
        name: 'Jam Ke 5',
        start_time: '10:15',
        end_time: '11:00',
        is_active: true,
      },
      {
        period_number: 6,
        period_end_number: 7,
        name: 'Jam Ke 6-7',
        start_time: '11:00',
        end_time: '12:30',
        is_active: true,
      },
      {
        period_number: 8,
        period_end_number: 9,
        name: 'Jam Ke 8-9',
        start_time: '13:00',
        end_time: '14:30',
        is_active: true,
      },
    ];

    for (const item of presets) {
      await addPeriod(item);
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
            Pengaturan <span style={{ color: '#10b981' }}>Jam Pelajaran & Jam Mengajar</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Mendukung jam tunggal maupun rentang jam mengajar guru (misal: <strong>Jam 1-2</strong>, <strong>Jam 3-4</strong>, <strong>Jam 5</strong>, <strong>Jam 8-9</strong>)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleApplyPresetBlock}
            className="btn btn-secondary"
            title="Muat contoh jadwal blok mengajar umum"
          >
            <Sparkles size={16} color="#38bdf8" />
            <span>Preset Jam Guru (1-2, 3-4, 5, 8-9)</span>
          </button>
          <button onClick={handleOpenAdd} className="btn btn-emerald">
            <Plus size={16} />
            <span>Tambah Jam / Rentang Baru</span>
          </button>
        </div>
      </div>

      {/* Grid of Periods */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '18px',
        }}
      >
        {periods.map((p) => {
          const endNum = p.period_end_number || p.period_number;
          const jpCount = endNum - p.period_number + 1;
          const isRange = jpCount > 1;

          return (
            <div
              key={p.id}
              className="glass-card"
              style={{
                padding: '20px',
                borderLeft: `4px solid ${p.is_active ? '#10b981' : '#64748b'}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: isRange ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: isRange ? '#34d399' : '#60a5fa',
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <BookOpen size={13} />
                    {p.period_number}
                    {isRange ? ` - ${endNum}` : ''}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '1.125rem' }}>{p.name}</h3>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      Durasi: {jpCount} Jam Pelajaran ({jpCount} JP)
                    </span>
                  </div>
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
          );
        })}
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

            {/* Range Configuration (Start Period & End Period) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Mulai Jam Ke- *</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  className="form-input"
                  value={formStartNum}
                  onChange={(e) => updateRange(Number(e.target.value), formEndNum)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sampai Jam Ke- *</label>
                <input
                  type="number"
                  min={formStartNum}
                  max="15"
                  className="form-input"
                  value={formEndNum}
                  onChange={(e) => updateRange(formStartNum, Number(e.target.value))}
                />
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '-8px', marginBottom: '14px' }}>
              {formStartNum === formEndNum
                ? `Satu Jam Tunggal (Jam ke-${formStartNum})`
                : `Rentang Blok Jam Mengajar Guru: Jam ${formStartNum} s/d ${formEndNum} (${formEndNum - formStartNum + 1} JP)`}
            </p>

            <div className="form-group">
              <label className="form-label">Label / Nama Sesi Pelajaran *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Jam Ke 1-2, Jam Ke 5, Jam Ke 8-9"
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

            <div
              className="form-group"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: '10px',
                marginTop: '8px',
              }}
            >
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
