import { describe, it, expectTypeOf } from 'vitest';
import type { EmbedMode } from '../types.ts';

describe('EmbedMode type', () => {
  it('accepts valid embed modes', () => {
    const modes: EmbedMode[] = ['minimal', 'toolbar', 'interactive'];
    expectTypeOf(modes).toEqualTypeOf<EmbedMode[]>();
  });
});
