-- Stories of Islam — core PostgreSQL schema
-- Taxonomy: Qisas al-Anbiya, Seerah & Shama'il, Sahabah, Gleanings

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE authenticity_grade AS ENUM ('sahih', 'hasan', 'historical');

CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name_en         TEXT NOT NULL,
  name_ar         TEXT NOT NULL,
  description_en  TEXT,
  description_ar  TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_slug_core_check CHECK (
    slug IN ('qisas-al-anbiya', 'seerah-shamail', 'sahabah', 'gleanings')
  )
);

CREATE TABLE figures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  slug            TEXT NOT NULL UNIQUE,
  name_en         TEXT NOT NULL,
  name_ar         TEXT NOT NULL,
  honorific_en    TEXT,
  honorific_ar    TEXT,
  is_key_figure   BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  bio_en          TEXT,
  bio_ar          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stories (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id          UUID NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  figure_id            UUID REFERENCES figures (id) ON DELETE SET NULL,
  slug                 TEXT NOT NULL UNIQUE,
  title_en             TEXT NOT NULL,
  title_ar             TEXT NOT NULL,
  content_en           TEXT NOT NULL,
  content_ar           TEXT NOT NULL,
  source_citation      TEXT NOT NULL,
  authenticity_grade   authenticity_grade NOT NULL,
  audio_url            TEXT NOT NULL,
  audio                JSONB NOT NULL,
  timed_cues           JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stories_audio_shape_check CHECK (
    audio ? 'url'
    AND audio ? 'cdn'
    AND audio ? 'backgroundPlayer'
    AND audio ? 'mimeType'
    AND audio ? 'durationSeconds'
  ),
  CONSTRAINT stories_timed_cues_array_check CHECK (jsonb_typeof(timed_cues) = 'array')
);

CREATE INDEX idx_figures_category_id ON figures (category_id);
CREATE INDEX idx_figures_key ON figures (category_id, is_key_figure) WHERE is_key_figure = true;
CREATE INDEX idx_stories_category_id ON stories (category_id);
CREATE INDEX idx_stories_figure_id ON stories (figure_id);
CREATE INDEX idx_stories_authenticity ON stories (authenticity_grade);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER figures_set_updated_at
  BEFORE UPDATE ON figures
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER stories_set_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE OR REPLACE FUNCTION validate_story_figure_category()
RETURNS TRIGGER AS $$
DECLARE
  figure_category UUID;
BEGIN
  IF NEW.figure_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT category_id INTO figure_category FROM figures WHERE id = NEW.figure_id;

  IF figure_category IS NULL THEN
    RAISE EXCEPTION 'figure_id % does not exist', NEW.figure_id;
  END IF;

  IF figure_category <> NEW.category_id THEN
    RAISE EXCEPTION 'story category_id must match the linked figure category_id';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stories_validate_figure_category
  BEFORE INSERT OR UPDATE OF category_id, figure_id ON stories
  FOR EACH ROW EXECUTE PROCEDURE validate_story_figure_category();

COMMENT ON TABLE categories IS 'Core taxonomy: Qisas al-Anbiya, Seerah & Shama''il, Sahabah, Gleanings.';
COMMENT ON TABLE figures IS 'People attached to a category, including the 12 key Sahabah.';
COMMENT ON TABLE stories IS 'Bilingual entries with citation, authenticity grade, audio CDN metadata, and timed cues.';
COMMENT ON COLUMN stories.audio IS 'AudioPlayback JSON: url, mimeType, durationSeconds, fileSizeBytes, cdn, backgroundPlayer.';
COMMENT ON COLUMN stories.timed_cues IS 'Array of {startMs, endMs, textEn, textAr} for read/listen sync.';
COMMENT ON COLUMN figures.is_key_figure IS 'True for the 12 key Sahabah figures.';
