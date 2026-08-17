import { TaskList } from '../../components/tasks/TaskList';

export default function Active() {
  return (
    <TaskList
      status="active"
      emptyTitle="Nothing on deck."
      emptyDescription="Add a task to get moving."
      showCreateAction
    />
  );
}
