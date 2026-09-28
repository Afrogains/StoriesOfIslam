import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import mysql from 'mysql2/promise';
import { mysqlConnectionOptions } from '../db/mysqlConfig';
import type { SeedData } from '../types';

function createSeedConnection() {
  return mysql.createConnection(mysqlConnectionOptions());
}

export async function seedDatabase(): Promise<void> {
  const data = JSON.parse(await readFile(resolve(process.cwd(), 'db/seed.json'), 'utf8')) as SeedData;
  const connection = await createSeedConnection();
  await connection.beginTransaction();
  try {
    for (const item of data.categories) {
      await connection.execute(
        `INSERT INTO categories(id,slug,name_en,name_ar,description_en,description_ar,sort_order)
         VALUES(?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE slug=VALUES(slug),name_en=VALUES(name_en),
         name_ar=VALUES(name_ar),description_en=VALUES(description_en),
         description_ar=VALUES(description_ar),sort_order=VALUES(sort_order)`,
        [item.id, item.slug, item.name.en, item.name.ar, item.description.en, item.description.ar, item.sortOrder],
      );
    }
    for (const item of data.figures) {
      await connection.execute(
        `INSERT INTO figures(id,category_id,slug,name_en,name_ar,honorific_en,honorific_ar,
          is_key_figure,sort_order,bio_en,bio_ar)
         VALUES(?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE category_id=VALUES(category_id),slug=VALUES(slug),
          name_en=VALUES(name_en),name_ar=VALUES(name_ar),honorific_en=VALUES(honorific_en),
          honorific_ar=VALUES(honorific_ar),is_key_figure=VALUES(is_key_figure),
          sort_order=VALUES(sort_order),bio_en=VALUES(bio_en),bio_ar=VALUES(bio_ar)`,
        [item.id, item.categoryId, item.slug, item.name.en, item.name.ar, item.honorific.en,
          item.honorific.ar, item.isKeyFigure ? 1 : 0, item.sortOrder, item.bio.en, item.bio.ar],
      );
    }
    for (const item of data.stories) {
      const placeholder = item.audioUrl.includes('.example');
      await connection.execute(
        `INSERT INTO stories(id,category_id,figure_id,slug,title_en,title_ar,summary_en,
          content_en,content_ar,authenticity_grade,publication_status,audio_url,audio,timed_cues)
         VALUES(?,?,?,?,?,?,?,?,?,?,'draft',?,?,?)
         ON DUPLICATE KEY UPDATE category_id=VALUES(category_id),figure_id=VALUES(figure_id),
          slug=VALUES(slug),title_en=VALUES(title_en),title_ar=VALUES(title_ar),
          summary_en=VALUES(summary_en),content_en=VALUES(content_en),content_ar=VALUES(content_ar),
          authenticity_grade=VALUES(authenticity_grade),audio_url=VALUES(audio_url),
          audio=VALUES(audio),timed_cues=VALUES(timed_cues)`,
        [item.id, item.categoryId, item.figureId, item.slug, item.title.en, item.title.ar,
          item.content.en.slice(0, 320), item.content.en, item.content.ar, item.authenticityGrade,
          placeholder ? null : item.audioUrl, placeholder ? null : JSON.stringify(item.audio),
          JSON.stringify(item.timedCues)],
      );
      if (item.sourceCitation.trim()) {
        const [existing] = await connection.execute<mysql.RowDataPacket[]>(
          'SELECT id FROM story_citations WHERE story_id=? AND source_title=? LIMIT 1',
          [item.id, item.sourceCitation.trim()],
        );
        if (!existing.length) {
          await connection.execute(
            'INSERT INTO story_citations(id,story_id,source_title) VALUES(?,?,?)',
            [randomUUID(), item.id, item.sourceCitation.trim()],
          );
        }
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  seedDatabase().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
}
