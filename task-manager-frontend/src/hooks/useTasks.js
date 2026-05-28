import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/tasks.js';

export default function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data) => {
    setSaving(true);
    try {
      const newTask = await api.createTask(data);
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (id, data) => {
    setSaving(true);
    try {
      const updated = await api.updateTask(id, data);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id) => {
    setSaving(true);
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setSaving(false);
    }
  };

  return { tasks, loading, error, saving, createTask, updateTask, deleteTask };
}
