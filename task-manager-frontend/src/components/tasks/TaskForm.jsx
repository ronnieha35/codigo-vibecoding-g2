import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Spinner from '../ui/Spinner.jsx';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

export default function TaskForm({ initialValues, onSubmit, onCancel, isLoading }) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [status, setStatus] = useState(initialValues?.status ?? 'pending');

  const isEdit = Boolean(initialValues);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { title: title.trim(), description: description.trim() };
    if (isEdit) data.status = status;
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {isEdit && (
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !title.trim()}>
          {isLoading ? <Spinner size="sm" /> : null}
          {isEdit ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}
