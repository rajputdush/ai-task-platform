import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputStyle = {
  width: '100%', background: 'var(--bg-3)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  padding: '12px 16px', color: 'var(--text)',
  fontFamily: 'var(--font-sans)', fontSize: 15,
  outline: 'none', transition: 'border-color 0.2s',
};

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
      padding: 16,
    }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px),
                          linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
        backgroundSize: '48px 48px', opacity: 0.3,
      }} />

      <div className="animate-in" style={{
        position: 'relative', zIndex: 1,
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '48px 40px', width: '100%', maxWidth: 420,
        boxShadow: '0 32px 100px rgba(0,0,0,0.6)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--accent)',
            borderRadius: 12, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, boxShadow: 'var(--glow)',
          }}>⚡</div>
          <h1 style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em' }}>TaskForge</h1>
          <p style={{ color: 'var(--text-2)', marginTop: 6, fontSize: 14 }}>Sign in to your account</p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>EMAIL</label>
            <input
              type="email" value={form.email} onChange={set('email')}
              placeholder="you@example.com" required style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>PASSWORD</label>
            <input
              type="password" value={form.password} onChange={set('password')}
              placeholder="••••••••" required style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 6,
              background: 'var(--danger)18', border: '1px solid var(--danger)44',
              color: 'var(--danger)', fontSize: 13,
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            marginTop: 8, padding: '13px', borderRadius: 'var(--radius)',
            background: loading ? 'var(--bg-3)' : 'var(--accent)',
            border: 'none', color: '#000', fontWeight: 800, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
            boxShadow: loading ? 'none' : 'var(--glow)',
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-2)', fontSize: 14 }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700 }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
