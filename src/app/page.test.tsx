import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import Home from './page';

describe('Home page', () => {
  it('renders without crashing', () => {
    render(<Home />);
  });

  it('renders the main element', () => {
    render(<Home />);
    const main = screen.getByRole('main');
    expect(main).toBeDefined();
  });

  it('has dark background class', () => {
    render(<Home />);
    const main = screen.getByRole('main');
    expect(main.className).toContain('bg-bg-base');
  });
});
