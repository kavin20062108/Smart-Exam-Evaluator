import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { Trophy, Search } from 'lucide-react';

const Results = () => {
    const [results, setResults] = useState([]);
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/exams').then(r => setExams(r.data)).catch(() => { });
    }, []);

    useEffect(() => {
        setLoading(true);
        const url = selectedExam ? `/attempts/admin/results?exam_id=${selectedExam}` : '/attempts/admin/results';
        api.get(url)
            .then(r => setResults(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [selectedExam]);

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Student Results</h1>
                        <p className="text-muted text-sm mt-1">{results.length} attempt{results.length !== 1 ? 's' : ''} found</p>
                    </div>
                    {/* Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Search size={15} color="var(--text-muted)" />
                        <select
                            className="form-control"
                            style={{ minWidth: '200px' }}
                            value={selectedExam}
                            onChange={e => setSelectedExam(e.target.value)}
                        >
                            <option value="">All Exams</option>
                            {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                        </select>
                    </div>
                </div>

                <div className="card">
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Student</th>
                                    <th>Exam</th>
                                    <th>Score</th>
                                    <th>Percentage</th>
                                    <th>Correct</th>
                                    <th>Wrong</th>
                                    <th>Neg. Marks</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} className="text-center text-muted" style={{ padding: '2rem' }}>Loading…</td></tr>
                                ) : results.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center text-muted" style={{ padding: '2rem' }}>No results yet.</td></tr>
                                ) : results.map((r) => (
                                    <tr key={r.id}>
                                        <td>
                                            {r.rank === 1 ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 700 }}>
                                                    <Trophy size={14} /> 1st
                                                </span>
                                            ) : r.rank === 2 ? (
                                                <span style={{ color: '#94a3b8', fontWeight: 700 }}>2nd</span>
                                            ) : r.rank === 3 ? (
                                                <span style={{ color: '#cd7c2f', fontWeight: 700 }}>3rd</span>
                                            ) : (
                                                <span className="text-muted">{r.rank ? `${r.rank}th` : '—'}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{r.student?.name}</div>
                                            <div className="text-muted text-sm">{r.student?.email}</div>
                                        </td>
                                        <td>{r.exam?.title}</td>
                                        <td>
                                            <span style={{ fontWeight: 700 }}>{r.total_score}</span>
                                            <span className="text-muted text-sm"> / {r.exam?.total_marks}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${r.percentage >= 50 ? 'badge-success' : 'badge-danger'}`}>
                                                {r.percentage?.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="text-success">{r.correct_count}</td>
                                        <td className="text-danger">{r.wrong_count}</td>
                                        <td className="text-muted">-{r.negative_marks}</td>
                                        <td className="text-muted text-sm">
                                            {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : 'In Progress'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Results;
