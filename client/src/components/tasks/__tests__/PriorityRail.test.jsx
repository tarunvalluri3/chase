import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityRail } from '../PriorityRail';
import { PriorityLabel } from '../PriorityLabel';
import { PRIORITY_CONFIG, priorityText } from '../priorityConfig';

describe('PriorityRail', () => {
  it('is decorative (aria-hidden) since PriorityLabel always carries the text', () => {
    const { container } = render(<PriorityRail priority="HIGH" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('falls back to MEDIUM styling for an unrecognized priority rather than crashing', () => {
    const { container } = render(<PriorityRail priority="URGENT" />);
    expect(container.firstChild).toHaveStyle({ backgroundColor: PRIORITY_CONFIG.MEDIUM.rail });
  });

  it('every priority rail color is a CSS custom property, never a literal hex', () => {
    for (const priority of ['HIGH', 'MEDIUM', 'LOW']) {
      const { container, unmount } = render(<PriorityRail priority={priority} />);
      expect(container.firstChild.style.backgroundColor).toMatch(/^var\(--/);
      unmount();
    }
  });
});

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
