import { describe, it, expect } from 'vitest';
import { mergeProjects } from '../../hooks/useDiagramSync.ts';
import type { Project } from '../../types.ts';

describe('mergeProjects', () => {
  it('returns local projects when cloud is empty', () => {
    const local: Project[] = [{ id: '1', name: 'A', code: 'x', updatedAt: 1000 }];
    const result = mergeProjects(local, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns cloud projects when local is empty', () => {
    const cloud: Project[] = [{ id: '2', name: 'B', code: 'y', updatedAt: 2000 }];
    const result = mergeProjects([], cloud);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('prefers newer updatedAt on conflict', () => {
    const local: Project[] = [{ id: '1', name: 'local', code: 'local', updatedAt: 3000 }];
    const cloud: Project[] = [{ id: '1', name: 'cloud', code: 'cloud', updatedAt: 1000 }];
    const result = mergeProjects(local, cloud);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('local'); // local is newer
  });

  it('deduplicates by id', () => {
    const local: Project[] = [{ id: '1', name: 'A', code: 'a', updatedAt: 1000 }];
    const cloud: Project[] = [
      { id: '1', name: 'A-cloud', code: 'a', updatedAt: 500 },
      { id: '2', name: 'B', code: 'b', updatedAt: 2000 },
    ];
    const result = mergeProjects(local, cloud);
    expect(result).toHaveLength(2);
  });
});
