import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, ChevronRight, BookOpen, Clock, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const emptyForm = { title: '', subject: '', duration: '', total_marks: '' };

const ExamManager = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [view, setView] = useState('subject'); // 'subject' | 'table'

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/exams');
            setExams(data);
        } catch (_) { toast.error('Failed to load exams'); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true); };
    const openEdit = (ex) => {
        setEditing(ex);
        setForm({ title: ex.title, subject: ex.subject, duration: ex.duration, total_marks: ex.total_marks });
        setModal(true);
    };
    const closeModal = () => { setModal(false); setForm(emptyForm); setEditing(null); };
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editing) {
                await api.put(`/exams/${editing.id}`, form);
                toast.success('Exam updated!');
            } else {
                await api.post('/exams', form);
                toast.success('Exam created!');
            }
            closeModal();
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Save failed');
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this exam and all its questions/attempts?')) return;
        try {
            await api.delete(`/exams/${id}`);
            toast.success('Exam deleted');
            load();
        } catch (_) { toast.error('Delete failed'); }
    };

    // Group exams by subject
    const bySubject = {};
    exams.forEach(ex => {
        const subj = ex.subject || 'Uncategorized';
        if (!bySubject[subj]) bySubject[subj] = [];
        bySubject[subj].push(ex);
    });
    const subjects = Object.keys(bySubject).sort();

    // Subject accent colors (cycles)
    const SUBJECT_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];
    const subjectColor = (subj) => SUBJECT_COLORS[subjects.indexOf(subj) % SUBJECT_COLORS.length];

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Exam Manager</h1>
                        <p className="text-muted text-sm mt-1">
                            {exams.length} exam{exams.length !== 1 ? 's' : ''} across {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* View toggle */}
                        <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                            <button
                                onClick={() => setView('subject')}
                                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: view === 'subject' ? 'var(--primary)' : 'transparent', color: view === 'subject' ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s' }}
                            >By Subject</button>
                            <button
                                onClick={() => setView('table')}
                                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: view === 'table' ? 'var(--primary)' : 'transparent', color: view === 'table' ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s' }}
                            >All Exams</button>
                        </div>
                        <button className="btn btn-primary" onClick={openCreate}>
                            <Plus size={16} /> New Exam
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p className="text-muted text-sm">Loading…</p>
                ) : exams.length === 0 ? (
                    <div className="card text-center" style={{ padding: '3rem' }}>
                        <BookOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem', display: 'block' }} />
                        <p className="text-muted" style={{ marginBottom: '1rem' }}>No exams yet. Create your first one!</p>
                        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Exam</button>
                    </div>
                ) : view === 'subject' ? (
                    /* ── Subject card view ── */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {subjects.map(subj => {
                            const color = subjectColor(subj);
                            const subjExams = bySubject[subj];
                            return (
                                <div key={subj}>
                                    {/* Subject header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color }}>{subj}</h2>
                                        <span className="badge" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                                            {subjExams.length} exam{subjExams.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* Exam cards for this subject */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                        {subjExams.map(ex => (
                                            <div key={ex.id} className="card" style={{ position: 'relative', overflow: 'hidden', padding: '1.1rem' }}>
                                                {/* Left accent border */}
                                                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: color, borderRadius: '4px 0 0 4px' }} />
                                                <div style={{ paddingLeft: '0.75rem' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{ex.title}</div>
                                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                                                        <span className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <Clock size={12} /> {ex.duration} min
                                                        </span>
                                                        <span className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <Star size={12} /> {ex.total_marks} marks
                                                        </span>
                                                        {ex.created_by?.name && (
                                                            <span className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                                <Users size={12} /> {ex.created_by.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Link to={`/admin/questions/${ex.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                                                            <ChevronRight size={13} /> Questions
                                                        </Link>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(ex)}>
                                                            <Pencil size={13} />
                                                        </button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ex.id)}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ── Flat table view ── */
                    <div className="card">
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Title</th>
                                        <th>Subject</th>
                                        <th>Duration</th>
                                        <th>Total Marks</th>
                                        <th>Created By</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exams.map((ex, i) => (
                                        <tr key={ex.id}>
                                            <td className="text-muted text-sm">{i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{ex.title}</td>
                                            <td>
                                                <span className="badge" style={{ background: `${subjectColor(ex.subject)}22`, color: subjectColor(ex.subject), border: `1px solid ${subjectColor(ex.subject)}44` }}>
                                                    {ex.subject}
                                                </span>
                                            </td>
                                            <td>{ex.duration} min</td>
                                            <td><span className="badge badge-primary">{ex.total_marks}</span></td>
                                            <td className="text-muted text-sm">{ex.created_by?.name || '—'}</td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <Link to={`/admin/questions/${ex.id}`} className="btn btn-secondary btn-sm">
                                                        <ChevronRight size={13} /> Questions
                                                    </Link>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(ex)}>
                                                        <Pencil size={13} />
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ex.id)}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.1rem' }}>{editing ? 'Edit Exam' : 'Create Exam'}</h2>
                            <button className="btn btn-secondary btn-sm" onClick={closeModal}><X size={14} /></button>
                        </div>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Exam Title</label>
                                <input name="title" className="form-control" placeholder="e.g. Physics Mid-Term" value={form.title} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <input name="subject" className="form-control" placeholder="e.g. Physics" value={form.subject} onChange={handleChange} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Duration (minutes)</label>
                                    <input name="duration" type="number" min="1" className="form-control" placeholder="60" value={form.duration} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Total Marks</label>
                                    <input name="total_marks" type="number" min="1" className="form-control" placeholder="100" value={form.total_marks} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="flex gap-1 mt-1" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <><span className="spinner" /> Saving…</> : editing ? 'Update Exam' : 'Create Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExamManager;
