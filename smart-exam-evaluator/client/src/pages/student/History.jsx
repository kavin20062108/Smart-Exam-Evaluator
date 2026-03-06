import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { Trophy, Clock, CheckCircle } from 'lucide-react';

const History = () => {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/attempts/my')
            .then(r => setAttempts(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Attempt History</h1>
                        <p className="text-muted text-sm mt-1">{attempts.length} exam{attempts.length !== 1 ? 's' : ''} attempted</p>
                    </div>
                </div>

                {loading ? (
                    <p className="text-muted text-sm">Loading…</p>
                ) : attempts.length === 0 ? (
                    <div className="card text-center" style={{ padding: '3rem' }}>
                        <p className="text-muted">No attempts yet. <Link to="/student/exams" style={{ color: 'var(--primary-light)' }}>Take an exam →</Link></p>
                    </div>
                ) : (
                    <div className="card">
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Exam</th>
                                        <th>Subject</th>
                                        <th>Score</th>
                                        <th>Percentage</th>
                                        <th>Correct</th>
                                        <th>Wrong</th>
                                        <th>Rank</th>
                                        <th>Submitted</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map(at => (
                                        <tr key={at.id}>
                                            <td style={{ fontWeight: 600 }}>{at.exam?.title}</td>
                                            <td>{at.exam?.subject}</td>
                                            <td>
                                                <span style={{ fontWeight: 700 }}>{at.total_score}</span>
                                                <span className="text-muted text-sm"> / {at.exam?.total_marks}</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${at.percentage >= 50 ? 'badge-success' : 'badge-danger'}`}>
                                                    {at.percentage?.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="text-success">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <CheckCircle size={13} /> {at.correct_count}
                                                </div>
                                            </td>
                                            <td className="text-danger">{at.wrong_count}</td>
                                            <td>
                                                {at.rank === 1
                                                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 700 }}><Trophy size={13} />1st</span>
                                                    : <span className="text-muted">#{at.rank || '—'}</span>}
                                            </td>
                                            <td className="text-muted text-sm">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} />
                                                    {at.submitted_at ? new Date(at.submitted_at).toLocaleDateString() : 'In Progress'}
                                                </div>
                                            </td>
                                            <td>
                                                <Link to={`/student/result/${at.id}`} className="btn btn-secondary btn-sm">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default History;
