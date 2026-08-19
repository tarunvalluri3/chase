import { Sheet } from '../ui/Sheet';
import { TaskForm } from './TaskForm';
import { useTasksContext } from '../../lib/tasksStore';

// The single create-task Sheet, triggerable from anywhere (BottomNav's FAB,
// Sidebar's "New task" button, Home's empty-state button) via
// TasksProvider's shared createSheetOpen state. Rendered once at the
// AppLayout level — not nested inside BottomNav — so it isn't hidden by
// BottomNav's own `min-[960px]:hidden` wrapper at the desktop breakpoint
// (a real bug: the create sheet used to live inside BottomNav, so it was
// unreachable at >=960px even though the FAB was the only entry point once
// a desktop user had any tasks).
export function CreateTaskSheet() {
  const { createSheetOpen, closeCreateSheet, refreshTasks } = useTasksContext();

  return (
    <Sheet open={createSheetOpen} onClose={closeCreateSheet} title="New task">
      <TaskForm
        mode="create"
        onCancel={closeCreateSheet}
        onSuccess={() => {
          closeCreateSheet();
          refreshTasks();
        }}
      />
    </Sheet>
  );
}
