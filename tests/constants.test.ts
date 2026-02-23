/**
 * Tests for constants.ts exports and data module integrity
 */

import { describe, it, expect } from 'vitest';
import {
  COMMUNITY_DATA,
  FAQ_DATA,
  DOMAIN_INSTRUCTIONS,
  ML_TEMPLATES,
  TEMPLATES,
  C4_TEMPLATES,
  STORAGE_KEY,
  PROJECTS_STORAGE_KEY,
  LIKED_IDS_KEY,
  LIKED_PROMPT_IDS_KEY,
  AUTHOR_KEY,
  INITIAL_CODE,
} from '../constants.ts';

describe('COMMUNITY_DATA', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(COMMUNITY_DATA)).toBe(true);
    expect(COMMUNITY_DATA.length).toBeGreaterThan(0);
  });

  it('all entries have required fields (id, title, author, code)', () => {
    for (const entry of COMMUNITY_DATA) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('title');
      expect(entry).toHaveProperty('author');
      expect(entry).toHaveProperty('code');
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.title).toBe('string');
      expect(typeof entry.author).toBe('string');
      expect(typeof entry.code).toBe('string');
    }
  });

  it('all IDs are unique', () => {
    const ids = COMMUNITY_DATA.map((entry) => entry.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('createdAtTimestamp is a valid number for every entry', () => {
    for (const entry of COMMUNITY_DATA) {
      expect(typeof entry.createdAtTimestamp).toBe('number');
      expect(Number.isNaN(entry.createdAtTimestamp)).toBe(false);
    }
  });

  it('tags is an array for every entry', () => {
    for (const entry of COMMUNITY_DATA) {
      expect(Array.isArray(entry.tags)).toBe(true);
    }
  });

  it('code is non-empty for every entry', () => {
    for (const entry of COMMUNITY_DATA) {
      expect(entry.code.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('FAQ_DATA', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(FAQ_DATA)).toBe(true);
    expect(FAQ_DATA.length).toBeGreaterThan(0);
  });

  it('all entries have question and answer strings', () => {
    for (const entry of FAQ_DATA) {
      expect(typeof entry.question).toBe('string');
      expect(typeof entry.answer).toBe('string');
    }
  });

  it('no empty questions or answers', () => {
    for (const entry of FAQ_DATA) {
      expect(entry.question.trim().length).toBeGreaterThan(0);
      expect(entry.answer.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('DOMAIN_INSTRUCTIONS', () => {
  const expectedKeys = ['General', 'Healthcare', 'Finance', 'E-commerce'];

  it('has all 4 expected domain keys', () => {
    for (const key of expectedKeys) {
      expect(DOMAIN_INSTRUCTIONS).toHaveProperty(key);
    }
    expect(Object.keys(DOMAIN_INSTRUCTIONS)).toHaveLength(expectedKeys.length);
  });

  it('all values are non-empty strings', () => {
    for (const key of expectedKeys) {
      const value = DOMAIN_INSTRUCTIONS[key];
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('Template exports', () => {
  const mermaidKeywords = [
    'graph',
    'flowchart',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram',
    'journey',
    'architecture-beta',
  ];

  function containsMermaidKeyword(code: string): boolean {
    return mermaidKeywords.some((keyword) => code.includes(keyword));
  }

  describe('ML_TEMPLATES', () => {
    it('is a Record with at least one entry', () => {
      expect(typeof ML_TEMPLATES).toBe('object');
      expect(Object.keys(ML_TEMPLATES).length).toBeGreaterThan(0);
    });

    it('all values contain valid mermaid-like keywords', () => {
      for (const [, value] of Object.entries(ML_TEMPLATES)) {
        expect(typeof value).toBe('string');
        expect(containsMermaidKeyword(value)).toBe(true);
      }
    });
  });

  describe('TEMPLATES', () => {
    it('is a Record with at least one entry', () => {
      expect(typeof TEMPLATES).toBe('object');
      expect(Object.keys(TEMPLATES).length).toBeGreaterThan(0);
    });

    it('all values contain valid mermaid-like keywords', () => {
      for (const [, value] of Object.entries(TEMPLATES)) {
        expect(typeof value).toBe('string');
        expect(containsMermaidKeyword(value)).toBe(true);
      }
    });
  });

  describe('C4_TEMPLATES', () => {
    it('is a Record with at least one entry', () => {
      expect(typeof C4_TEMPLATES).toBe('object');
      expect(Object.keys(C4_TEMPLATES).length).toBeGreaterThan(0);
    });

    it('all values contain valid mermaid-like keywords', () => {
      for (const [, value] of Object.entries(C4_TEMPLATES)) {
        expect(typeof value).toBe('string');
        expect(containsMermaidKeyword(value)).toBe(true);
      }
    });
  });
});

describe('Storage key constants', () => {
  it('STORAGE_KEY is a non-empty string', () => {
    expect(typeof STORAGE_KEY).toBe('string');
    expect(STORAGE_KEY.trim().length).toBeGreaterThan(0);
  });

  it('PROJECTS_STORAGE_KEY is a non-empty string', () => {
    expect(typeof PROJECTS_STORAGE_KEY).toBe('string');
    expect(PROJECTS_STORAGE_KEY.trim().length).toBeGreaterThan(0);
  });

  it('LIKED_IDS_KEY is a non-empty string', () => {
    expect(typeof LIKED_IDS_KEY).toBe('string');
    expect(LIKED_IDS_KEY.trim().length).toBeGreaterThan(0);
  });

  it('LIKED_PROMPT_IDS_KEY is a non-empty string', () => {
    expect(typeof LIKED_PROMPT_IDS_KEY).toBe('string');
    expect(LIKED_PROMPT_IDS_KEY.trim().length).toBeGreaterThan(0);
  });

  it('AUTHOR_KEY is a non-empty string', () => {
    expect(typeof AUTHOR_KEY).toBe('string');
    expect(AUTHOR_KEY.trim().length).toBeGreaterThan(0);
  });
});

describe('INITIAL_CODE', () => {
  it('is a non-empty string', () => {
    expect(typeof INITIAL_CODE).toBe('string');
    expect(INITIAL_CODE.trim().length).toBeGreaterThan(0);
  });

  it('contains mermaid syntax keywords', () => {
    const mermaidKeywords = [
      'graph',
      'flowchart',
      'sequenceDiagram',
      'classDiagram',
      'stateDiagram',
    ];
    const containsKeyword = mermaidKeywords.some((keyword) => INITIAL_CODE.includes(keyword));
    expect(containsKeyword).toBe(true);
  });
});
