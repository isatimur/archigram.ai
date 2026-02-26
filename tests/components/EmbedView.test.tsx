import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils.tsx';
import EmbedView from '../../components/EmbedView.tsx';

vi.mock('../../components/DiagramPreview.tsx', () => ({
  default: ({ code }: { code: string }) => <div data-testid="diagram-preview">{code}</div>,
}));

vi.mock('../../utils/url.ts', () => ({
  decodeCodeFromUrl: (hash: string) => (hash ? `decoded:${hash}` : null),
  encodeCodeToUrl: (code: string) => `encoded:${code}`,
}));

const setLocation = (search: string, hash: string) => {
  Object.defineProperty(window, 'location', {
    value: { search, hash, href: `https://archigram-ai.vercel.app/${search}${hash}` },
    writable: true,
    configurable: true,
  });
};

describe('EmbedView', () => {
  beforeEach(() => {
    setLocation('?embed=true&mode=toolbar', '#testhash');
  });

  it('renders DiagramPreview with decoded code from hash', async () => {
    render(<EmbedView />);
    await waitFor(() => {
      expect(screen.getByTestId('diagram-preview')).toBeInTheDocument();
    });
  });

  it('shows zoom controls in toolbar mode', () => {
    setLocation('?embed=true&mode=toolbar', '#testhash');
    render(<EmbedView />);
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
  });

  it('hides zoom controls in minimal mode', () => {
    setLocation('?embed=true&mode=minimal', '#testhash');
    render(<EmbedView />);
    expect(screen.queryByLabelText('Zoom in')).not.toBeInTheDocument();
  });

  it('shows Fork button in interactive mode', () => {
    setLocation('?embed=true&mode=interactive', '#testhash');
    render(<EmbedView />);
    expect(screen.getByText(/Fork this diagram/i)).toBeInTheDocument();
  });

  it('does not show Fork button in toolbar mode', () => {
    setLocation('?embed=true&mode=toolbar', '#testhash');
    render(<EmbedView />);
    expect(screen.queryByText(/Fork this diagram/i)).not.toBeInTheDocument();
  });

  it('shows placeholder when hash is missing', () => {
    setLocation('?embed=true', '');
    render(<EmbedView />);
    expect(screen.getByText(/No diagram/i)).toBeInTheDocument();
  });
});
