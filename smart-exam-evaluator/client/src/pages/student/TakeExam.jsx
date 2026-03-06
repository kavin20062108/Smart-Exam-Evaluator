import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Timer from '../../components/Timer';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

const TakeExam = () => {
    const { attemptId } = useParams();
    const [params] = useSearchParams();
    const examId = params.get('examId');
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [exam, setExam] = useState(null);
    const [selected, setSelected] = useState({}); // { question_id: 'a'|'b'|'c'|'d' }
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const submittedRef = useRef(false);

    useEffect(() => {
        Promise.all([
            api.get(`/exams/${examId}`),
            api.get(`/questions/exam/${examId}`),
        ]).then(([ex, qs]) => {
            setExam(ex.data);
            setQuestions(qs.data);
        }).catch(() => toast.error('Failed to load exam'))
            .finally(() => setLoading(false));
    }, [examId]);

    // Build answers array from selected map
    const buildAnswers = useCallback((qs, sel) =>
        qs.map(q => ({ question_id: q.id, selected_answer: sel[q.id] || null })),
        []
    );

    const doSubmit = useCallback(async (autoSubmit = false) => {
        if (submittedRef.current || submitting) return;
        submittedRef.current = true;
        setSubmitting(true);

        if (autoSubmit) toast('⏰ Time is up! Auto-submitting…', { icon: '⚠️' });

        try {
            await api.post(`/attempts/${attemptId}/submit`, {
                answers: buildAnswers(questions, selected),
            });
            toast.success('Exam submitted!');
            navigate(`/student/result/${attemptId}`, { replace: true });
        } catch (err) {
            const msg = err.response?.data?.error || 'Submission failed';
            if (err.response?.status === 409) {
                // already submitted — just navigate to result
                navigate(`/student/result/${attemptId}`, { replace: true });
            } else {
                toast.error(msg);
                submittedRef.current = false;
                setSubmitting(false);
            }
        }
    }, [attemptId, buildAnswers, navigate, questions, selected, submitting]);

    const handleSelect = (questionId, option) => {
        setSelected(prev => ({ ...prev, [questionId]: option }));
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        );
    }

    const q = questions[current];
    const answered = Object.keys(selected).length;
    const progress = questions.length ? (answered / questions.length) * 100 : 0;
    const options = ['a', 'b', 'c', 'd'];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Bar */}
            <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{exam?.title}</div>
                    <div className="text-muted text-sm">{exam?.subject} · {questions.length} questions</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="text-muted text-sm">{answered}/{questions.length} answered</span>
                    {exam && <Timer durationSeconds={exam.duration * 60} onExpire={() => doSubmit(true)} />}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar" style={{ borderRadius: 0, height: '3px' }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Question Area */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
                <div style={{ width: '100%', maxWidth: '700px' }}>
                    {q && (
                        <div className="card question-card">
                            <div className="question-number">
                                Question {current + 1} of {questions.length}
                            </div>
                            <div className="question-text">{q.question_text}</div>
                            <div className="option-list">
                                {options.map(opt => (
                                    <div
                                        key={opt}
                                        className={`option-item${selected[q.id] === opt ? ' selected' : ''}`}
                                        onClick={() => handleSelect(q.id, opt)}
                                    >
                                        <div className="option-key">{opt}</div>
                                        <span style={{ fontSize: '0.95rem' }}>{q[`option_${opt}`]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setCurrent(c => Math.max(0, c - 1))}
                            disabled={current === 0}
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>

                        {/* Question dots (up to 20 shown) */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '400px' }}>
                            {questions.slice(0, 20).map((qDot, i) => (
                                <button
                                    key={qDot.id}
                                    onClick={() => setCurrent(i)}
                                    style={{
                                        width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700,
                                        background: i === current ? 'var(--primary)' : selected[qDot.id] ? 'var(--success)' : 'var(--border)',
                                        color: '#fff',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            {questions.length > 20 && <span className="text-muted text-sm">+{questions.length - 20} more</span>}
                        </div>

                        {current === questions.length - 1 ? (
                            <button
                                className="btn btn-success"
                                onClick={() => doSubmit(false)}
                                disabled={submitting}
                            >
                                {submitting ? <><span className="spinner" /> Submitting…</> : <><Send size={15} /> Submit</>}
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TakeExam;
