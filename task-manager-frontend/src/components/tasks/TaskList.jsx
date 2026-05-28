import TaskCard from './TaskCard.jsx';
import TaskListItem from './TaskListItem.jsx';
import EmptyState from '../ui/EmptyState.jsx';

export default function TaskList({ tasks, view, onEdit, onDelete, onCreateClick }) {
  if (tasks.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />;
  }

  if (view === 'list') {
    return (
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskListItem key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
