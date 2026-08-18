import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReasonField, isReasonValid } from '../ReasonField';

describe('isReasonValid', () => {
  it('rejects empty and whitespace-only reasons', () => {
    expect(isReasonValid('')).toBe(false);
    expect(isReasonValid('   ')).toBe(false);
    expect(isReasonValid('\n\t')).toBe(false);
  });

  it('accepts a non-empty trimmed reason', () => {
    expect(isReasonValid('Ran out of time')).toBe(true);
    expect(isReasonValid('  Ran out of time  ')).toBe(true);
  });
});

describe('ReasonField', () => {
  it('is labeled and calls onChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ReasonField label="Why are you deleting this?" value="" onChange={onChange} />);

    const field = screen.getByLabelText('Why are you deleting this?');
    await user.type(field, 'x');
    expect(onChange).toHaveBeenCalledWith('x');
  });

  it('shows the helper copy, never a raw error string', () => {
    render(<ReasonField label="What got in the way?" value="" onChange={() => {}} />);
    expect(
      screen.getByText("This is kept as history — it's what makes the patterns readable later."),
    ).toBeInTheDocument();
  });

  it('shows a live character count only past the 120-char threshold', () => {
    const short = 'a'.repeat(50);
    const { rerender } = render(<ReasonField label="Reason" value={short} onChange={() => {}} />);
    expect(screen.queryByText('50')).not.toBeInTheDocument();

    const long = 'a'.repeat(130);
    rerender(<ReasonField label="Reason" value={long} onChange={() => {}} />);
    expect(screen.getByText('130')).toBeInTheDocument();
  });
});
