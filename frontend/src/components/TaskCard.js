import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const OP_ICONS = {
  uppercase:  'AA',
  lowercase:  'aa',
  reverse:    '⇄',
  word_count: '#',
};

export default function TaskCard({ task, onDelete }) {
  const navigate = useNavigate();
  const icon = OP_ICONS[task.operation] || '?';
  const date = new Date(task.createdAt).toLocaleString();

  return (
    <div
      className="animate-in"
      onClick={() => navigate(`/tasks/${task._id}`)}
      style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '20px 24px',
        cursor: 'pointer', transition: 'all 0.2s',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)44';
        e.currentTarget.style.boxShadow = 'var(--glow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 6,
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)',
            flexShrink: 0,
          }}>{icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontWeight: 700, fontSize: 15, color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{task.title}</div>
            <div style={{
              fontSize: 12, color: 'var(--text-2)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>{task.operation}</div>
          </div>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div style={{
        fontSize: 13, color: 'var(--text-2)',
        background: 'var(--bg-3)', borderRadius: 4,
        padding: '8px 12px', fontFamily: 'var(--font-mono)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {task.inputText}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          {date}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-3)', cursor: 'pointer', fontSize: 13,
            padding: '2px 8px', borderRadius: 4, transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--danger)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-3)'}
        >
          delete
        </button>
      </div>
    </div>
  );
}
