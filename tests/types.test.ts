import { describe, it, expectTypeOf } from 'vitest';
import type { EmbedMode } from '../types.ts';

describe('EmbedMode', () => {
  it('includes minimal, toolbar, and interactive', () => {
    expectTypeOf<'minimal'>().toMatchTypeOf<EmbedMode>();
    expectTypeOf<'toolbar'>().toMatchTypeOf<EmbedMode>();
    expectTypeOf<'interactive'>().toMatchTypeOf<EmbedMode>();
  });

  it('does not include invalid modes', () => {
    expectTypeOf<'full'>().not.toMatchTypeOf<EmbedMode>();
    expectTypeOf<''>().not.toMatchTypeOf<EmbedMode>();
  });
});
