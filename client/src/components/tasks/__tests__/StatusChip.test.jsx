import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusChip, statusLabel } from '../StatusChip';

describe('StatusChip', () => {
  it('renders the plain status word for ACTIVE/COMPLETED/DELETED', () => {
    render(<StatusChip status="ACTIVE" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders "Needs review" for MISSED, not the raw status word', () => {
    render(<StatusChip status="MISSED" />);
    expect(screen.getByText('Needs review')).toBeInTheDocument();
    expect(screen.queryByText('Missed')).not.toBeInTheDocument();
  });

  it('renders "Not done" for INCOMPLETE, not the raw status word', () => {
    render(<StatusChip status="INCOMPLETE" />);
    expect(screen.getByText('Not done')).toBeInTheDocument();
    expect(screen.queryByText('Incomplete')).not.toBeInTheDocument();
  });

  it('renders nothing for an unknown status rather than throwing', () => {
    const { container } = render(<StatusChip status="BOGUS" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('statusLabel() mirrors the chip copy exactly, so callers cannot drift', () => {
    expect(statusLabel('MISSED')).toBe('Needs review');
    expect(statusLabel('INCOMPLETE')).toBe('Not done');
    expect(statusLabel('DELETED')).toBe('Deleted');
  });
});
