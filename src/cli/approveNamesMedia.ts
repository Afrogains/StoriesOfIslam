import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { logger } from '../config/logger';
import { closeDatabase } from '../db/pool';
import type { DivineNameRecord } from '../names/matching';
import { namesMediaRepository } from '../repositories/namesMediaRepository';

const HELP = `Approve imported The Names records for the public catalog.

  npm run names:approve -- --all
  npm run names:approve -- --names=5,9,16 --confirm-overwrite

Uses curated Name meanings (not lecture transcripts). Listen streams the
Muslim Central episode already stored on the record.`;

interface CatalogName extends DivineNameRecord {
  reflection?: string;
}

function numberSet(raw: string | undefined): Set<number> | null {
  if (!raw) return null;
  const values = raw.split(',').map((value) => Number(value.trim())).filter(Number.isInteger);
  return values.length ? new Set(values) : null;
}

export function approvedDescription(name: CatalogName, classNumber: number | null): string {
  const classLine =
    classNumber != null
      ? `Listen to The Names, Class ${classNumber} — Shaykh Mikaeel Smith (Muslim Central).`
      : 'Listen to The Names — Shaykh Mikaeel Smith (Muslim Central).';
  return `${name.transliteration} — ${name.meaning}\n\n${name.reflection ?? name.meaning}\n\n${classLine}`;
}

export function parseApproveOptions(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      all: { type: 'boolean', default: false },
      names: { type: 'string' },
      'confirm-overwrite': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) return null;
  const names = numberSet(values.names);
  if (!values.all && !names) throw new Error('Pass --all or --names=1,5,9');
  return { all: Boolean(values.all), names, confirmOverwrite: Boolean(values['confirm-overwrite']) };
}

async function main(): Promise<void> {
  const options = parseApproveOptions(process.argv.slice(2));
  if (!options) {
    process.stdout.write(`${HELP}\n`);
    return;
  }
  const catalog = JSON.parse(
    await readFile(resolve(process.cwd(), 'db/divine-names.json'), 'utf8'),
  ) as CatalogName[];
  const byNumber = new Map(catalog.map((name) => [name.number, name]));
  const queue = await namesMediaRepository.listForReview(undefined, undefined);
  const selected = queue.filter((row) => options.all || options.names?.has(row.nameNumber));
  const operator = {
    subject: 'cli-names-approver',
    email: 'names-approver@local',
    displayName: 'Names approver',
    roles: ['reviewer', 'admin'],
    token: '',
  };

  let approved = 0;
  let skipped = 0;
  const failures: Array<{ id: string; nameNumber: number; error: string }> = [];
  for (const row of selected) {
    const name = byNumber.get(row.nameNumber);
    if (!name) {
      failures.push({ id: row.id, nameNumber: row.nameNumber, error: 'Name is not in the catalog' });
      continue;
    }
    if (row.reviewStatus === 'approved' && !options.confirmOverwrite) {
      skipped += 1;
      continue;
    }
    try {
      await namesMediaRepository.approve(operator, row.id, {
        description: approvedDescription(name, row.classNumber),
        audioUrl: null,
        confirmOverwrite: options.confirmOverwrite,
      });
      approved += 1;
    } catch (error) {
      failures.push({
        id: row.id,
        nameNumber: row.nameNumber,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info(
    { selected: selected.length, approved, skipped, failures: failures.length },
    'names approve: finished',
  );
  if (failures.length) {
    for (const failure of failures) logger.warn(failure, 'names approve: failed');
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main()
    .catch((error: unknown) => {
      logger.error({ err: error instanceof Error ? error.message : String(error) }, 'names approve failed');
      process.exitCode = 1;
    })
    .finally(() => closeDatabase());
}
