import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/tasks.js';

export default function useTask(id) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api
      .getTask(id)
      .then(setTask)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const updateTask = async (data) => {
    setSaving(true);
    try {
      const updated = await api.updateTask(id, data);
      setTask(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async () => {
    setSaving(true);
    try {
      await api.deleteTask(id);
      navigate('/');
    } finally {
      setSaving(false);
    }
  };

  return { task, loading, error, saving, updateTask, deleteTask };
}
