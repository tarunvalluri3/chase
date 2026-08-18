import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResolveSheet } from '../ResolveSheet';

describe('ResolveSheet', () => {
  it('renders both outcomes unselected — neither is pre-chosen', () => {
    render(<ResolveSheet open onClose={() => {}} onResolve={() => {}} returnFocusRef={{ current: null }} />);
    expect(screen.getByRole('radio', { name: 'I completed this' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: "I didn't complete this" })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('COMPLETED needs no reason — Confirm enables immediately on selection', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    render(<ResolveSheet open onClose={() => {}} onResolve={onResolve} returnFocusRef={{ current: null }} />);

    await user.click(screen.getByRole('radio', { name: 'I completed this' }));
    expect(screen.queryByLabelText('What got in the way?')).not.toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    expect(onResolve).toHaveBeenCalledWith({ resolution: 'COMPLETED' });
  });

  it('INCOMPLETE reveals a required reason field and stays disabled until it is filled', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    render(<ResolveSheet open onClose={() => {}} onResolve={onResolve} returnFocusRef={{ current: null }} />);

    await user.click(screen.getByRole('radio', { name: "I didn't complete this" }));
    const reasonField = screen.getByLabelText('What got in the way?');
    expect(reasonField).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();

    await user.type(reasonField, 'Underestimated the scope');
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    expect(onResolve).toHaveBeenCalledWith({ resolution: 'INCOMPLETE', reason: 'Underestimated the scope' });
  });

  it('shows the verbatim DESIGN.md §3.3 prompt copy', () => {
    render(<ResolveSheet open onClose={() => {}} onResolve={() => {}} returnFocusRef={{ current: null }} />);
    expect(
      screen.getByText('The deadline passed before this was confirmed. What actually happened?'),
    ).toBeInTheDocument();
  });
});
