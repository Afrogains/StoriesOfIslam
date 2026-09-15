import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { getEnv } from '../config/env';
import type { SeedData } from '../types';

export async function seedDatabase(): Promise<void> {
  const env = getEnv();
  const data = JSON.parse(await readFile(resolve(process.cwd(), 'db/seed.json'), 'utf8')) as SeedData;
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : undefined,
  });
  await client.connect();
  await client.query('BEGIN');
  try {
    for (const item of data.categories) {
      await client.query(
        `INSERT INTO categories(id,slug,name_en,name_ar,description_en,description_ar,sort_order)
         VALUES($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT(id) DO UPDATE SET slug=EXCLUDED.slug,name_en=EXCLUDED.name_en,
         name_ar=EXCLUDED.name_ar,description_en=EXCLUDED.description_en,
         description_ar=EXCLUDED.description_ar,sort_order=EXCLUDED.sort_order`,
        [item.id, item.slug, item.name.en, item.name.ar, item.description.en, item.description.ar, item.sortOrder],
      );
    }
    for (const item of data.figures) {
      await client.query(
        `INSERT INTO figures(id,category_id,slug,name_en,name_ar,honorific_en,honorific_ar,
          is_key_figure,sort_order,bio_en,bio_ar)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT(id) DO UPDATE SET category_id=EXCLUDED.category_id,slug=EXCLUDED.slug,
          name_en=EXCLUDED.name_en,name_ar=EXCLUDED.name_ar,honorific_en=EXCLUDED.honorific_en,
          honorific_ar=EXCLUDED.honorific_ar,is_key_figure=EXCLUDED.is_key_figure,
          sort_order=EXCLUDED.sort_order,bio_en=EXCLUDED.bio_en,bio_ar=EXCLUDED.bio_ar`,
        [item.id, item.categoryId, item.slug, item.name.en, item.name.ar, item.honorific.en,
          item.honorific.ar, item.isKeyFigure, item.sortOrder, item.bio.en, item.bio.ar],
      );
    }
    for (const item of data.stories) {
      const placeholder = item.audioUrl.includes('.example');
      await client.query(
        `INSERT INTO stories(id,category_id,figure_id,slug,title_en,title_ar,summary_en,
          content_en,content_ar,authenticity_grade,publication_status,audio_url,audio,timed_cues)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',$11,$12,$13)
         ON CONFLICT(id) DO UPDATE SET category_id=EXCLUDED.category_id,figure_id=EXCLUDED.figure_id,
          slug=EXCLUDED.slug,title_en=EXCLUDED.title_en,title_ar=EXCLUDED.title_ar,
          summary_en=EXCLUDED.summary_en,content_en=EXCLUDED.content_en,content_ar=EXCLUDED.content_ar,
          authenticity_grade=EXCLUDED.authenticity_grade,audio_url=EXCLUDED.audio_url,
          audio=EXCLUDED.audio,timed_cues=EXCLUDED.timed_cues`,
        [item.id, item.categoryId, item.figureId, item.slug, item.title.en, item.title.ar,
          item.content.en.slice(0, 320), item.content.en, item.content.ar, item.authenticityGrade,
          placeholder ? null : item.audioUrl, placeholder ? null : JSON.stringify(item.audio),
          JSON.stringify(item.timedCues)],
      );
      if (item.sourceCitation.trim()) {
        await client.query(
          `INSERT INTO story_citations(story_id,source_title)
           SELECT $1,$2 WHERE NOT EXISTS(
             SELECT 1 FROM story_citations WHERE story_id=$1 AND source_title=$2
           )`,
          [item.id, item.sourceCitation.trim()],
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedDatabase().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
}
