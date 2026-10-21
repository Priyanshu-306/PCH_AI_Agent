#!/usr/bin/env sh
# Nightly backup of the database and uploaded media (add to crontab: 30 2 * * * /path/deploy/backup.sh)
set -e
STAMP=$(date +%F)
DEST=${BACKUP_DIR:-$HOME/backups}
mkdir -p "$DEST"
docker compose exec -T db pg_dump -U pch pch | gzip > "$DEST/pch-db-$STAMP.sql.gz"
docker compose cp app:/app/storage/uploads "$DEST/media-$STAMP"
find "$DEST" -mtime +30 -delete
