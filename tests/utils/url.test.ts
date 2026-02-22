/**
 * Tests for URL encoding/decoding utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCompress = vi.fn();
const mockDecompress = vi.fn();

vi.mock('lz-string', () => ({
  __esModule: true,
  get default() {
    return {
      compressToEncodedURIComponent: (s: string) => mockCompress(s),
      decompressFromEncodedURIComponent: (s: string) => mockDecompress(s),
    };
  },
  compressToEncodedURIComponent: (s: string) => mockCompress(s),
  decompressFromEncodedURIComponent: (s: string) => mockDecompress(s),
}));

describe('url utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompress.mockImplementation((s: string) => `encoded:${s}`);
    mockDecompress.mockImplementation((s: string) =>
      s.startsWith('encoded:') ? s.slice(8) : null
    );
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('encodeCodeToUrl', () => {
    it('should encode code via LZString', async () => {
      const { encodeCodeToUrl } = await import('../../utils/url.ts');
      const result = encodeCodeToUrl('graph TD A --> B');
      expect(mockCompress).toHaveBeenCalledWith('graph TD A --> B');
      expect(result).toBe('encoded:graph TD A --> B');
    });

    it('should return empty string when compress fails', async () => {
      mockCompress.mockImplementationOnce(() => {
        throw new Error('compress error');
      });
      const { encodeCodeToUrl } = await import('../../utils/url.ts');
      const result = encodeCodeToUrl('code');
      expect(result).toBe('');
    });
  });

  describe('decodeCodeFromUrl', () => {
    it('should decode hash via LZString', async () => {
      mockDecompress.mockReturnValueOnce('graph TD A --> B');
      const { decodeCodeFromUrl } = await import('../../utils/url.ts');
      const result = decodeCodeFromUrl('encoded:xyz');
      expect(mockDecompress).toHaveBeenCalledWith('encoded:xyz');
      expect(result).toBe('graph TD A --> B');
    });

    it('should return null when decompress returns null', async () => {
      mockDecompress.mockReturnValueOnce(null);
      const { decodeCodeFromUrl } = await import('../../utils/url.ts');
      const result = decodeCodeFromUrl('invalid');
      expect(result).toBeNull();
    });

    it('should return null when decompress throws', async () => {
      mockDecompress.mockImplementationOnce(() => {
        throw new Error('decompress error');
      });
      const { decodeCodeFromUrl } = await import('../../utils/url.ts');
      const result = decodeCodeFromUrl('bad');
      expect(result).toBeNull();
    });
  });
});
