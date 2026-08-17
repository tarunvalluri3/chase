import { TaskList } from '../../components/tasks/TaskList';

export default function Deleted() {
  return (
    <TaskList
      status="deleted"
      emptyTitle="Nothing deleted."
      emptyDescription="Deleted tasks are kept here with the reason you gave."
    />
  );
}
