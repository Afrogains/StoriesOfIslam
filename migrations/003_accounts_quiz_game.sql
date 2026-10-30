-- First-party email/password accounts, refresh sessions, chapter quiz results and game scores.
-- Local accounts reuse `profiles`, with keycloak_subject = 'local:<profile id>'.

CREATE TABLE user_credentials (
  profile_id CHAR(36) PRIMARY KEY,
  email_normalized VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  failed_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME(3) NULL,
  last_login_at DATETIME(3) NULL,
  password_updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_user_credentials_email (email_normalized),
  CONSTRAINT fk_user_credentials_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_sessions (
  id CHAR(36) PRIMARY KEY,
  profile_id CHAR(36) NOT NULL,
  refresh_token_hash CHAR(64) NOT NULL,
  user_agent VARCHAR(255) NULL,
  expires_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  last_used_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_auth_sessions_token (refresh_token_hash),
  KEY idx_auth_sessions_profile (profile_id, revoked_at),
  CONSTRAINT fk_auth_sessions_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- story_id is the app catalog id (UUID or bundled slug), so it is not a foreign key.
CREATE TABLE quiz_results (
  profile_id CHAR(36) NOT NULL,
  story_id VARCHAR(160) NOT NULL,
  chapter_index SMALLINT UNSIGNED NOT NULL,
  score TINYINT UNSIGNED NOT NULL,
  total TINYINT UNSIGNED NOT NULL,
  best_score TINYINT UNSIGNED NOT NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 1,
  completed_at DATETIME(3) NOT NULL,
  PRIMARY KEY (profile_id, story_id, chapter_index),
  CONSTRAINT fk_quiz_results_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE game_scores (
  id CHAR(36) PRIMARY KEY,
  profile_id CHAR(36) NOT NULL,
  section VARCHAR(40) NOT NULL,
  score INT UNSIGNED NOT NULL,
  correct TINYINT UNSIGNED NOT NULL,
  total TINYINT UNSIGNED NOT NULL,
  best_streak TINYINT UNSIGNED NOT NULL,
  played_at DATETIME(3) NOT NULL,
  KEY idx_game_scores_board (section, score),
  KEY idx_game_scores_profile (profile_id, played_at),
  CONSTRAINT fk_game_scores_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
