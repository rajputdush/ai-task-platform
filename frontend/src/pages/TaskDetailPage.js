import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import { useTasks } from '../hooks/useTasks';

const Field = ({ label, children, mono = false }) => (
  <div>
    <div style={{
      fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
    }}>{label}</div>
    <div style={{
      background: 'var(--bg-3)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '12px 16px',
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      fontSize: 14, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}>{children}</div>
  </div>
);

export default function TaskDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { fetchTask } = useTasks();
  const [task, setTask]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    try {
      const t = await fetchTask(id);
      setTask(t);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [id, fetchTask]);

  useEffect(() => { load(); }, [load]);

  // Poll if task is still in-progress
  useEffect(() => {
    if (!task) return;
    if (task.status !== 'pending' && task.status !== 'running') return;
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [task, load]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
        <Spinner size={44} />
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '60px auto', padding: '0 24px', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
        {error}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px' }} className="animate-in">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none', border: 'none', color: 'var(--text-2)',
            cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13,
            marginBottom: 24, padding: 0, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div style={{
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '28px 32px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>{task.title}</h1>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: 'var(--text-2)', marginTop: 6, display: 'flex', gap: 16,
              }}>
                <span>op: <span style={{ color: 'var(--accent)' }}>{task.operation}</span></span>
                <span>created: {new Date(task.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <StatusBadge status={task.status} />
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Input Text" mono>{task.inputText}</Field>

          {task.result != null && (
            <div>
              <div style={{
                fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
              }}>Result</div>
              <div style={{
                background: 'var(--success)10', border: '1px solid var(--success)44',
                borderRadius: 6, padding: '12px 16px',
                fontFamily: 'var(--font-mono)', fontSize: 14,
                color: 'var(--success)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>{task.result}</div>
            </div>
          )}

          {task.errorMessage && (
            <div>
              <div style={{
                fontSize: 11, color: 'var(--danger)', fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
              }}>Error</div>
              <div style={{
                background: 'var(--danger)10', border: '1px solid var(--danger)44',
                borderRadius: 6, padding: '12px 16px',
                fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--danger)',
              }}>{task.errorMessage}</div>
            </div>
          )}

          {/* Logs */}
          <div>
            <div style={{
              fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
            }}>Execution Logs</div>
            <div style={{
              background: '#000', border: '1px solid var(--border)',
              borderRadius: 6, padding: '16px', fontFamily: 'var(--font-mono)',
              fontSize: 13, maxHeight: 320, overflowY: 'auto',
            }}>
              {task.logs && task.logs.length > 0 ? task.logs.map((log, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, marginBottom: 6, lineHeight: 1.5,
                }}>
                  <span style={{ color: 'var(--text-3)', flexShrink: 0, fontSize: 11 }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span style={{
                    color: log.level === 'error' ? 'var(--danger)'
                         : log.level === 'debug' ? 'var(--text-3)'
                         : 'var(--success)',
                    flexShrink: 0,
                  }}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span style={{ color: 'var(--text)' }}>{log.message}</span>
                </div>
              )) : (
                <span style={{ color: 'var(--text-3)' }}>No logs available</span>
              )}
            </div>
          </div>

          {/* Timing */}
          {(task.startedAt || task.completedAt) && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            }}>
              {task.startedAt && (
                <Field label="Started At">{new Date(task.startedAt).toLocaleString()}</Field>
              )}
              {task.completedAt && (
                <Field label="Completed At">{new Date(task.completedAt).toLocaleString()}</Field>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
