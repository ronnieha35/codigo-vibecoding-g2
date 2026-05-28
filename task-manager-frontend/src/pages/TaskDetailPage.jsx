import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useTask from '../hooks/useTask.js';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import TaskForm from '../components/tasks/TaskForm.jsx';
import DeleteConfirm from '../components/tasks/DeleteConfirm.jsx';

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const { task, loading, error, saving, updateTask, deleteTask } = useTask(id);

  const [dialogMode, setDialogMode] = useState(null);
  const closeDialog = () => setDialogMode(null);

  const handleUpdate = async (data) => {
    try {
      await updateTask(data);
      closeDialog();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Task not found.'}</p>
        <Link to="/"><Button variant="secondary">← Back to tasks</Button></Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link to="/" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
          ← Back to tasks
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <Badge status={task.status} />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDialogMode('edit')}>Edit</Button>
            <Button variant="danger" size="sm" onClick={() => setDialogMode('delete')}>Delete</Button>
          </div>
        </div>

        <h1
          className={`text-2xl font-bold mb-4 ${
            task.status === 'completed'
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {task.title}
        </h1>

        {task.description ? (
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6 whitespace-pre-wrap">
            {task.description}
          </p>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 italic mb-6">No description.</p>
        )}

        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 text-sm text-gray-400 dark:text-gray-500">
          Created {formatDate(task.created_at)}
        </div>
      </div>

      <Dialog isOpen={dialogMode === 'edit'} onClose={closeDialog} title="Edit Task">
        <TaskForm initialValues={task} onSubmit={handleUpdate} onCancel={closeDialog} isLoading={saving} />
      </Dialog>

      <Dialog isOpen={dialogMode === 'delete'} onClose={closeDialog} title="Delete Task">
        <DeleteConfirm task={task} onConfirm={handleDelete} onCancel={closeDialog} isLoading={saving} />
      </Dialog>
    </>
  );
}
