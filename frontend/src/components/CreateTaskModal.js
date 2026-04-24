import React, { useState } from 'react';

const OPERATIONS = [
  { value: 'uppercase',  label: 'Uppercase',    desc: 'Convert text to UPPERCASE' },
  { value: 'lowercase',  label: 'Lowercase',    desc: 'Convert text to lowercase' },
  { value: 'reverse',    label: 'Reverse',      desc: 'Reverse the string' },
  { value: 'word_count', label: 'Word Count',   desc: 'Count words in text' },
];

const inputStyle = {
  width: '100%', background: 'var(--bg-3)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  padding: '10px 14px', color: 'var(--text)',
  fontFamily: 'var(--font-sans)', fontSize: 14,
  outline: 'none', transition: 'border-color 0.2s',
};

export default function CreateTaskModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', inputText: '', operation: 'uppercase' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim() || !form.inputText.trim()) {
      setError('Title and input text are required'); return;
    }
    setLoading(true); setError('');
    try {
      await onCreate(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="animate-in" style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 32, width: '100%', maxWidth: 520,
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>
            New Task
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-2)',
            fontSize: 22, cursor: 'pointer', lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>
              TASK TITLE
            </label>
            <input
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Process user feedback"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>
              OPERATION
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {OPERATIONS.map((op) => (
                <div
                  key={op.value}
                  onClick={() => setForm((f) => ({ ...f, operation: op.value }))}
                  style={{
                    padding: '10px 14px', borderRadius: 6, cursor: 'pointer',
                    border: `1px solid ${form.operation === op.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.operation === op.value ? 'var(--accent)10' : 'var(--bg-3)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: form.operation === op.value ? 'var(--accent)' : 'var(--text)' }}>
                    {op.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{op.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>
              INPUT TEXT
            </label>
            <textarea
              value={form.inputText}
              onChange={set('inputText')}
              placeholder="Enter the text to process..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
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

          <button
            onClick={submit}
            disabled={loading}
            style={{
              padding: '12px', borderRadius: 'var(--radius)',
              background: loading ? 'var(--bg-3)' : 'var(--accent)',
              border: 'none', color: loading ? 'var(--text-2)' : '#000',
              fontWeight: 800, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)', letterSpacing: '0.02em',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Creating...' : '⚡ Run Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
