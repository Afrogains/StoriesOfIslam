-- Example HostAfrica / cPanel MySQL grants for Stories of Islam.
-- Create database `afroclov_StoriesOfIslam` in cPanel first, then adjust
-- the user name to match the HostAfrica account user before applying.

-- CREATE USER 'afroclov_stories'@'%' IDENTIFIED BY 'replace-with-strong-password';
-- CREATE DATABASE IF NOT EXISTS `afroclov_StoriesOfIslam`
--   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON `afroclov_StoriesOfIslam`.*
  TO 'afroclov_stories'@'%';

-- Runtime-only user (no DDL) once migrations are applied by a privileged account:
-- GRANT SELECT, INSERT, UPDATE, DELETE
--   ON `afroclov_StoriesOfIslam`.*
--   TO 'afroclov_stories_runtime'@'%';

FLUSH PRIVILEGES;
