import Button from './Button.jsx';

export default function EmptyState({ onCreateClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-indigo-400 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No tasks yet</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first task to get started.</p>
      <Button onClick={onCreateClick}>+ New Task</Button>
    </div>
  );
}
