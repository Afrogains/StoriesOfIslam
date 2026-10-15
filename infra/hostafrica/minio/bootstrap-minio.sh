#!/bin/sh
set -eu

ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"

mc alias set local "$ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc mb --ignore-existing local/stories-public
mc mb --ignore-existing local/stories-private
mc anonymous set download local/stories-public
mc anonymous set none local/stories-private

mc admin user add local "$S3_ACCESS_KEY" "$S3_SECRET_KEY" 2>/dev/null || true
mc admin policy create local stories-api-policy /config/api-policy.json 2>/dev/null || \
  mc admin policy update local stories-api-policy /config/api-policy.json
mc admin policy attach local stories-api-policy --user "$S3_ACCESS_KEY"

mc version enable local/stories-public
mc version enable local/stories-private
