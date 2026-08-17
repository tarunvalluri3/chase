import { TaskList } from '../../components/tasks/TaskList';

// Section is "Incomplete" for navigability; the chip/copy reads "Not done"
// per DESIGN.md §2.4.
export default function Incomplete() {
  return (
    <TaskList
      status="incomplete"
      emptyTitle="Nothing here."
      emptyDescription="Tasks you've confirmed weren't done will show up here, with your notes."
    />
  );
}
