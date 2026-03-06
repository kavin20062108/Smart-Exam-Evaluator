import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { BookOpen, Users, ClipboardList, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [exRes, resRes] = await Promise.all([
                    api.get('/exams'),
                    api.get('/attempts/admin/results'),
                ]);
                setExams(exRes.data);
                setResults(resRes.data);
            } catch (_) { }
            setLoading(false);
        };
        load();
    }, []);

    const avgScore = results.length
        ? (results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length).toFixed(1)
        : 0;

    // Chart data: top 6 exams by attempt count
    const examAttemptMap = {};
    results.forEach((r) => {
        const t = r.exam?.title || 'Unknown';
        examAttemptMap[t] = (examAttemptMap[t] || 0) + 1;
    });
    const chartData = Object.entries(examAttemptMap)
        .map(([name, attempts]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, attempts }))
        .slice(0, 6);

    const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Welcome back, {user?.name} 👋</h1>
                        <p className="text-muted text-sm mt-1">Here's what's happening on your platform.</p>
                    </div>
                    <Link to="/admin/exams" className="btn btn-primary">
                        <BookOpen size={16} /> Manage Exams
                    </Link>
                </div>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
                            <BookOpen size={22} color="#6366f1" />
                        </div>
                        <div className="stat-info">
                            <h3>{loading ? '…' : exams.length}</h3>
                            <p>Total Exams</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(14,165,233,0.15)' }}>
                            <ClipboardList size={22} color="#0ea5e9" />
                        </div>
                        <div className="stat-info">
                            <h3>{loading ? '…' : results.length}</h3>
                            <p>Total Attempts</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
                            <Users size={22} color="#10b981" />
                        </div>
                        <div className="stat-info">
                            <h3>{loading ? '…' : new Set(results.map(r => r.student?.id)).size}</h3>
                            <p>Students</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
                            <TrendingUp size={22} color="#f59e0b" />
                        </div>
                        <div className="stat-info">
                            <h3>{loading ? '…' : `${avgScore}%`}</h3>
                            <p>Avg Score</p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Chart */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Attempts per Exam</h3>
                        {chartData.length === 0 ? (
                            <p className="text-muted text-sm">No attempt data yet.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                                        labelStyle={{ color: '#f1f5f9' }}
                                    />
                                    <Bar dataKey="attempts" radius={[4, 4, 0, 0]}>
                                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Recent Exams */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1rem' }}>Recent Exams</h3>
                            <Link to="/admin/exams" className="btn btn-secondary btn-sm">View All</Link>
                        </div>
                        {loading ? <p className="text-muted text-sm">Loading…</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {exams.slice(0, 5).map((ex) => (
                                    <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: 'var(--bg)', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ex.title}</div>
                                            <div className="text-muted text-sm">{ex.subject} · {ex.duration} min</div>
                                        </div>
                                        <span className="badge badge-primary">{ex.total_marks} marks</span>
                                    </div>
                                ))}
                                {exams.length === 0 && <p className="text-muted text-sm">No exams yet.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;
