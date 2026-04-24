import React from 'react';

const CONFIG = {
  pending: { color: 'var(--warning)',  label: 'PENDING',  dot: true  },
  running: { color: 'var(--accent)',   label: 'RUNNING',  dot: true  },
  success: { color: 'var(--success)',  label: 'SUCCESS',  dot: false },
  failed:  { color: 'var(--danger)',   label: 'FAILED',   dot: false },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || { color: 'var(--text-2)', label: status.toUpperCase(), dot: false };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 3,
      background: `${cfg.color}18`,
      border: `1px solid ${cfg.color}44`,
      color: cfg.color,
      fontFamily: 'var(--font-mono)',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    }}>
      {cfg.dot && (
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: cfg.color,
          animation: 'pulse 1.4s ease-in-out infinite',
          flexShrink: 0,
        }} />
      )}
      {cfg.label}
    </span>
  );
}
