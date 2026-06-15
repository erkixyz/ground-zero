#!/bin/bash
set -e

PRIMARY_HOST="${PRIMARY_HOST:-db-primary}"
PRIMARY_PORT="${PRIMARY_PORT:-5432}"
REPLICATION_USER="${REPLICATION_USER:-replicator}"
REPLICATION_PASSWORD="${REPLICATION_PASSWORD:-replicator_password}"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "[db-secondary] Waiting for primary at $PRIMARY_HOST:$PRIMARY_PORT..."
    until pg_isready -h "$PRIMARY_HOST" -p "$PRIMARY_PORT" -q 2>/dev/null; do
        sleep 1
    done

    echo "[db-secondary] Running pg_basebackup..."
    PGPASSWORD="$REPLICATION_PASSWORD" pg_basebackup \
        -h "$PRIMARY_HOST" \
        -p "$PRIMARY_PORT" \
        -U "$REPLICATION_USER" \
        -D "$PGDATA" \
        -Fp -Xs -P -R

    # pg_basebackup -R kirjutab primary_conninfo ilma paroolita; lisame parooli
    sed -i '/^primary_conninfo/d' "$PGDATA/postgresql.auto.conf"
    printf "primary_conninfo = 'host=%s port=%s user=%s password=%s'\n" \
        "$PRIMARY_HOST" "$PRIMARY_PORT" "$REPLICATION_USER" "$REPLICATION_PASSWORD" \
        >> "$PGDATA/postgresql.auto.conf"

    echo "[db-secondary] Replication setup complete."
fi

echo "[db-secondary] Starting PostgreSQL standby..."
exec postgres -D "$PGDATA"
