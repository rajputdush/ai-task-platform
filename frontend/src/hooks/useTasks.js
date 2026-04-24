import { useState, useCallback } from 'react';
import api from '../utils/api';

export const useTasks = () => {
  const [tasks, setTasks]     = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/tasks', { params });
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks/stats/summary');
      setStats(data.stats);
    } catch {}
  }, []);

  const createTask = useCallback(async (payload) => {
    const { data } = await api.post('/tasks', payload);
    setTasks((prev) => [data.task, ...prev]);
    return data.task;
  }, []);

  const fetchTask = useCallback(async (id) => {
    const { data } = await api.get(`/tasks/${id}`);
    return data.task;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  }, []);

  const refreshTask = useCallback(async (id) => {
    const updated = await fetchTask(id);
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    return updated;
  }, [fetchTask]);

  return {
    tasks, stats, loading, error, pagination,
    fetchTasks, fetchStats, createTask, fetchTask,
    deleteTask, refreshTask,
  };
};
