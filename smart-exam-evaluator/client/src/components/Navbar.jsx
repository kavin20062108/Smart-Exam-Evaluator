import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen } from 'lucide-react';

const adminLinks = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/exams', label: 'Exams' },
    { to: '/admin/results', label: 'Results' },
    { to: '/admin/analytics', label: 'Analytics' },
];

const studentLinks = [
    { to: '/student', label: 'Dashboard' },
    { to: '/student/exams', label: 'Exams' },
    { to: '/student/leaderboard', label: '🏆 Leaderboard' },
    { to: '/student/history', label: 'History' },
];

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const links = user?.role === 'admin' ? adminLinks : studentLinks;

    return (
        <nav className="navbar">
            <div className="flex items-center gap-2">
                <BookOpen size={20} color="#818cf8" />
                <span className="navbar-brand">Smart Exam Evaluator</span>
            </div>
            <div className="navbar-nav">
                {links.map((l) => (
                    <NavLink
                        key={l.to}
                        to={l.to}
                        end={l.to.split('/').length === 2}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    >
                        {l.label}
                    </NavLink>
                ))}
                <span className="text-sm text-muted" style={{ marginLeft: '0.5rem' }}>
                    {user?.name}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                    <LogOut size={14} /> Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
