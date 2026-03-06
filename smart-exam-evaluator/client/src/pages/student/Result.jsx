import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Trophy, CheckCircle, XCircle, MinusCircle, BarChart2 } from 'lucide-react';

const Result = () => {
    const { attemptId } = useParams();
    const [attempt, setAttempt] = useState(null);
    const [diffData, setDiffData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/attempts/${attemptId}/result`)
            .then(r => {
                setAttempt(r.data);
                // fetch difficulty breakdown for this exam
                if (r.data?.exam_id) {
                    api.get(`/analytics/difficulty/${r.data.exam_id}`)
                        .then(d => setDiffData(d.data))
                        .catch(() => { });
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [attemptId]);

    if (loading) return (
        <><Navbar /><div className="page text-center text-muted" style={{ paddingTop: '4rem' }}>Loading result…</div></>
    );
    if (!attempt) return (
        <><Navbar /><div className="page text-center text-muted" style={{ paddingTop: '4rem' }}>Result not found.</div></>
    );

    const passed = attempt.percentage >= 50;
    const radarData = diffData.map(d => ({
        subject: d.difficulty_level.charAt(0).toUpperCase() + d.difficulty_level.slice(1),
        Correct: Number(d.correct),
        Wrong: Number(d.wrong),
        Skipped: Number(d.skipped),
    }));

    return (
        <>
            <Navbar />
            <div className="page" style={{ maxWidth: '800px' }}>
                {/* Score Card */}
                <div className="card" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '1.5rem', background: passed ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', borderColor: passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>{passed ? '🎉' : '😔'}</div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: passed ? 'var(--success)' : 'var(--danger)', marginBottom: '0.25rem' }}>
                        {attempt.percentage?.toFixed(1)}%
                    </h1>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        {attempt.total_score} / {attempt.exam?.total_marks} marks
                    </div>
                    <span className={`badge ${passed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.9rem', padding: '0.35rem 1rem' }}>
                        {passed ? 'PASSED ✓' : 'FAILED ✗'}
                    </span>
                    {attempt.rank && (
                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Trophy size={18} color="#f59e0b" />
                            <span style={{ fontWeight: 700, color: '#f59e0b' }}>Rank #{attempt.rank}</span>
                        </div>
                    )}
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <CheckCircle size={24} color="var(--success)" style={{ margin: '0 auto 0.5rem' }} />
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{attempt.correct_count}</div>
                        <div className="text-muted text-sm">Correct</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <XCircle size={24} color="var(--danger)" style={{ margin: '0 auto 0.5rem' }} />
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)' }}>{attempt.wrong_count}</div>
                        <div className="text-muted text-sm">Wrong</div>
                    </div>
                    <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <MinusCircle size={24} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                        <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>-{attempt.negative_marks}</div>
                        <div className="text-muted text-sm">Negative Marks</div>
                    </div>
                </div>

                {/* Difficulty Radar */}
                {radarData.length > 0 && (
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <BarChart2 size={18} /> <h3 style={{ fontSize: '1rem' }}>Difficulty-wise Performance</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Radar name="Correct" dataKey="Correct" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                                <Radar name="Wrong" dataKey="Wrong" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                                <Radar name="Skipped" dataKey="Skipped" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                                <Legend />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Answer Review */}
                {attempt.answers?.length > 0 && (
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Answer Review</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {attempt.answers.map((ans, i) => (
                                <div key={ans.id} style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg)', border: `1px solid ${ans.is_correct ? 'rgba(16,185,129,0.3)' : ans.selected_answer ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <span className="text-muted text-sm">Q{i + 1}: {ans.question?.question_text}</span>
                                        {ans.is_correct
                                            ? <CheckCircle size={16} color="var(--success)" />
                                            : ans.selected_answer
                                                ? <XCircle size={16} color="var(--danger)" />
                                                : <MinusCircle size={16} color="var(--text-muted)" />}
                                    </div>
                                    <div className="text-sm" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <span>Your answer: <strong style={{ color: ans.is_correct ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase' }}>{ans.selected_answer || 'Skipped'}</strong></span>
                                        <span>Correct: <strong style={{ color: 'var(--success)', textTransform: 'uppercase' }}>{ans.question?.correct_answer}</strong></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <Link to="/student/exams" className="btn btn-secondary">Browse Exams</Link>
                    <Link to="/student/history" className="btn btn-primary">View History</Link>
                </div>
            </div>
        </>
    );
};

export default Result;
