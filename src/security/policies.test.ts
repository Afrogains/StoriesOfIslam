import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('publication security policies', () => {
  it('never grants anonymous access through the API MinIO policy', () => {
    const policy = JSON.parse(
      readFileSync(resolve('infra/hostafrica/minio/api-policy.json'), 'utf8'),
    ) as { Statement: { Effect: string; Action: string[]; Resource: string[] }[] };
    expect(policy.Statement.every((statement) => statement.Effect === 'Allow')).toBe(true);
    expect(JSON.stringify(policy)).not.toContain('"Principal"');
    expect(JSON.stringify(policy)).toContain('stories-private');
    expect(JSON.stringify(policy)).toContain('stories-public');
  });

  it('requires review metadata before database publication', () => {
    const migration = readFileSync(resolve('migrations/001_production_schema.sql'), 'utf8');
    expect(migration).toContain('stories_publication_review_check');
    expect(migration).toContain('reviewer_id IS NOT NULL');
    expect(migration).toContain('public_asset_approval_check');
  });
});
