#!/bin/sh
set -eu

# First-boot only. Passwords are bound through psql variables so quotes and
# special characters cannot break the SQL literal.
psql --set ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=kc_password="$KEYCLOAK_DB_PASSWORD" <<'SQL'
CREATE USER keycloak WITH PASSWORD :'kc_password';
CREATE DATABASE keycloak OWNER keycloak;
REVOKE ALL ON DATABASE keycloak FROM PUBLIC;
SQL
