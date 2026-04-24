import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 54,
    }}>
      <Link to="/dashboard" style={{
        fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 17,
        color: 'var(--accent)', letterSpacing: '-0.02em', textDecoration: 'none',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          width: 26, height: 26, background: 'var(--accent)', borderRadius: 6,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: '#000', flexShrink: 0,
        }}>⚡</span>
        TaskForge
      </Link>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="nav-username" style={{
            fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)',
          }}>
            {user.username}
          </span>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-2)', padding: '5px 12px',
            borderRadius: 'var(--radius)', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 12, transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => { e.target.style.borderColor='var(--danger)'; e.target.style.color='var(--danger)'; }}
            onMouseLeave={(e) => { e.target.style.borderColor='var(--border)'; e.target.style.color='var(--text-2)'; }}
          >
            logout
          </button>
        </div>
      )}
    </nav>
  );
}