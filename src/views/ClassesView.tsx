import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit, Trash2, Users, Search } from 'lucide-react';
import type { ClassItem } from '../types';

export const ClassesView: React.FC = () => {
  const { classes, students, addClass, updateClass, deleteClass } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formGrade, setFormGrade] = useState<string>('10');
  const [formMajor, setFormMajor] = useState<string>('Umum');
  const [formHomeroom, setFormHomeroom] = useState<string>('');
  const [formAcademicYear, setFormAcademicYear] = useState<string>('2026/2027');

  const filteredClasses = classes.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.major.toLowerCase().includes(q) ||
      (c.homeroom_teacher && c.homeroom_teacher.toLowerCase().includes(q))
    );
  });

  const handleOpenAdd = () => {
    setFormName('');
    setFormGrade('10');
    setFormMajor('Umum');
    setFormHomeroom('');
    setFormAcademicYear('2026/2027');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async () => {
    if (!formName.trim()) {
      alert('Nama kelas wajib diisi!');
      return;
    }
    await addClass({
      name: formName.trim(),
      grade: formGrade,
      major: formMajor.trim(),
      homeroom_teacher: formHomeroom.trim() || undefined,
      academic_year: formAcademicYear.trim() || undefined,
    });
    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (c: ClassItem) => {
    setEditingClass(c);
    setFormName(c.name);
    setFormGrade(c.grade);
    setFormMajor(c.major);
    setFormHomeroom(c.homeroom_teacher || '');
    setFormAcademicYear(c.academic_year || '2026/2027');
  };

  const handleSaveEdit = async () => {
    if (!editingClass || !formName.trim()) return;
    await updateClass(editingClass.id, {
      name: formName.trim(),
      grade: formGrade,
      major: formMajor.trim(),
      homeroom_teacher: formHomeroom.trim() || undefined,
      academic_year: formAcademicYear.trim() || undefined,
    });
    setEditingClass(null);
  };

  const handleDelete = async (id: string, name: string) => {
    const studentCount = students.filter((s) => s.class_id === id).length;
    const warning = studentCount > 0 ? ` Perhatian: Ada ${studentCount} siswa di kelas ini yang juga akan terhapus!` : '';
    if (confirm(`Hapus kelas ${name}?${warning}`)) {
      await deleteClass(id);
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
            Data Kelas & <span style={{ color: '#10b981' }}>Wali Kelas</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Kelola tingkatan kelas, jurusan, serta penugasan wali kelas
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-emerald">
          <Plus size={16} />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Cari kelas, jurusan, wali kelas..."
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

      {/* Grid of Classes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredClasses.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Belum ada data kelas yang sesuai.
          </div>
        ) : (
          filteredClasses.map((c) => {
            const classStudents = students.filter((s) => s.class_id === c.id);
            const enrolledCount = classStudents.filter((s) => s.is_enrolled).length;

            return (
              <div key={c.id} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                      }}
                    >
                      Tingkat {c.grade} • {c.major}
                    </span>
                    <h3 style={{ fontSize: '1.375rem', marginTop: '6px' }}>{c.name}</h3>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="btn btn-secondary btn-icon"
                      title="Edit Kelas"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="btn btn-danger btn-icon"
                      title="Hapus Kelas"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '14px' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Wali Kelas: <strong style={{ color: '#fff' }}>{c.homeroom_teacher || 'Belum Ditentukan'}</strong>
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
                    Tahun Ajaran: {c.academic_year || '2026/2027'}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
                      <Users size={16} color="#10b981" />
                      <span><strong>{classStudents.length}</strong> Siswa</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#22d3ee' }}>
                      {enrolledCount} Wajah Terdaftar
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit Class */}
      {(isAddModalOpen || editingClass) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setIsAddModalOpen(false);
            setEditingClass(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '18px', fontSize: '1.25rem' }}>
              {editingClass ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
            </h3>

            <div className="form-group">
              <label className="form-label">Nama Kelas *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: XII MIPA 1 atau X RPL 2"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tingkat Kelas</label>
              <select
                className="form-select"
                value={formGrade}
                onChange={(e) => setFormGrade(e.target.value)}
              >
                <option value="10">Kelas 10 (Fase E)</option>
                <option value="11">Kelas 11 (Fase F)</option>
                <option value="12">Kelas 12 (Fase F)</option>
                <option value="7">Kelas 7 (SMP/MTs)</option>
                <option value="8">Kelas 8 (SMP/MTs)</option>
                <option value="9">Kelas 9 (SMP/MTs)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Jurusan / Peminatan</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: RPL, TKJ, MIPA, IPS, Umum"
                value={formMajor}
                onChange={(e) => setFormMajor(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nama Wali Kelas</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Drs. H. Ahmad Dahlan, M.Pd"
                value={formHomeroom}
                onChange={(e) => setFormHomeroom(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tahun Ajaran</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 2026/2027"
                value={formAcademicYear}
                onChange={(e) => setFormAcademicYear(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingClass(null);
                }}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                onClick={editingClass ? handleSaveEdit : handleSaveAdd}
                className="btn btn-primary"
              >
                {editingClass ? 'Simpan Perubahan' : 'Tambah Kelas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
