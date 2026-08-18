import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteSheet } from '../DeleteSheet';

describe('DeleteSheet', () => {
  it('disables the destructive confirm button until a non-empty reason is entered', async () => {
    const user = userEvent.setup();
    render(<DeleteSheet open onClose={() => {}} onConfirm={() => {}} returnFocusRef={{ current: null }} />);

    const confirm = screen.getByRole('button', { name: 'Delete task' });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText('Why are you deleting this?'), 'No longer relevant');
    expect(confirm).toBeEnabled();
  });

  it('stays disabled for a whitespace-only reason', async () => {
    const user = userEvent.setup();
    render(<DeleteSheet open onClose={() => {}} onConfirm={() => {}} returnFocusRef={{ current: null }} />);
    await user.type(screen.getByLabelText('Why are you deleting this?'), '   ');
    expect(screen.getByRole('button', { name: 'Delete task' })).toBeDisabled();
  });

  it('calls onConfirm with the trimmed reason', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<DeleteSheet open onClose={() => {}} onConfirm={onConfirm} returnFocusRef={{ current: null }} />);
    await user.type(screen.getByLabelText('Why are you deleting this?'), '  Duplicate task  ');
    await user.click(screen.getByRole('button', { name: 'Delete task' }));
    expect(onConfirm).toHaveBeenCalledWith('Duplicate task');
  });

  it('renders nothing when closed', () => {
    render(<DeleteSheet open={false} onClose={() => {}} onConfirm={() => {}} returnFocusRef={{ current: null }} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DeleteSheet open onClose={onClose} onConfirm={() => {}} returnFocusRef={{ current: null }} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
