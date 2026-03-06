import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, ArrowLeft, Upload, FileJson, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

/* ─── Smart field normalizer — handles many different JSON formats ── */
const normalizeQuestion = (q) => {
    const out = {};

    // ── question_text: accept 'question', 'question_text', 'text', 'stem'
    out.question_text =
        q.question_text || q.question || q.text || q.stem || q.Question || q.QuestionText || '';

    // ── options: accept flat (option_a…) OR nested (options: {A, B, C, D})
    if (q.option_a !== undefined) {
        out.option_a = q.option_a;
        out.option_b = q.option_b;
        out.option_c = q.option_c;
        out.option_d = q.option_d;
    } else if (q.options && typeof q.options === 'object') {
        const o = q.options;
        out.option_a = o.A || o.a || o['1'] || '';
        out.option_b = o.B || o.b || o['2'] || '';
        out.option_c = o.C || o.c || o['3'] || '';
        out.option_d = o.D || o.d || o['4'] || '';
    } else if (Array.isArray(q.options)) {
        out.option_a = q.options[0] || '';
        out.option_b = q.options[1] || '';
        out.option_c = q.options[2] || '';
        out.option_d = q.options[3] || '';
    } else {
        // Try individual fields A, B, C, D
        out.option_a = q.A || q.a || q.OptionA || q.option_a || '';
        out.option_b = q.B || q.b || q.OptionB || q.option_b || '';
        out.option_c = q.C || q.c || q.OptionC || q.option_c || '';
        out.option_d = q.D || q.d || q.OptionD || q.option_d || '';
    }

    // ── correct_answer: accept 'answer', 'correct', 'ans', 'correctAnswer' — normalize to lowercase a/b/c/d
    const raw = q.correct_answer ?? q.answer ?? q.correct ?? q.ans ?? q.correctAnswer ?? q.CorrectAnswer ?? '';
    const letter = String(raw).trim().toLowerCase().replace(/^option_?/, '');
    // Map '1'→'a', '2'→'b' etc or just use the letter
    const letterMap = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
    out.correct_answer = letterMap[letter] || letter || 'a';

    // ── marks
    out.marks = Number(q.marks || q.mark || q.point || q.points || 1);
    if (isNaN(out.marks) || out.marks <= 0) out.marks = 1;

    // ── difficulty
    const diff = String(q.difficulty_level || q.difficulty || q.level || 'medium').toLowerCase();
    out.difficulty_level = ['easy', 'medium', 'hard'].includes(diff) ? diff : 'medium';

    return out;
};

/* ─── JSON Template ───────────────────────────────────────────── */
const TEMPLATE = [
    {
        question_text: "What is the capital of France?",
        option_a: "Berlin",
        option_b: "Madrid",
        option_c: "Paris",
        option_d: "Rome",
        correct_answer: "c",
        marks: 1,
        difficulty_level: "easy"
    },
    {
        question: "Which planet is closest to the Sun?",
        options: { A: "Venus", B: "Earth", C: "Mercury", D: "Mars" },
        answer: "C",
        marks: 1,
        difficulty: "easy"
    }
];

const emptyForm = {
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: 'a', marks: 1, difficulty_level: 'medium',
};

/* ─── Component ───────────────────────────────────────────────── */
const QuestionManager = () => {
    const { examId } = useParams();
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Single-add modal
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ ...emptyForm, exam_id: examId });
    const [saving, setSaving] = useState(false);

    // Bulk-import modal
    const [bulkModal, setBulkModal] = useState(false);
    const [jsonText, setJsonText] = useState('');
    const [parsed, setParsed] = useState(null);
    const [parseError, setParseError] = useState('');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileRef = useRef(null);

    /* ── Load ──────────────────────────────────────────────────── */
    const load = async () => {
        setLoading(true);
        try {
            const [exRes, qRes] = await Promise.all([
                api.get(`/exams/${examId}`),
                api.get(`/questions/exam/${examId}`),
            ]);
            setExam(exRes.data);
            setQuestions(qRes.data);
        } catch (_) { toast.error('Failed to load questions'); }
        setLoading(false);
    };

    useEffect(() => { load(); }, [examId]);

    /* ── Single question handlers ──────────────────────────────── */
    const openCreate = () => { setEditing(null); setForm({ ...emptyForm, exam_id: examId }); setModal(true); };
    const openEdit = (q) => { setEditing(q); setForm({ ...q }); setModal(true); };
    const closeModal = () => { setModal(false); setEditing(null); };

    const handleChange = (e) => {
        const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
        setForm({ ...form, [e.target.name]: val });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editing) {
                await api.put(`/questions/${editing.id}`, form);
                toast.success('Question updated!');
            } else {
                await api.post('/questions', form);
                toast.success('Question added!');
            }
            closeModal();
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.errors?.[0] || 'Save failed');
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this question?')) return;
        try {
            await api.delete(`/questions/${id}`);
            toast.success('Question deleted');
            load();
        } catch (_) { toast.error('Delete failed'); }
    };

    /* ── Bulk import handlers ──────────────────────────────────── */
    const openBulk = () => {
        setBulkModal(true);
        setJsonText('');
        setParsed(null);
        setParseError('');
        setImportResult(null);
    };
    const closeBulk = () => setBulkModal(false);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setJsonText(ev.target.result);
            parseJson(ev.target.result);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const parseJson = (text) => {
        try {
            const data = JSON.parse(text);
            const arr = Array.isArray(data) ? data : (data.questions || null);
            if (!Array.isArray(arr)) throw new Error('Expected a JSON array (or object with a "questions" array)');
            // Normalize every item to our required shape
            const normalized = arr.map(normalizeQuestion);
            setParsed(normalized);
            setParseError('');
        } catch (err) {
            setParsed(null);
            setParseError(err.message);
        }
    };

    const handleJsonTextChange = (e) => {
        setJsonText(e.target.value);
        parseJson(e.target.value);
    };

    const downloadTemplate = () => {
        const blob = new Blob([JSON.stringify(TEMPLATE, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'questions_template.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleBulkImport = async () => {
        if (!parsed?.length) return;
        setImporting(true);
        setImportResult(null);
        try {
            // parsed is already normalized, but apply again as a safety net
            const normalized = parsed.map(normalizeQuestion);
            const { data } = await api.post('/questions/bulk', { exam_id: examId, questions: normalized });
            setImportResult(data);
            toast.success(data.message);
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Import failed');
        }
        setImporting(false);
    };

    /* ── Render ────────────────────────────────────────────────── */
    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header">
                    <div>
                        <Link to="/admin/exams" className="btn btn-secondary btn-sm" style={{ marginBottom: '0.5rem' }}>
                            <ArrowLeft size={13} /> Back to Exams
                        </Link>
                        <h1 className="page-title">{exam?.title || 'Questions'}</h1>
                        <p className="text-muted text-sm mt-1">{exam?.subject} · {questions.length} question{questions.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={openBulk}>
                            <Upload size={15} /> Bulk Import
                        </button>
                        <button className="btn btn-primary" onClick={openCreate}>
                            <Plus size={16} /> Add Question
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Question</th>
                                    <th>Correct</th>
                                    <th>Marks</th>
                                    <th>Difficulty</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center text-muted" style={{ padding: '2rem' }}>Loading…</td></tr>
                                ) : questions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '3rem', textAlign: 'center' }}>
                                            <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                                <FileJson size={40} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.4 }} />
                                                No questions yet.
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={openBulk}><Upload size={13} /> Bulk Import JSON</button>
                                                <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={13} /> Add Manually</button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : questions.map((q, i) => (
                                    <tr key={q.id}>
                                        <td className="text-muted text-sm">{i + 1}</td>
                                        <td style={{ maxWidth: '380px' }}>
                                            <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.35rem' }}>{q.question_text}</div>
                                            <div className="text-muted text-sm" style={{ lineHeight: 1.8 }}>
                                                <span style={{ marginRight: '1rem' }}>A: {q.option_a}</span>
                                                <span style={{ marginRight: '1rem' }}>B: {q.option_b}</span>
                                                <span style={{ marginRight: '1rem' }}>C: {q.option_c}</span>
                                                <span>D: {q.option_d}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-success" style={{ textTransform: 'uppercase' }}>
                                                {q.correct_answer}
                                            </span>
                                        </td>
                                        <td>{q.marks}</td>
                                        <td><span className={`badge badge-${q.difficulty_level}`}>{q.difficulty_level}</span></td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(q)}><Pencil size={13} /></button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}><Trash2 size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Single Question Modal ── */}
            {modal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 999, padding: '2rem 1rem', overflowY: 'auto' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.1rem' }}>{editing ? 'Edit Question' : 'Add Question'}</h2>
                            <button className="btn btn-secondary btn-sm" onClick={closeModal}><X size={14} /></button>
                        </div>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Question Text</label>
                                <textarea name="question_text" className="form-control" rows={3} placeholder="Enter question here…" value={form.question_text} onChange={handleChange} required style={{ resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {['a', 'b', 'c', 'd'].map((opt) => (
                                    <div className="form-group" key={opt}>
                                        <label>Option {opt.toUpperCase()}</label>
                                        <input name={`option_${opt}`} className="form-control" placeholder={`Option ${opt.toUpperCase()}`} value={form[`option_${opt}`]} onChange={handleChange} required />
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Correct Answer</label>
                                    <select name="correct_answer" className="form-control" value={form.correct_answer} onChange={handleChange}>
                                        {['a', 'b', 'c', 'd'].map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Marks</label>
                                    <input name="marks" type="number" min="0.5" step="0.5" className="form-control" value={form.marks} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Difficulty</label>
                                    <select name="difficulty_level" className="form-control" value={form.difficulty_level} onChange={handleChange}>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-1 mt-1" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <><span className="spinner" /> Saving…</> : editing ? 'Update Question' : 'Add Question'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Bulk Import Modal ── */}
            {bulkModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 999, padding: '2rem 1rem', overflowY: 'auto' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '720px' }}>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <FileJson size={22} color="var(--primary-light)" />
                                <h2 style={{ fontSize: '1.15rem' }}>Bulk Import Questions</h2>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={closeBulk}><X size={14} /></button>
                        </div>

                        {/* Step 1 — Upload or Paste */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                {/* File upload */}
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => fileRef.current?.click()}
                                    style={{ flex: 1, minWidth: 160, border: '2px dashed var(--border)', background: 'var(--bg)' }}
                                >
                                    <Upload size={15} /> Upload JSON File
                                </button>
                                <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleFileUpload} />

                                {/* Download template */}
                                <button className="btn btn-secondary" onClick={downloadTemplate} style={{ flex: 1, minWidth: 160 }}>
                                    <Download size={15} /> Download Template
                                </button>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                    OR paste JSON directly:
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={10}
                                    placeholder={`[\n  {\n    "question_text": "What is 2+2?",\n    "option_a": "3",\n    "option_b": "4",\n    "option_c": "5",\n    "option_d": "6",\n    "correct_answer": "b",\n    "marks": 1,\n    "difficulty_level": "easy"\n  }\n]`}
                                    value={jsonText}
                                    onChange={handleJsonTextChange}
                                    style={{ fontFamily: 'monospace', fontSize: '0.82rem', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        {/* Parse status */}
                        {parseError && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                                <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                                <span style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>{parseError}</span>
                            </div>
                        )}

                        {parsed && !parseError && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                                <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: 600 }}>
                                    {parsed.length} question{parsed.length !== 1 ? 's' : ''} detected — ready to import
                                </span>
                            </div>
                        )}

                        {/* Import result feedback */}
                        {importResult && (
                            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--success)' }}>
                                    ✅ {importResult.inserted} imported · {importResult.skipped} skipped
                                </div>
                                {importResult.errors?.length > 0 && (
                                    <div>
                                        <div style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '0.35rem' }}>Errors:</div>
                                        <ul style={{ paddingLeft: '1rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                                            {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* JSON Format guide */}
                        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text)' }}>📋 Required JSON fields per question:</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem 1rem' }}>
                                <span><code style={{ color: 'var(--primary-light)' }}>question_text</code> — string (required)</span>
                                <span><code style={{ color: 'var(--primary-light)' }}>correct_answer</code> — "a" | "b" | "c" | "d"</span>
                                <span><code style={{ color: 'var(--primary-light)' }}>option_a / b / c / d</code> — strings</span>
                                <span><code style={{ color: 'var(--primary-light)' }}>marks</code> — number (default 1)</span>
                                <span><code style={{ color: 'var(--primary-light)' }}>difficulty_level</code> — easy | medium | hard</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={closeBulk}>Close</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleBulkImport}
                                disabled={!parsed || !!parseError || importing}
                            >
                                {importing
                                    ? <><span className="spinner" /> Importing…</>
                                    : <><Upload size={15} /> Import {parsed?.length || 0} Questions</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default QuestionManager;
