import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, Clock, Star, PlayCircle, CheckCircle, Trophy, Hourglass } from 'lucide-react';

const ExamList = () => {
    const [exams, setExams] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const exRes = await api.get('/exams');
                setExams(exRes.data);
            } catch (_) {
                toast.error('Failed to load exams');
            }
            try {
                const atRes = await api.get('/attempts/my');
                setAttempts(atRes.data);
            } catch (_) { /* non-critical */ }
            setLoading(false);
        };
        load();
    }, []);

    // Build lookup: examId → attempt
    const attemptedMap = {};
    attempts.forEach(a => {
        const examId = String(a.exam?.id || a.exam?._id || a.exam_id || '');
        if (examId) attemptedMap[examId] = a;
    });

    const handleStart = async (examId) => {
        setStarting(examId);
        try {
            const { data } = await api.post('/attempts/start', { exam_id: examId });
            toast.success('Exam started! Good luck! 🎯');
            navigate(`/student/exam/${data.id}?examId=${examId}`);
        } catch (err) {
            if (err.response?.status === 409) {
                toast.error('You already attempted this exam.');
            } else {
                toast.error(err.response?.data?.error || 'Failed to start exam');
            }
        }
        setStarting(null);
    };

    const handleContinue = (attempt, examId) => {
        navigate(`/student/exam/${attempt.id}?examId=${examId}`);
    };

    const handleViewResult = (attemptId) => navigate(`/student/result/${attemptId}`);

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Available Exams</h1>
                        <p className="text-muted text-sm mt-1">{exams.length} exam{exams.length !== 1 ? 's' : ''} available</p>
                    </div>
                </div>

                {loading ? (
                    <p className="text-muted text-sm">Loading exams…</p>
                ) : exams.length === 0 ? (
                    <div className="card text-center" style={{ padding: '3rem' }}>
                        <BookOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                        <p className="text-muted">No exams available yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        {exams.map(ex => {
                            const attempt = attemptedMap[String(ex.id || ex._id)];
                            // Three states: not started | in-progress (started, no submitted_at) | completed (submitted_at set)
                            const isCompleted = !!(attempt?.submitted_at);
                            const isInProgress = !!(attempt && !attempt.submitted_at);

                            // Accent bar color
                            const barGradient = isCompleted
                                ? 'linear-gradient(90deg, #10b981, #0ea5e9)'   // green — done
                                : isInProgress
                                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)' // amber — in progress
                                    : 'linear-gradient(90deg, #6366f1, #0ea5e9)'; // indigo — not started

                            return (
                                <div key={ex.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden', opacity: isCompleted ? 0.92 : 1 }}>
                                    {/* Accent bar */}
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: barGradient }} />

                                    {/* Title row */}
                                    <div style={{ paddingTop: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, flex: 1 }}>{ex.title}</h3>
                                            {isCompleted && <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} />}
                                            {isInProgress && <Hourglass size={18} color="#f59e0b" style={{ flexShrink: 0 }} />}
                                        </div>
                                        <span className="badge badge-primary" style={{ marginTop: '0.4rem' }}>{ex.subject}</span>
                                    </div>

                                    {/* Info row */}
                                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} className="text-muted text-sm">
                                            <Clock size={13} /> {ex.duration} minutes
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} className="text-muted text-sm">
                                            <Star size={13} /> {ex.total_marks} marks
                                        </div>
                                    </div>

                                    {/* Action area */}
                                    {isCompleted ? (
                                        /* ── COMPLETED: show score + View Result only, NO retry ── */
                                        <div>
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                background: 'var(--bg)', borderRadius: 8, padding: '0.65rem 0.9rem', marginBottom: '0.75rem'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Trophy size={14} color="#f59e0b" />
                                                    <span className="text-muted text-sm">Your Score</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                                                        {attempt.total_score ?? '—'} / {ex.total_marks}
                                                    </span>
                                                    <span className={`badge ${(attempt.percentage ?? 0) >= 50 ? 'badge-success' : 'badge-danger'}`}>
                                                        {attempt.percentage != null ? `${Number(attempt.percentage).toFixed(1)}%` : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-secondary btn-block"
                                                onClick={() => handleViewResult(attempt.id)}
                                            >
                                                <CheckCircle size={15} /> View Result
                                            </button>
                                        </div>
                                    ) : isInProgress ? (
                                        /* ── IN PROGRESS: can continue ── */
                                        <div>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                                                borderRadius: 8, padding: '0.55rem 0.9rem', marginBottom: '0.75rem'
                                            }}>
                                                <Hourglass size={14} color="#f59e0b" />
                                                <span style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>
                                                    Exam in progress — not submitted yet
                                                </span>
                                            </div>
                                            <button
                                                className="btn btn-primary btn-block"
                                                onClick={() => handleContinue(attempt, String(ex.id || ex._id))}
                                            >
                                                <PlayCircle size={15} /> Continue Exam
                                            </button>
                                        </div>
                                    ) : (
                                        /* ── NOT STARTED ── */
                                        <button
                                            className="btn btn-primary btn-block"
                                            onClick={() => handleStart(String(ex.id || ex._id))}
                                            disabled={starting === String(ex.id || ex._id)}
                                        >
                                            {starting === String(ex.id || ex._id)
                                                ? <><span className="spinner" /> Starting…</>
                                                : <><PlayCircle size={16} /> Start Exam</>}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default ExamList;
