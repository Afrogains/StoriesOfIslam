CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE authenticity_grade AS ENUM ('sahih', 'hasan', 'athar', 'historical');
CREATE TYPE publication_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'archived');
CREATE TYPE generation_job_status AS ENUM ('queued', 'running', 'review_required', 'completed', 'failed', 'cancelled');
CREATE TYPE generation_job_type AS ENUM ('podcast_script', 'voice_synthesis', 'full_episode');

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_slug_core_check CHECK (
    slug IN ('qisas-al-anbiya', 'seerah-shamail', 'sahabah', 'gleanings')
  )
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keycloak_subject TEXT NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  roles TEXT[] NOT NULL DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE figures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  honorific_en TEXT NOT NULL DEFAULT '',
  honorific_ar TEXT NOT NULL DEFAULT '',
  is_key_figure BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  bio_en TEXT NOT NULL DEFAULT '',
  bio_ar TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  figure_id UUID REFERENCES figures(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  summary_en TEXT NOT NULL DEFAULT '',
  content_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  authenticity_grade authenticity_grade NOT NULL,
  publication_status publication_status NOT NULL DEFAULT 'draft',
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  audio_url TEXT,
  artwork_url TEXT,
  audio JSONB,
  timed_cues JSONB NOT NULL DEFAULT '[]'::jsonb,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stories_timed_cues_array_check CHECK (jsonb_typeof(timed_cues) = 'array'),
  CONSTRAINT stories_publication_review_check CHECK (
    publication_status NOT IN ('approved', 'published')
    OR (reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL)
  ),
  CONSTRAINT stories_published_at_check CHECK (
    publication_status <> 'published' OR published_at IS NOT NULL
  ),
  CONSTRAINT stories_audio_shape_check CHECK (
    audio IS NULL OR (
      audio ? 'url'
      AND audio ? 'mimeType'
      AND audio ? 'durationSeconds'
      AND audio ? 'checksum'
      AND audio ? 'objectKey'
    )
  )
);

CREATE TABLE story_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  source_title TEXT NOT NULL,
  source_author TEXT,
  volume TEXT,
  page TEXT,
  reference_number TEXT,
  source_url TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE story_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, revision)
);

CREATE TABLE favorites (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(profile_id, story_id)
);

CREATE TABLE playback_progress (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  position_ms INTEGER NOT NULL DEFAULT 0 CHECK (position_ms >= 0),
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(profile_id, story_id)
);

CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type generation_job_type NOT NULL,
  status generation_job_status NOT NULL DEFAULT 'queued',
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  input JSONB NOT NULL,
  output JSONB,
  idempotency_key TEXT NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  generation_job_id UUID REFERENCES generation_jobs(id) ON DELETE SET NULL,
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  public_url TEXT,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  checksum_sha256 TEXT NOT NULL,
  duration_ms INTEGER CHECK (duration_ms > 0),
  timeline_object_key TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bucket, object_key),
  CONSTRAINT public_asset_approval_check CHECK (
    NOT is_public OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
  )
);

CREATE INDEX idx_figures_category ON figures(category_id, sort_order);
CREATE INDEX idx_stories_catalog ON stories(publication_status, category_id, published_at DESC);
CREATE INDEX idx_stories_figure ON stories(figure_id);
CREATE INDEX idx_stories_authenticity ON stories(authenticity_grade);
CREATE INDEX idx_citations_story ON story_citations(story_id, sort_order);
CREATE INDEX idx_jobs_poll ON generation_jobs(status, available_at, created_at)
  WHERE status = 'queued';
CREATE INDEX idx_jobs_requester ON generation_jobs(requested_by, created_at DESC);
CREATE INDEX idx_assets_story ON media_assets(story_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER figures_set_updated_at BEFORE UPDATE ON figures
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER stories_set_updated_at BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON generation_jobs
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
  IF figure_category IS NULL OR figure_category <> NEW.category_id THEN
    RAISE EXCEPTION 'story category_id must match the linked figure category_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stories_validate_figure_category
  BEFORE INSERT OR UPDATE OF category_id, figure_id ON stories
  FOR EACH ROW EXECUTE PROCEDURE validate_story_figure_category();
