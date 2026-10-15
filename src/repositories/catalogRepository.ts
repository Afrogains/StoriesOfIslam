import type { RowDataPacket } from 'mysql2/promise';
import { asBool, asJson, query } from '../db/pool';
import type { StoryQuery } from '../contracts/api';

export interface CatalogStory {
  id: string;
  slug: string;
  sectionSlug: string;
  title: string;
  titleAr: string;
  figureName: string;
  figureNameAr: string;
  honorific: string;
  honorificAr: string;
  summary: string;
  content: string;
  contentAr: string;
  durationLabel: string;
  durationMs: number;
  authenticityGrade: string;
  sourceCitation: string;
  hasAudio: boolean;
  audioUrl: string | null;
  artworkUrl: string | null;
  timedCues: unknown[];
}

interface StoryRow extends RowDataPacket {
  id: string;
  slug: string;
  section_slug: string;
  title_en: string;
  title_ar: string;
  figure_name_en: string | null;
  figure_name_ar: string | null;
  honorific_en: string | null;
  honorific_ar: string | null;
  summary_en: string;
  content_en: string;
  content_ar: string;
  authenticity_grade: string;
  audio_url: string | null;
  artwork_url: string | null;
  audio: unknown;
  timed_cues: unknown;
  source_citation: string;
}

function mapStory(row: StoryRow): CatalogStory {
  const audio = asJson<{ durationSeconds?: number } | null>(row.audio, null);
  const durationMs = Math.round((audio?.durationSeconds ?? 0) * 1000);
  const seconds = Math.floor(durationMs / 1000);
  return {
    id: row.id,
    slug: row.slug,
    sectionSlug: row.section_slug,
    title: row.title_en,
    titleAr: row.title_ar,
    figureName: row.figure_name_en ?? '',
    figureNameAr: row.figure_name_ar ?? '',
    honorific: row.honorific_en ?? '',
    honorificAr: row.honorific_ar ?? '',
    summary: row.summary_en,
    content: row.content_en,
    contentAr: row.content_ar,
    durationLabel: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
    durationMs,
    authenticityGrade: row.authenticity_grade,
    sourceCitation: row.source_citation,
    hasAudio: Boolean(row.audio_url),
    audioUrl: row.audio_url,
    artworkUrl: row.artwork_url,
    timedCues: asJson<unknown[]>(row.timed_cues, []),
  };
}

export const catalogRepository = {
  async listCategories() {
    const result = await query<RowDataPacket & {
      id: string;
      slug: string;
      name_en: string;
      name_ar: string;
      description_en: string;
      description_ar: string;
      sort_order: number;
    }>(
      `SELECT id,slug,name_en,name_ar,description_en,description_ar,sort_order
       FROM categories ORDER BY sort_order, name_en`,
    );
    return result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: { en: row.name_en, ar: row.name_ar },
      description: { en: row.description_en, ar: row.description_ar },
      sortOrder: row.sort_order,
    }));
  },

  async listFigures(category?: string) {
    const values: unknown[] = [];
    const where = category ? 'WHERE c.slug = ?' : '';
    if (category) values.push(category);
    const result = await query<RowDataPacket & {
      id: string;
      category_id: string;
      slug: string;
      name_en: string;
      name_ar: string;
      honorific_en: string;
      honorific_ar: string;
      is_key_figure: number | boolean;
      sort_order: number;
      bio_en: string;
      bio_ar: string;
    }>(
      `SELECT f.id,f.category_id,f.slug,f.name_en,f.name_ar,f.honorific_en,
        f.honorific_ar,f.is_key_figure,f.sort_order,f.bio_en,f.bio_ar
       FROM figures f JOIN categories c ON c.id=f.category_id
       ${where} ORDER BY f.sort_order,f.name_en`,
      values,
    );
    return result.rows.map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      slug: row.slug,
      name: { en: row.name_en, ar: row.name_ar },
      honorific: { en: row.honorific_en, ar: row.honorific_ar },
      isKeyFigure: asBool(row.is_key_figure),
      sortOrder: row.sort_order,
      bio: { en: row.bio_en, ar: row.bio_ar },
    }));
  },

  async listStories(filters: StoryQuery) {
    const clauses = ["s.publication_status = 'published'"];
    const values: unknown[] = [];
    if (filters.category) {
      clauses.push('c.slug = ?');
      values.push(filters.category);
    }
    if (filters.grade) {
      clauses.push('s.authenticity_grade = ?');
      values.push(filters.grade);
    }
    if (filters.hasAudio !== undefined) {
      clauses.push(filters.hasAudio ? 's.audio_url IS NOT NULL' : 's.audio_url IS NULL');
    }
    if (filters.search) {
      const term = `%${filters.search}%`;
      clauses.push(
        '(s.title_en LIKE ? OR s.title_ar LIKE ? OR s.summary_en LIKE ? OR f.name_en LIKE ?)',
      );
      values.push(term, term, term, term);
    }

    const countResult = await query<RowDataPacket & { total: number }>(
      `SELECT COUNT(*) AS total
       FROM stories s
       JOIN categories c ON c.id=s.category_id
       LEFT JOIN figures f ON f.id=s.figure_id
       WHERE ${clauses.join(' AND ')}`,
      values,
    );
    const total = Number(countResult.rows[0]?.total ?? 0);

    const offset = (filters.page - 1) * filters.pageSize;
    const pageValues = [...values, filters.pageSize, offset];
    const result = await query<StoryRow>(
      `SELECT s.id,s.slug,c.slug AS section_slug,s.title_en,s.title_ar,
        f.name_en AS figure_name_en,f.name_ar AS figure_name_ar,
        f.honorific_en,f.honorific_ar,s.summary_en,s.content_en,s.content_ar,
        s.authenticity_grade,s.audio_url,s.artwork_url,s.audio,s.timed_cues,
        COALESCE((SELECT GROUP_CONCAT(sc.source_title ORDER BY sc.sort_order SEPARATOR '; ')
          FROM story_citations sc WHERE sc.story_id=s.id),'') AS source_citation
       FROM stories s
       JOIN categories c ON c.id=s.category_id
       LEFT JOIN figures f ON f.id=s.figure_id
       WHERE ${clauses.join(' AND ')}
       ORDER BY s.published_at DESC,s.title_en
       LIMIT ? OFFSET ?`,
      pageValues,
    );
    return {
      items: result.rows.map(mapStory),
      page: filters.page,
      pageSize: filters.pageSize,
      total,
    };
  },

  async getStory(idOrSlug: string): Promise<CatalogStory | null> {
    const result = await query<StoryRow>(
      `SELECT s.id,s.slug,c.slug AS section_slug,s.title_en,s.title_ar,
        f.name_en AS figure_name_en,f.name_ar AS figure_name_ar,
        f.honorific_en,f.honorific_ar,s.summary_en,s.content_en,s.content_ar,
        s.authenticity_grade,s.audio_url,s.artwork_url,s.audio,s.timed_cues,
        COALESCE((SELECT GROUP_CONCAT(sc.source_title ORDER BY sc.sort_order SEPARATOR '; ')
          FROM story_citations sc WHERE sc.story_id=s.id),'') AS source_citation
       FROM stories s
       JOIN categories c ON c.id=s.category_id
       LEFT JOIN figures f ON f.id=s.figure_id
       WHERE s.publication_status='published' AND (s.id=? OR s.slug=?)
       LIMIT 1`,
      [idOrSlug, idOrSlug],
    );
    return result.rows[0] ? mapStory(result.rows[0]) : null;
  },
};

export type CatalogRepository = typeof catalogRepository;
