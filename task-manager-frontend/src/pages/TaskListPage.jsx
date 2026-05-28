import { useState } from 'react';
import useTasks from '../hooks/useTasks.js';
import TaskList from '../components/tasks/TaskList.jsx';
import TaskFilters from '../components/tasks/TaskFilters.jsx';
import TaskForm from '../components/tasks/TaskForm.jsx';
import DeleteConfirm from '../components/tasks/DeleteConfirm.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';

function GridIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

export default function TaskListPage() {
  const { tasks, loading, error, saving, createTask, updateTask, deleteTask } = useTasks();

  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('card'); // 'card' | 'list'
  const [dialogMode, setDialogMode] = useState(null); // 'create' | 'edit' | 'delete'
  const [selectedTask, setSelectedTask] = useState(null);

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedTask(null);
  };

  const openEdit = (task) => { setSelectedTask(task); setDialogMode('edit'); };
  const openDelete = (task) => { setSelectedTask(task); setDialogMode('delete'); };

  const handleCreate = async (data) => {
    try {
      await createTask(data);
      closeDialog();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateTask(selectedTask.id, data);
      closeDialog();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(selectedTask.id);
      closeDialog();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Tasks</h1>
        <Button onClick={() => setDialogMode('create')}>+ New Task</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <TaskFilters activeFilter={filter} onChange={setFilter} />

        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setView('card')}
            aria-label="Card view"
            className={`p-1.5 rounded-md transition-colors ${
              view === 'card'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <GridIcon />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            aria-label="List view"
            className={`p-1.5 rounded-md transition-colors ${
              view === 'list'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <ListIcon />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <TaskList
          tasks={filteredTasks}
          view={view}
          onEdit={openEdit}
          onDelete={openDelete}
          onCreateClick={() => setDialogMode('create')}
        />
      )}

      <Dialog isOpen={dialogMode === 'create'} onClose={closeDialog} title="New Task">
        <TaskForm onSubmit={handleCreate} onCancel={closeDialog} isLoading={saving} />
      </Dialog>

      <Dialog isOpen={dialogMode === 'edit'} onClose={closeDialog} title="Edit Task">
        <TaskForm
          initialValues={selectedTask}
          onSubmit={handleUpdate}
          onCancel={closeDialog}
          isLoading={saving}
        />
      </Dialog>

      <Dialog isOpen={dialogMode === 'delete'} onClose={closeDialog} title="Delete Task">
        <DeleteConfirm
          task={selectedTask}
          onConfirm={handleDelete}
          onCancel={closeDialog}
          isLoading={saving}
        />
      </Dialog>
    </>
  );
}
