import Button from '../ui/Button.jsx';
import Spinner from '../ui/Spinner.jsx';

export default function DeleteConfirm({ task, onConfirm, onCancel, isLoading }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        Are you sure you want to delete{' '}
        <span className="font-semibold text-gray-900 dark:text-gray-100">"{task?.title}"</span>?{' '}
        This action cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? <Spinner size="sm" /> : null}
          Delete
        </Button>
      </div>
    </div>
  );
}
