import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Add any providers your app needs here
interface WrapperProps {
  children: ReactNode;
}

function AllTheProviders({ children }: WrapperProps) {
  return <>{children}</>;
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Setup user event for better interaction testing
const setupUserEvent = () => userEvent.setup();

// Re-export everything from testing library
export * from '@testing-library/react';

// Override render method
export { customRender as render, setupUserEvent };
