import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, TrendingUp, History } from 'lucide-react';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [exams, setExams] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/exams'),
            api.get('/attempts/my'),
        ]).then(([ex, at]) => {
            setExams(ex.data);
            setAttempts(at.data);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const attemptedIds = new Set(attempts.map(a => a.exam_id));
    const available = exams.filter(e => !attemptedIds.has(e.id));
    const avgScore = attempts.length
        ? (attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length).toFixed(1)
        : null;

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Welcome, {user?.name} 👋</h1>
                        <p className="text-muted text-sm mt-1">Ready to test your knowledge?</p>
                    </div>
                    <Link to="/student/exams" className="btn btn-primary">
                        <BookOpen size={16} /> Browse Exams
                    </Link>
                </div>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
                            <BookOpen size={22} color="#6366f1" />
                        </div>
                        <div className="stat-info">
                            <h3>{loading ? '…' : available.length}</h3>
                            <p>Exams Available</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(14,165,233,0.15)' }}>
                            <ClipboardList size={22} color="#0ea5e9" />
                        </div>
                        <div className="stat-info">
                            <h3>{loading ? '…' : attempts.length}</h3>
                            <p>Exams Attempted</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
                            <TrendingUp size={22} color="#10b981" />
                        </div>
                        <div className="stat-info">
                            <h3>{loading ? '…' : avgScore !== null ? `${avgScore}%` : '—'}</h3>
                            <p>Average Score</p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Available Exams */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1rem' }}>Available Exams</h3>
                            <Link to="/student/exams" className="btn btn-secondary btn-sm">View All</Link>
                        </div>
                        {loading ? <p className="text-muted text-sm">Loading…</p> : available.length === 0 ? (
                            <p className="text-muted text-sm">No exams available — check back later or you've attempted all of them!</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {available.slice(0, 4).map(ex => (
                                    <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ex.title}</div>
                                            <div className="text-muted text-sm">{ex.subject} · {ex.duration} min · {ex.total_marks} marks</div>
                                        </div>
                                        <Link to={`/student/exams`} className="btn btn-primary btn-sm">Start</Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Attempts */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1rem' }}>Recent Attempts</h3>
                            <Link to="/student/history" className="btn btn-secondary btn-sm">
                                <History size={13} /> History
                            </Link>
                        </div>
                        {loading ? <p className="text-muted text-sm">Loading…</p> : attempts.length === 0 ? (
                            <p className="text-muted text-sm">No attempts yet. Take your first exam!</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {attempts.slice(0, 4).map(at => (
                                    <div key={at.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{at.exam?.title}</div>
                                            <div className="text-muted text-sm">{at.exam?.subject}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className={`badge ${at.percentage >= 50 ? 'badge-success' : 'badge-danger'}`}>
                                                {at.percentage?.toFixed(1)}%
                                            </span>
                                            <div className="text-muted text-sm mt-1">Rank #{at.rank || '—'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentDashboard;
