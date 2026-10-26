import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, Plus, Edit, Trash2, Search, Phone, Mail, BookOpen } from 'lucide-react';
import type { TeacherItem } from '../types';

export const TeachersView: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);

  // Form State
  const [formNip, setFormNip] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formSubject, setFormSubject] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.nip.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setFormNip('');
    setFormName('');
    setFormSubject('');
    setFormPhone('');
    setFormEmail('');
    setFormIsActive(true);
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async () => {
    if (!formName.trim() || !formSubject.trim()) {
      alert('Nama guru dan Mata Pelajaran wajib diisi!');
      return;
    }
    await addTeacher({
      nip: formNip.trim(),
      name: formName.trim(),
      subject: formSubject.trim(),
      phone: formPhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      is_active: formIsActive,
    });
    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (t: TeacherItem) => {
    setEditingTeacher(t);
    setFormNip(t.nip);
    setFormName(t.name);
    setFormSubject(t.subject);
    setFormPhone(t.phone || '');
    setFormEmail(t.email || '');
    setFormIsActive(t.is_active ?? true);
  };

  const handleSaveEdit = async () => {
    if (!editingTeacher || !formName.trim() || !formSubject.trim()) return;
    await updateTeacher(editingTeacher.id, {
      nip: formNip.trim(),
      name: formName.trim(),
      subject: formSubject.trim(),
      phone: formPhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      is_active: formIsActive,
    });
    setEditingTeacher(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data guru ${name}?`)) {
      await deleteTeacher(id);
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
            Data Guru & <span style={{ color: '#10b981' }}>Mata Pelajaran</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Kelola data dewan guru, mata pelajaran pengampu, dan kontak
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-emerald">
          <Plus size={16} />
          <span>Tambah Guru Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Cari nama guru, mapel, NIP..."
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

      {/* Grid of Teachers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredTeachers.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Belum ada data guru yang terdaftar.
          </div>
        ) : (
          filteredTeachers.map((t) => (
            <div key={t.id} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem' }}>{t.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      NIP: {t.nip || '-'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="btn btn-secondary btn-icon"
                    title="Edit Guru"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="btn btn-danger btn-icon"
                    title="Hapus Guru"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <BookOpen size={16} color="#34d399" />
                  <span>Mata Pelajaran: <strong style={{ color: '#fff' }}>{t.subject}</strong></span>
                </div>

                {t.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <Phone size={14} />
                    <span>{t.phone}</span>
                  </div>
                )}

                {t.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <Mail size={14} />
                    <span>{t.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Teacher */}
      {(isAddModalOpen || editingTeacher) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setIsAddModalOpen(false);
            setEditingTeacher(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '18px', fontSize: '1.25rem' }}>
              {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
            </h3>

            <div className="form-group">
              <label className="form-label">Nama Lengkap beserta Gelar *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Budi Santoso, M.Pd"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">NIP / NUPTK</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 198503152010011002"
                value={formNip}
                onChange={(e) => setFormNip(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mata Pelajaran yang Diampu *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Matematika Peminatan / Fisika"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor WhatsApp / HP</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 081234567890"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Sekolah</label>
              <input
                type="email"
                className="form-input"
                placeholder="Contoh: guru@sekolah.sch.id"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTeacher(null);
                }}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                onClick={editingTeacher ? handleSaveEdit : handleSaveAdd}
                className="btn btn-primary"
              >
                {editingTeacher ? 'Simpan Perubahan' : 'Tambah Guru'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
