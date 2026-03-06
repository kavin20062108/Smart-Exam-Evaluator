import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

const DIFF_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };
const PIE_COLORS = ['#10b981', '#ef4444'];

const Analytics = () => {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [stats, setStats] = useState(null);
    const [difficulty, setDifficulty] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/exams').then(r => {
            setExams(r.data);
            if (r.data.length) setSelectedExam(String(r.data[0].id));
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (!selectedExam) return;
        setLoading(true);
        Promise.all([
            api.get(`/analytics/exam/${selectedExam}`),
            api.get(`/analytics/difficulty/${selectedExam}`),
        ])
            .then(([s, d]) => { setStats(s.data); setDifficulty(d.data); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [selectedExam]);

    const pieData = stats ? [
        { name: 'Passed', value: Number(stats.passed) },
        { name: 'Failed', value: Number(stats.failed) },
    ] : [];

    const radarData = difficulty.map(d => ({
        subject: d.difficulty_level.charAt(0).toUpperCase() + d.difficulty_level.slice(1),
        Correct: Number(d.correct),
        Wrong: Number(d.wrong),
        Skipped: Number(d.skipped),
    }));

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Analytics</h1>
                        <p className="text-muted text-sm mt-1">Performance insights per exam</p>
                    </div>
                    <select
                        className="form-control"
                        style={{ minWidth: '220px' }}
                        value={selectedExam}
                        onChange={e => setSelectedExam(e.target.value)}
                    >
                        {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                    </select>
                </div>

                {loading && <p className="text-muted text-sm">Loading analytics…</p>}

                {stats && !loading && (
                    <>
                        {/* Stat Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            {[
                                { label: 'Total Attempts', value: stats.total_attempts, color: '#6366f1' },
                                { label: 'Avg Percentage', value: `${Number(stats.avg_percentage).toFixed(1)}%`, color: '#0ea5e9' },
                                { label: 'Highest Score', value: stats.highest_score, color: '#10b981' },
                                { label: 'Lowest Score', value: stats.lowest_score, color: '#ef4444' },
                                { label: 'Passed', value: stats.passed, color: '#10b981' },
                                { label: 'Failed', value: stats.failed, color: '#ef4444' },
                            ].map(s => (
                                <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                                    <div className="text-muted text-sm" style={{ marginTop: '0.25rem' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            {/* Pass / Fail Pie */}
                            <div className="card">
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Pass vs Fail</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Difficulty Radar */}
                            <div className="card">
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Difficulty-wise Performance</h3>
                                {radarData.length === 0 ? (
                                    <p className="text-muted text-sm">No attempt data yet.</p>
                                ) : (
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
                                )}
                            </div>
                        </div>

                        {/* Difficulty Bar Chart */}
                        {difficulty.length > 0 && (
                            <div className="card">
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Questions by Difficulty Level</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={difficulty}>
                                        <XAxis dataKey="difficulty_level" tick={{ fill: '#94a3b8', fontSize: 12, textTransform: 'capitalize' }} />
                                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                                        <Bar dataKey="correct" name="Correct" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="wrong" name="Wrong" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="skipped" name="Skipped" fill="#64748b" radius={[4, 4, 0, 0]} />
                                        <Legend />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </>
                )}

                {!loading && !stats && (
                    <div className="card text-center" style={{ padding: '3rem' }}>
                        <p className="text-muted">Select an exam to view analytics.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default Analytics;
