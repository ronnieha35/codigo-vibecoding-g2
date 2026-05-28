const styles = {
  pending:       'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  completed:     'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

const labels = {
  pending:       'Pending',
  'in-progress': 'In Progress',
  completed:     'Completed',
};

export default function Badge({ status }) {
  const color = styles[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  const label = labels[status] ?? status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
