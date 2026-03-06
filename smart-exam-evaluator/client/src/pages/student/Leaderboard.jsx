import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Medal } from 'lucide-react';

const Leaderboard = () => {
    const { user } = useAuth();
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [board, setBoard] = useState([]);
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
        api.get(`/attempts/leaderboard/${selectedExam}`)
            .then(r => setBoard(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [selectedExam]);

    const rankStyle = (rank) => {
        if (rank === 1) return { color: '#f59e0b', fontWeight: 800 };
        if (rank === 2) return { color: '#94a3b8', fontWeight: 700 };
        if (rank === 3) return { color: '#cd7c2f', fontWeight: 700 };
        return {};
    };

    const RankIcon = ({ rank }) => {
        if (rank === 1) return <Trophy size={18} color="#f59e0b" />;
        if (rank === 2) return <Medal size={18} color="#94a3b8" />;
        if (rank === 3) return <Medal size={18} color="#cd7c2f" />;
        return null;
    };

    const myEntry = board.find(e => e.student_id === user?.id);

    return (
        <>
            <Navbar />
            <div className="page" style={{ maxWidth: '800px' }}>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">🏆 Leaderboard</h1>
                        <p className="text-muted text-sm mt-1">Top performers ranked by score</p>
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

                {/* My rank callout */}
                {myEntry && (
                    <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div className="text-muted text-sm">Your Position</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Rank #{myEntry.rank}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="text-muted text-sm">Your Score</div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{myEntry.total_score} pts — {myEntry.percentage?.toFixed(1)}%</div>
                        </div>
                    </div>
                )}

                <div className="card">
                    {loading ? (
                        <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '2rem' }}>Loading leaderboard…</p>
                    ) : board.length === 0 ? (
                        <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '2rem' }}>No attempts yet for this exam.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {board.map((entry, i) => {
                                const isMe = entry.student_id === user?.id;
                                return (
                                    <div
                                        key={entry.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            padding: '1rem 1.25rem',
                                            borderBottom: i < board.length - 1 ? '1px solid var(--border)' : 'none',
                                            background: isMe ? 'rgba(99,102,241,0.06)' : 'transparent',
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        {/* Rank */}
                                        <div style={{ width: '40px', textAlign: 'center', flexShrink: 0 }}>
                                            {entry.rank <= 3
                                                ? <RankIcon rank={entry.rank} />
                                                : <span className="text-muted text-sm" style={{ fontWeight: 700 }}>#{entry.rank}</span>}
                                        </div>

                                        {/* Avatar */}
                                        <div style={{
                                            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                                            background: isMe ? 'var(--primary)' : 'var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: '0.95rem', color: '#fff',
                                        }}>
                                            {entry.student?.name?.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Name */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: isMe ? 700 : 500, ...rankStyle(entry.rank) }}>
                                                {entry.student?.name} {isMe && <span className="badge badge-primary" style={{ marginLeft: '0.4rem' }}>You</span>}
                                            </div>
                                            <div className="text-muted text-sm">{entry.student?.email}</div>
                                        </div>

                                        {/* Score */}
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, ...rankStyle(entry.rank) }}>{entry.total_score} pts</div>
                                            <div className="text-muted text-sm">{entry.percentage?.toFixed(1)}%</div>
                                        </div>

                                        {/* Pass/fail badge */}
                                        <span className={`badge ${entry.percentage >= 50 ? 'badge-success' : 'badge-danger'}`}>
                                            {entry.percentage >= 50 ? 'P' : 'F'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Leaderboard;
