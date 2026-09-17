import { describe, expect, it } from 'vitest';
import { StoryQuerySchema } from './api';

describe('story query contract', () => {
  it('normalizes pagination and audio filters', () => {
    expect(
      StoryQuerySchema.parse({ page: '2', pageSize: '10', hasAudio: 'true', grade: 'athar' }),
    ).toEqual({ page: 2, pageSize: 10, hasAudio: true, grade: 'athar' });
  });

  it('rejects unbounded page sizes', () => {
    expect(() => StoryQuerySchema.parse({ pageSize: '1000' })).toThrow();
  });
});
