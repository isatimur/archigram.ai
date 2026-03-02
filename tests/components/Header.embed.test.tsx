import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils.tsx';
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
  onPublish: vi.fn(),
  onNavigate: vi.fn(),
  onSaveVersion: vi.fn(),
  onAudit: vi.fn(),
  activeProject: { id: '1', name: 'My API Flow', code: 'graph TD; A-->B', updatedAt: 0 },
};

const originalLocation = window.location;

describe('Header embed code generation', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { search: '', hash: '#abc123', href: 'http://localhost/#abc123' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('generated embed code contains mode=toolbar by default', async () => {
    render(<Header {...defaultProps} />);

    const shareBtn = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareBtn);

    const embedOption = screen.getByText(/embed/i);
    fireEvent.click(embedOption);

    await waitFor(() => {
      const textarea = screen.getByRole('textbox');
      expect((textarea as HTMLTextAreaElement).value).toContain('mode=toolbar');
      expect((textarea as HTMLTextAreaElement).value).toContain('<iframe');
    });
  });

  it('Twitter share URL includes the diagram name as title param', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<Header {...defaultProps} />);

    const shareBtn = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareBtn);

    const twitterBtn = screen.getByText(/twitter/i);
    fireEvent.click(twitterBtn);

    expect(openSpy).toHaveBeenCalledOnce();
    const calledUrl = openSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('twitter.com/intent/tweet');
    expect(calledUrl).toContain(encodeURIComponent('@ArchiGram_ai'));
    expect(calledUrl).toContain(encodeURIComponent('My API Flow'));

    openSpy.mockRestore();
  });
});
