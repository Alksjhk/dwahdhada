#!/bin/bash

# Database Restore Script for Web Chat System
# Usage: ./restore-database.sh <backup_file>

set -e

# Check if backup file provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 backups/chat-20240101_120000.db"
    exit 1
fi

# Configuration
BACKUP_FILE="$1"
DB_PATH="./server/database/chat.db"
DB_DIR=$(dirname "$DB_PATH")

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found at $BACKUP_FILE"
    exit 1
fi

# Validate SQLite database
if ! sqlite3 "$BACKUP_FILE" "SELECT 1;" &>/dev/null; then
    echo "Error: Invalid SQLite database file"
    exit 1
fi

# Confirm restore
echo "This will replace the current database with:"
echo "  Backup file: $BACKUP_FILE"
echo "  Target: $DB_PATH"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Stop services if running
echo "Checking for running services..."
if pgrep -f "node.*app.js" > /dev/null; then
    echo "Stopping server..."
    pm2 stop chat-server 2>/dev/null || pkill -f "node.*app.js"
    sleep 2
fi

# Create backup of current database before restore
if [ -f "$DB_PATH" ]; then
    CURRENT_BACKUP="$DB_DIR/chat-before-restore-$(date +%Y%m%d_%H%M%S).db"
    echo "Backing up current database to: $CURRENT_BACKUP"
    cp "$DB_PATH" "$CURRENT_BACKUP"
    echo "Current database backed up."
fi

# Restore database
echo "Restoring database from $BACKUP_FILE..."
cp "$BACKUP_FILE" "$DB_PATH"

# Verify restore
if sqlite3 "$DB_PATH" "SELECT 1;" &>/dev/null; then
    echo "Database restored successfully!"

    # Get some stats
    USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;")
    ROOM_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM rooms;")
    MESSAGE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM messages;")

    echo ""
    echo "Database Statistics:"
    echo "  Users: $USER_COUNT"
    echo "  Rooms: $ROOM_COUNT"
    echo "  Messages: $MESSAGE_COUNT"

    # Restart services if they were stopped
    echo ""
    read -p "Do you want to start the server now? (yes/no): " start_server

    if [ "$start_server" = "yes" ]; then
        echo "Starting server..."
        pm2 start ecosystem.config.js 2>/dev/null || cd server && bun start &
        echo "Server started."
    fi
else
    echo "Error: Database restore failed - invalid database file"
    # Restore original if backup exists
    if [ -f "$CURRENT_BACKUP" ]; then
        echo "Restoring original database..."
        cp "$CURRENT_BACKUP" "$DB_PATH"
        echo "Original database restored."
    fi
    exit 1
fi

echo ""
echo "Restore process completed."
