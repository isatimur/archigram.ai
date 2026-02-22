/**
 * Tests for Gemini AI service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

vi.mock('../services/ragClient', () => ({
  getRAGContext: vi.fn().mockResolvedValue(''),
  isRAGEnabled: vi.fn().mockReturnValue(false),
}));

describe('geminiService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv, API_KEY: 'test-api-key' };
    mockGenerateContent.mockResolvedValue({
      text: '```mermaid\ngraph TD\n  A[Start] --> B[End]\n```',
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateDiagramCode', () => {
    it('should throw when API_KEY is missing', async () => {
      delete process.env.API_KEY;
      vi.resetModules();

      const { generateDiagramCode } = await import('../services/geminiService');

      await expect(generateDiagramCode('test prompt')).rejects.toThrow('API Key is missing');
    });

    it('should return extracted mermaid code from AI response', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: '```mermaid\ngraph TD\n  A --> B\n```',
      });

      const { generateDiagramCode } = await import('../services/geminiService');
      const result = await generateDiagramCode('create a flowchart');

      expect(result).toContain('graph TD');
      expect(result).toContain('A --> B');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('create a flowchart'),
        })
      );
    });

    it('should include current code in prompt when provided', async () => {
      const { generateDiagramCode } = await import('../services/geminiService');

      await generateDiagramCode('add a node', 'graph TD\n  A --> B');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('Current Diagram Code'),
        })
      );
    });

    it('should return trimmed text when response has no backticks but contains graph keyword', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'graph TD\n  A --> B',
      });

      const { generateDiagramCode } = await import('../services/geminiService');
      const result = await generateDiagramCode('flowchart');

      expect(result).toBe('graph TD\n  A --> B');
    });

    it('should throw when response has no valid mermaid code', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'I cannot generate a diagram for that.',
      });

      const { generateDiagramCode } = await import('../services/geminiService');

      await expect(generateDiagramCode('invalid')).rejects.toThrow(
        'No valid Mermaid code generated'
      );
    });
  });

  describe('auditDiagram', () => {
    it('should return parsed audit report', async () => {
      const mockReport = {
        score: 75,
        summary: 'Good architecture',
        risks: [],
        strengths: ['Clear structure'],
        improvements: ['Add caching'],
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(mockReport),
      });

      const { auditDiagram } = await import('../services/geminiService');
      const result = await auditDiagram('graph TD\n  A --> B');

      expect(result).toEqual(mockReport);
    });

    it('should handle markdown-wrapped JSON response', async () => {
      const mockReport = {
        score: 80,
        summary: 'Test',
        risks: [],
        strengths: [],
        improvements: [],
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: '```json\n' + JSON.stringify(mockReport) + '\n```',
      });

      const { auditDiagram } = await import('../services/geminiService');
      const result = await auditDiagram('graph TD');

      expect(result.score).toBe(80);
    });

    it('should throw when audit response is invalid JSON', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'not valid json at all',
      });

      const { auditDiagram } = await import('../services/geminiService');

      await expect(auditDiagram('graph TD')).rejects.toThrow('Failed to audit diagram');
    });
  });

  describe('fixDiagramSyntax', () => {
    it('should return fixed mermaid code', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: '```mermaid\ngraph TD\n  A --> B\n```',
      });

      const { fixDiagramSyntax } = await import('../services/geminiService');
      const result = await fixDiagramSyntax('graph TD\n  A - B', 'Invalid syntax');

      expect(result).toContain('graph TD');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('Invalid syntax'),
        })
      );
    });
  });
});
