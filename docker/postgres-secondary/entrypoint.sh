#!/bin/bash
set -e

# Fix volume permissions (container starts as root)
mkdir -p "$PGDATA"
chown postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

exec su-exec postgres bash /secondary-setup.sh
