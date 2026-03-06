import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, Mail, Lock, Loader2 } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            toast.success(`Welcome back, ${user.name}!`);
            navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="card auth-card">
                <div className="flex items-center gap-1 mb-1" style={{ marginBottom: '0.25rem' }}>
                    <BookOpen size={24} color="#818cf8" />
                    <div className="auth-logo">SmartExam</div>
                </div>
                <p className="auth-subtitle">Sign in to your account</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label htmlFor="login-email">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="login-email"
                                name="email"
                                type="email"
                                className="form-control"
                                style={{ paddingLeft: '2.25rem' }}
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="login-password"
                                name="password"
                                type="password"
                                className="form-control"
                                style={{ paddingLeft: '2.25rem' }}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block mt-1" disabled={loading}>
                        {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-sm text-muted mt-3">
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
