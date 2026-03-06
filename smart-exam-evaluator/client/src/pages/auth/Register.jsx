import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, Mail, Lock, User, ShieldCheck } from 'lucide-react';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            const user = await register(form.name, form.email, form.password, form.role);
            toast.success('Account created successfully!');
            navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.errors?.[0] || 'Registration failed');
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
                <p className="auth-subtitle">Create your account</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label htmlFor="reg-name">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="reg-name"
                                name="name"
                                type="text"
                                className="form-control"
                                style={{ paddingLeft: '2.25rem' }}
                                placeholder="John Doe"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="reg-email"
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
                        <label htmlFor="reg-password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="reg-password"
                                name="password"
                                type="password"
                                className="form-control"
                                style={{ paddingLeft: '2.25rem' }}
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-role">I am a...</label>
                        <div style={{ position: 'relative' }}>
                            <ShieldCheck size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                id="reg-role"
                                name="role"
                                className="form-control"
                                style={{ paddingLeft: '2.25rem' }}
                                value={form.role}
                                onChange={handleChange}
                            >
                                <option value="student">Student</option>
                                <option value="admin">Admin / Teacher</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block mt-1" disabled={loading}>
                        {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-sm text-muted mt-3">
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
