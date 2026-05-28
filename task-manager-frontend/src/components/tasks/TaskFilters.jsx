const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function TaskFilters({ activeFilter, onChange }) {
  return (
    <div role="tablist" className="flex gap-2 flex-wrap">
      {FILTERS.map(({ value, label }) => (
        <button
          key={value}
          role="tab"
          aria-selected={activeFilter === value}
          onClick={() => onChange(value)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeFilter === value
              ? 'bg-indigo-600 text-white dark:bg-indigo-500'
              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
