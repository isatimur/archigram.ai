import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../utils/test-utils.tsx';
import KeyboardShortcutsModal from '../../components/KeyboardShortcutsModal.tsx';

describe('KeyboardShortcutsModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders shortcut groups when open', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('EDITOR')).toBeInTheDocument();
    expect(screen.getByText('EXPORT')).toBeInTheDocument();
    expect(screen.getByText('VIEW')).toBeInTheDocument();
    expect(screen.getByText('AI CHAT')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);
    // The backdrop is the outer fixed div — click it directly
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close shortcuts'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows expected shortcut entries', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('New diagram')).toBeInTheDocument();
    expect(screen.getByText('Copy share link')).toBeInTheDocument();
    expect(screen.getByText('Command palette')).toBeInTheDocument();
    expect(screen.getByText('Submit prompt')).toBeInTheDocument();
  });
});
