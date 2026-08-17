import { TaskList } from '../../components/tasks/TaskList';

export default function Completed() {
  return <TaskList status="completed" emptyTitle="No completed tasks yet." emptyDescription="They'll collect here as you go." />;
}
