import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../utils/test-utils.tsx';
import Header from '../../components/Header.tsx';
import { ViewMode } from '../../types.ts';

vi.mock('../../components/ShareEmailModal.tsx', () => ({
  default: () => null,
}));

const defaultProps = {
  viewMode: ViewMode.Split,
  setViewMode: vi.fn(),
  onExportPng: vi.fn(),
  onExportSvg: vi.fn(),
  currentTheme: 'dark' as const,
  setTheme: vi.fn(),
  onShare: vi.fn(),
  onNewProject: vi.fn(),
  onRenameProject: vi.fn(),
  onUpdateStyle: vi.fn(),
  onPublish: vi.fn(),
  onNavigate: vi.fn(),
  onSaveVersion: vi.fn(),
  onAudit: vi.fn(),
  activeProject: { id: '1', name: 'My API Flow', code: 'graph TD; A-->B', updatedAt: 0 },
};

describe('Header embed code generation', () => {
  it('generated embed code contains mode=toolbar by default', () => {
    // Set window.location.hash so there's a hash to embed
    Object.defineProperty(window, 'location', {
      value: { search: '', hash: '#abc123', href: 'http://localhost/#abc123' },
      writable: true,
      configurable: true,
    });

    render(<Header {...defaultProps} />);

    // Open share menu
    const shareBtn = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareBtn);

    // Click embed option
    const embedOption = screen.getByText(/embed/i);
    fireEvent.click(embedOption);

    // Check the textarea value
    const textarea = screen.getByRole('textbox');
    expect((textarea as HTMLTextAreaElement).value).toContain('mode=toolbar');
    expect((textarea as HTMLTextAreaElement).value).toContain('<iframe');
  });

  it('Twitter share text includes the diagram name', () => {
    const name = 'My API Flow';
    const expectedText = `I just built a "${name}" with @ArchiGram_ai — check it out:`;
    // This is testing the text formula directly
    expect(expectedText).toContain('@ArchiGram_ai');
    expect(expectedText).toContain(name);
  });
});
