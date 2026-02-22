/**
 * Tests for RAG client
 *
 * Requires vitest.config env: VITE_RAG_ENABLED=true, VITE_RAG_URL=http://localhost:8000
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('RAG Client', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('ragSearch', () => {
    it('should return empty chunks when RAG is disabled', async () => {
      const { ragSearch, isRAGEnabled } = await import('../services/ragClient');
      if (!isRAGEnabled()) {
        const result = await ragSearch('test query');
        expect(result.chunks).toEqual([]);
        expect(result.query).toBe('test query');
        return;
      }
      // When RAG is enabled, mock fetch so we don't hit network; assert return shape
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ chunks: [], query: 'test query' }),
      });
      const result = await ragSearch('test query');
      expect(result.query).toBe('test query');
      expect(Array.isArray(result.chunks)).toBe(true);
    });

    it('should call the search endpoint with correct parameters', async () => {
      const mockResponse = {
        chunks: [{ text: 'Test chunk', source: 'test.md', score: 0.9, doc_type: 'general' }],
        query: 'test query',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const { ragSearch } = await import('../services/ragClient');

      await ragSearch('test query', { topK: 3 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/rag/search'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"query":"test query"'),
        })
      );
    });

    it('should return empty chunks on 503 error (graceful degradation)', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const { ragSearch } = await import('../services/ragClient');

      const result = await ragSearch('test query');

      expect(result.chunks).toEqual([]);
      expect(result.query).toBe('test query');
    });

    it('should return empty chunks on network error', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const { ragSearch } = await import('../services/ragClient');

      const result = await ragSearch('test query');

      expect(result.chunks).toEqual([]);
    });

    it('should return empty chunks on timeout', async () => {
      // Create an AbortError
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      global.fetch = vi.fn().mockRejectedValueOnce(abortError);

      const { ragSearch } = await import('../services/ragClient');

      const result = await ragSearch('test query', { timeout: 100 });

      expect(result.chunks).toEqual([]);
    });

    it('should include company_id in request when provided', async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ chunks: [], query: 'test' }),
      });
      global.fetch = fetchMock;

      const { ragSearch } = await import('../services/ragClient');

      await ragSearch('test query', { companyId: 'company-123' });

      expect(fetchMock).toHaveBeenCalled();
      const callArgs = fetchMock.mock.calls[0];
      const options = callArgs[1] as globalThis.RequestInit;
      const body = JSON.parse(options.body as string);
      expect(body.company_id).toBe('company-123');
    });
  });

  describe('formatRAGContext', () => {
    it('should return empty string for empty chunks', async () => {
      const { formatRAGContext } = await import('../services/ragClient');

      expect(formatRAGContext([])).toBe('');
      expect(formatRAGContext(null as any)).toBe('');
      expect(formatRAGContext(undefined as any)).toBe('');
    });

    it('should format chunks with source information', async () => {
      const { formatRAGContext } = await import('../services/ragClient');

      const chunks = [
        { text: 'First chunk text', source: 'glossary.md', score: 0.9, doc_type: 'glossary' },
        { text: 'Second chunk text', source: 'guide.md', score: 0.8, doc_type: 'guide' },
      ];

      const result = formatRAGContext(chunks);

      expect(result).toContain('COMPANY CONTEXT');
      expect(result).toContain('First chunk text');
      expect(result).toContain('Second chunk text');
      expect(result).toContain('glossary.md');
      expect(result).toContain('guide.md');
    });

    it('should number chunks in output', async () => {
      const { formatRAGContext } = await import('../services/ragClient');

      const chunks = [
        { text: 'Chunk 1', source: 'a.md', score: 0.9 },
        { text: 'Chunk 2', source: 'b.md', score: 0.8 },
      ];

      const result = formatRAGContext(chunks);

      expect(result).toContain('[1]');
      expect(result).toContain('[2]');
    });
  });

  describe('checkRAGHealth', () => {
    it('should return true when service is healthy', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const { checkRAGHealth } = await import('../services/ragClient');

      const result = await checkRAGHealth();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health/ready'),
        expect.any(Object)
      );
    });

    it('should return false when service is unhealthy', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const { checkRAGHealth } = await import('../services/ragClient');

      const result = await checkRAGHealth();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const { checkRAGHealth } = await import('../services/ragClient');

      const result = await checkRAGHealth();

      expect(result).toBe(false);
    });
  });

  describe('getRAGStats', () => {
    it('should return stats when available', async () => {
      const mockStats = {
        collection: 'archigram_v1',
        vectors_count: 1000,
        points_count: 1000,
        status: 'green',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockStats),
      });

      const { getRAGStats } = await import('../services/ragClient');

      const result = await getRAGStats();

      expect(result).toEqual(mockStats);
    });

    it('should return null on error', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const { getRAGStats } = await import('../services/ragClient');

      const result = await getRAGStats();

      expect(result).toBeNull();
    });
  });

  describe('getRAGContext convenience function', () => {
    it('should search and format in one call', async () => {
      const mockResponse = {
        chunks: [{ text: 'Relevant context', source: 'docs.md', score: 0.9 }],
        query: 'user authentication',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const { getRAGContext } = await import('../services/ragClient');

      const result = await getRAGContext('user authentication');

      expect(result).toContain('COMPANY CONTEXT');
      expect(result).toContain('Relevant context');
    });

    it('should return empty string when no results', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ chunks: [], query: 'no results' }),
      });

      const { getRAGContext } = await import('../services/ragClient');

      const result = await getRAGContext('no results');

      expect(result).toBe('');
    });
  });
});
