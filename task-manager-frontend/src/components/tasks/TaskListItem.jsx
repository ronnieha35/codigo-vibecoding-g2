import { Link } from 'react-router-dom';
import Badge from '../ui/Badge.jsx';

function formatRelativeDate(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

const borderAccent = {
  completed:     'border-l-green-400',
  'in-progress': 'border-l-blue-400',
  pending:       'border-l-gray-300 dark:border-l-gray-600',
};

export default function TaskListItem({ task, onEdit, onDelete }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 ${borderAccent[task.status] ?? 'border-l-gray-300'} rounded-xl px-4 py-3 flex items-center gap-4 hover:shadow-sm transition-shadow`}
    >
      <Link to={`/tasks/${task.id}`} className="group flex-1 min-w-0">
        <p
          className={`font-medium truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
            task.status === 'completed'
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{task.description}</p>
        )}
      </Link>

      <div className="flex items-center gap-3 shrink-0">
        <Badge status={task.status} />
        <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block w-16 text-right">
          {formatRelativeDate(task.created_at)}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            aria-label="Edit task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            aria-label="Delete task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
