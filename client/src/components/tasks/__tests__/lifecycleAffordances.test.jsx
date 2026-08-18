import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { TaskCard } from '../TaskCard';
import { TaskDetail } from '../TaskDetail';
import { renderWithProviders, buildTask } from '../../../test/testUtils';

// DESIGN.md §7.3 — Complete/Edit/Delete render only on ACTIVE, Resolve only
// on MISSED, and nothing renders on COMPLETED/INCOMPLETE/DELETED. Asserted
// directly, per the phase prompt, on both surfaces that render these
// actions (TaskCard and TaskDetail).
describe('TaskCard lifecycle affordances (DESIGN.md §7.3)', () => {
  it('ACTIVE: shows Complete and Delete, not Resolve', () => {
    renderWithProviders(<TaskCard task={buildTask({ status: 'ACTIVE' })} sectionStatus="active" />);
    expect(screen.getByRole('button', { name: 'Complete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolve' })).not.toBeInTheDocument();
  });

  it('MISSED: shows only Resolve', () => {
    renderWithProviders(<TaskCard task={buildTask({ status: 'MISSED' })} sectionStatus="missed" />);
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it.each(['COMPLETED', 'INCOMPLETE', 'DELETED'])('%s: shows no lifecycle actions at all', (status) => {
    renderWithProviders(<TaskCard task={buildTask({ status })} sectionStatus={status.toLowerCase()} />);
    expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolve' })).not.toBeInTheDocument();
  });
});

describe('TaskDetail lifecycle affordances (DESIGN.md §7.3)', () => {
  it('ACTIVE: shows Complete, Edit, and Delete', () => {
    renderWithProviders(<TaskDetail task={buildTask({ status: 'ACTIVE' })} />);
    expect(screen.getByRole('button', { name: 'Complete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolve' })).not.toBeInTheDocument();
  });

  it('MISSED: shows only Resolve', () => {
    renderWithProviders(<TaskDetail task={buildTask({ status: 'MISSED', missed_reason: 'Deadline passed' })} />);
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it.each(['COMPLETED', 'INCOMPLETE', 'DELETED'])('%s: shows no lifecycle actions at all', (status) => {
    renderWithProviders(<TaskDetail task={buildTask({ status })} />);
    expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolve' })).not.toBeInTheDocument();
  });

  it('an INCOMPLETE task that passed through MISSED shows both reasons, distinct and both preserved', () => {
    renderWithProviders(
      <TaskDetail
        task={buildTask({
          status: 'INCOMPLETE',
          missed_reason: 'Deadline passed while task was still ACTIVE',
          incomplete_reason: 'Blocked on a dependency',
        })}
      />,
    );
    expect(screen.getByText('Deadline passed while task was still ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Blocked on a dependency')).toBeInTheDocument();
  });
});
