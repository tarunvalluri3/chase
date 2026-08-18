import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { TaskCard } from '../TaskCard';
import { renderWithProviders, buildTask } from '../../../test/testUtils';

describe('TaskCard', () => {
  it('renders as an <article> with an accessible name combining title, priority, deadline, and status', () => {
    const task = buildTask({ title: 'Ship the report', priority: 'HIGH', status: 'ACTIVE' });
    renderWithProviders(<TaskCard task={task} sectionStatus="active" />);
    const article = screen.getByRole('article');
    expect(article.getAttribute('aria-label')).toContain('Ship the report');
    expect(article.getAttribute('aria-label')).toContain('high priority');
    expect(article.getAttribute('aria-label')).toContain('active');
  });

  it('shows the status chip and priority label', () => {
    renderWithProviders(<TaskCard task={buildTask({ status: 'MISSED' })} sectionStatus="missed" />);
    expect(screen.getByText('Needs review')).toBeInTheDocument();
  });

  it('links to the task detail route for its section', () => {
    const task = buildTask({ id: 'abc-123' });
    renderWithProviders(<TaskCard task={task} sectionStatus="active" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/tasks/active/abc-123');
  });
});
