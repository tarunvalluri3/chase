import { TaskList } from '../../components/tasks/TaskList';

// Section is "Missed" for navigability; the chip/copy reads "Needs review"
// per DESIGN.md §2.4.
export default function Missed() {
  return (
    <TaskList
      status="missed"
      emptyTitle="Nothing to review."
      emptyDescription="Tasks land here when a deadline passes before you've confirmed them."
    />
  );
}
