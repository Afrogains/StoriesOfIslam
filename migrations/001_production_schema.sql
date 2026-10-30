-- Stories of Islam — MySQL 8 / MariaDB 10.6+ schema for HostAfrica.
-- UUIDs are CHAR(36). JSON replaces PostgreSQL JSONB / arrays.
-- schema_migrations is owned by src/cli/migrate.ts.

CREATE TABLE categories (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(64) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_categories_slug (slug),
  CONSTRAINT categories_slug_core_check CHECK (
    slug IN ('qisas-al-anbiya', 'seerah-shamail', 'sahabah', 'gleanings')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY,
  keycloak_subject VARCHAR(255) NOT NULL,
  email VARCHAR(320) NULL,
  display_name VARCHAR(255) NULL,
  locale VARCHAR(16) NOT NULL DEFAULT 'en',
  roles JSON NOT NULL,
  deleted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_profiles_subject (keycloak_subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE figures (
  id CHAR(36) PRIMARY KEY,
  category_id CHAR(36) NOT NULL,
  slug VARCHAR(128) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  honorific_en VARCHAR(255) NOT NULL DEFAULT '',
  honorific_ar VARCHAR(255) NOT NULL DEFAULT '',
  is_key_figure TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  bio_en TEXT NOT NULL,
  bio_ar TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_figures_slug (slug),
  KEY idx_figures_category (category_id, sort_order),
  CONSTRAINT fk_figures_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stories (
  id CHAR(36) PRIMARY KEY,
  category_id CHAR(36) NOT NULL,
  figure_id CHAR(36) NULL,
  slug VARCHAR(160) NOT NULL,
  title_en VARCHAR(512) NOT NULL,
  title_ar VARCHAR(512) NOT NULL,
  summary_en TEXT NOT NULL,
  content_en MEDIUMTEXT NOT NULL,
  content_ar MEDIUMTEXT NOT NULL,
  authenticity_grade ENUM('sahih', 'hasan', 'athar', 'historical') NOT NULL,
  publication_status ENUM('draft', 'in_review', 'approved', 'published', 'archived') NOT NULL DEFAULT 'draft',
  reviewer_id CHAR(36) NULL,
  reviewed_at DATETIME(3) NULL,
  published_at DATETIME(3) NULL,
  audio_url TEXT NULL,
  artwork_url TEXT NULL,
  audio JSON NULL,
  timed_cues JSON NOT NULL,
  revision INT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_stories_slug (slug),
  KEY idx_stories_catalog (publication_status, category_id, published_at),
  KEY idx_stories_figure (figure_id),
  KEY idx_stories_authenticity (authenticity_grade),
  CONSTRAINT stories_publication_review_check CHECK (
    publication_status NOT IN ('approved', 'published')
    OR (reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL)
  ),
  CONSTRAINT fk_stories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_stories_figure FOREIGN KEY (figure_id) REFERENCES figures(id) ON DELETE SET NULL,
  CONSTRAINT fk_stories_reviewer FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE story_citations (
  id CHAR(36) PRIMARY KEY,
  story_id CHAR(36) NOT NULL,
  source_title VARCHAR(512) NOT NULL,
  source_author VARCHAR(255) NULL,
  volume VARCHAR(64) NULL,
  page VARCHAR(64) NULL,
  reference_number VARCHAR(128) NULL,
  source_url TEXT NULL,
  notes TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_citations_story (story_id, sort_order),
  CONSTRAINT fk_citations_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE story_revisions (
  id CHAR(36) PRIMARY KEY,
  story_id CHAR(36) NOT NULL,
  revision INT NOT NULL,
  snapshot JSON NOT NULL,
  change_summary TEXT NOT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_story_revision (story_id, revision),
  CONSTRAINT fk_revisions_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_revisions_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE favorites (
  profile_id CHAR(36) NOT NULL,
  story_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (profile_id, story_id),
  CONSTRAINT fk_favorites_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE playback_progress (
  profile_id CHAR(36) NOT NULL,
  story_id CHAR(36) NOT NULL,
  position_ms INT NOT NULL DEFAULT 0,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (profile_id, story_id),
  CONSTRAINT playback_position_nonneg CHECK (position_ms >= 0),
  CONSTRAINT fk_progress_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE generation_jobs (
  id CHAR(36) PRIMARY KEY,
  job_type ENUM('podcast_script', 'voice_synthesis', 'full_episode') NOT NULL,
  status ENUM('queued', 'running', 'review_required', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'queued',
  requested_by CHAR(36) NOT NULL,
  story_id CHAR(36) NULL,
  input JSON NOT NULL,
  output JSON NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  locked_at DATETIME(3) NULL,
  locked_by VARCHAR(128) NULL,
  available_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  error_code VARCHAR(128) NULL,
  error_message TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  completed_at DATETIME(3) NULL,
  UNIQUE KEY uq_jobs_idempotency (idempotency_key),
  KEY idx_jobs_poll (status, available_at, created_at),
  KEY idx_jobs_requester (requested_by, created_at),
  CONSTRAINT fk_jobs_requester FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_jobs_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE media_assets (
  id CHAR(36) PRIMARY KEY,
  story_id CHAR(36) NULL,
  generation_job_id CHAR(36) NULL,
  bucket VARCHAR(255) NOT NULL,
  object_key VARCHAR(512) NOT NULL,
  public_url TEXT NULL,
  mime_type VARCHAR(128) NOT NULL,
  size_bytes BIGINT NOT NULL,
  checksum_sha256 CHAR(64) NOT NULL,
  duration_ms INT NULL,
  timeline_object_key VARCHAR(512) NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  approved_by CHAR(36) NULL,
  approved_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_assets_bucket_key (bucket, object_key),
  KEY idx_assets_story (story_id, created_at),
  CONSTRAINT media_size_positive CHECK (size_bytes > 0),
  CONSTRAINT public_asset_approval_check CHECK (
    is_public = 0 OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
  ),
  CONSTRAINT fk_assets_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_assets_job FOREIGN KEY (generation_job_id) REFERENCES generation_jobs(id) ON DELETE SET NULL,
  CONSTRAINT fk_assets_approved_by FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Figure/category consistency is enforced in application services (seed/editorial).