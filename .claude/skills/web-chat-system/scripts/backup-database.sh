#!/bin/bash

# Database Backup Script for Web Chat System
# Usage: ./backup-database.sh [backup_dir]

set -e

# Configuration
BACKUP_DIR="${1:-./backups}"
DB_PATH="./server/database/chat.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/chat-$DATE.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database file not found at $DB_PATH"
    exit 1
fi

echo "Starting database backup..."

# Create backup using SQLite backup command
sqlite3 "$DB_PATH" ".backup $BACKUP_FILE"

# Verify backup was created
if [ -f "$BACKUP_FILE" ]; then
    # Get file sizes
    ORIGINAL_SIZE=$(du -h "$DB_PATH" | cut -f1)
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

    echo "Backup completed successfully!"
    echo "Original size: $ORIGINAL_SIZE"
    echo "Backup size: $BACKUP_SIZE"
    echo "Backup file: $BACKUP_FILE"

    # Clean up old backups (keep last 7 days)
    echo "Cleaning up old backups..."
    find "$BACKUP_DIR" -name "chat-*.db" -mtime +7 -delete
    echo "Old backups removed"

    # Display backup count
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/chat-*.db 2>/dev/null | wc -l)
    echo "Total backups: $BACKUP_COUNT"
else
    echo "Error: Backup file was not created"
    exit 1
fi

echo "Backup process finished."
