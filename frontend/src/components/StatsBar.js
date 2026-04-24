import React from 'react';

const STAT_CONFIG = [
  { key: 'total',   label: 'Total',   color: 'var(--text-2)' },
  { key: 'pending', label: 'Pending', color: 'var(--warning)' },
  { key: 'running', label: 'Running', color: 'var(--accent)'  },
  { key: 'success', label: 'Success', color: 'var(--success)' },
  { key: 'failed',  label: 'Failed',  color: 'var(--danger)'  },
];

export default function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div className="stats-grid" style={{ marginBottom: 18 }}>
      {STAT_CONFIG.map(({ key, label, color }) => (
        <div key={key} style={{
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '12px 14px',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 'clamp(20px, 4vw, 28px)',
            fontWeight: 700, color,
          }}>
            {stats[key] ?? 0}
          </div>
          <div style={{
            fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3,
          }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}