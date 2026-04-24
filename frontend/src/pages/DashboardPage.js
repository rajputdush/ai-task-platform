import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import StatsBar from '../components/StatsBar';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import Spinner from '../components/Spinner';
import { useTasks } from '../hooks/useTasks';

const FILTERS = ['all', 'pending', 'running', 'success', 'failed'];

export default function DashboardPage() {
  const { tasks, stats, loading, error, fetchTasks, fetchStats, createTask, deleteTask } = useTasks();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter]       = useState('all');

  const load = useCallback(() => {
    fetchTasks(filter !== 'all' ? { status: filter } : {});
    fetchStats();
  }, [filter, fetchTasks, fetchStats]);

  useEffect(() => { load(); }, [load]);

  // Poll for running/pending tasks every 4s
  useEffect(() => {
    const hasPending = tasks.some((t) => t.status === 'pending' || t.status === 'running');
    if (!hasPending) return;
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [tasks, load]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 28, flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em' }}>Task Dashboard</h1>
            <p style={{ color: 'var(--text-2)', marginTop: 4, fontSize: 14 }}>
              Manage and monitor your AI processing tasks
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '11px 24px', borderRadius: 'var(--radius)',
              background: 'var(--accent)', border: 'none',
              color: '#000', fontWeight: 800, fontSize: 14,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              boxShadow: 'var(--glow)', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            ⚡ New Task
          </button>
        </div>

        {/* Stats */}
        <div style={{ marginBottom: 28 }}>
          <StatsBar stats={stats} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px', borderRadius: 20,
                border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
                background: filter === f ? 'var(--accent)18' : 'transparent',
                color: filter === f ? 'var(--accent)' : 'var(--text-2)',
                fontFamily: 'var(--font-mono)', fontSize: 12,
                cursor: 'pointer', transition: 'all 0.2s',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}
            >
              {f}
            </button>
          ))}
          <button
            onClick={load}
            style={{
              marginLeft: 'auto', padding: '6px 16px', borderRadius: 20,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 12,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            ↻ refresh
          </button>
        </div>

        {/* Task list */}
        {loading && tasks.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <Spinner size={40} />
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'var(--danger)', fontFamily: 'var(--font-mono)',
          }}>{error}</div>
        ) : tasks.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            border: '1px dashed var(--border)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No tasks yet</div>
            <div style={{ color: 'var(--text-2)', fontSize: 14 }}>
              Click "New Task" to get started
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid', gap: 12,
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          }}>
            {tasks.map((t) => (
              <TaskCard key={t._id} task={t} onDelete={deleteTask} />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <CreateTaskModal onClose={() => setShowModal(false)} onCreate={createTask} />
      )}
    </div>
  );
}
