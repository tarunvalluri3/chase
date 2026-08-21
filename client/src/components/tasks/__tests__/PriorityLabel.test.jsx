import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityLabel } from '../PriorityLabel';
import { priorityText } from '../priorityConfig';

describe('PriorityLabel', () => {
  it('renders the human label text so priority is never color-only', () => {
    render(<PriorityLabel priority="LOW" />);
    expect(screen.getByText('Low priority')).toBeInTheDocument();
  });
});

describe('priorityText', () => {
  it('maps every priority to its label', () => {
    expect(priorityText('HIGH')).toBe('High');
    expect(priorityText('MEDIUM')).toBe('Medium');
    expect(priorityText('LOW')).toBe('Low');
  });
});
