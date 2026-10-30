-- The Names lesson media: one row per (Name, source video). Audio binaries live in
-- object storage (media_assets); only metadata, transcripts and reviewed text live here.

CREATE TABLE divine_names (
  number TINYINT UNSIGNED PRIMARY KEY,
  arabic VARCHAR(128) NOT NULL,
  transliteration VARCHAR(128) NOT NULL,
  meaning VARCHAR(255) NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT divine_names_number_range CHECK (number BETWEEN 1 AND 99)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE divine_name_media (
  id CHAR(36) PRIMARY KEY,
  name_number TINYINT UNSIGNED NOT NULL,
  source_video_id VARCHAR(32) NOT NULL,
  playlist_id VARCHAR(64) NOT NULL,
  class_number SMALLINT NULL,
  video_title VARCHAR(512) NOT NULL,
  video_duration_seconds INT NULL,
  podcast_title VARCHAR(512) NULL,
  podcast_audio_url TEXT NULL,
  audio_asset_id CHAR(36) NULL,
  transcript_status ENUM('pending', 'complete', 'partial', 'failed', 'manual') NOT NULL DEFAULT 'pending',
  transcript_source ENUM('youtube_captions', 'speech_to_text', 'manual') NULL,
  transcript_text MEDIUMTEXT NULL,
  transcript_segments JSON NULL,
  description_draft TEXT NULL,
  review_status ENUM('needs_review', 'approved', 'rejected') NOT NULL DEFAULT 'needs_review',
  approved_description TEXT NULL,
  approved_audio_url TEXT NULL,
  approved_by CHAR(36) NULL,
  approved_at DATETIME(3) NULL,
  last_error VARCHAR(1024) NULL,
  import_attempts INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_name_media_video (name_number, source_video_id),
  KEY idx_name_media_review (review_status, name_number),
  CONSTRAINT name_media_approval_check CHECK (
    review_status <> 'approved'
    OR (approved_by IS NOT NULL AND approved_at IS NOT NULL AND approved_description IS NOT NULL)
  ),
  CONSTRAINT fk_name_media_name FOREIGN KEY (name_number) REFERENCES divine_names(number) ON DELETE RESTRICT,
  CONSTRAINT fk_name_media_asset FOREIGN KEY (audio_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL,
  CONSTRAINT fk_name_media_approved_by FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
