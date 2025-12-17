# Docker Volumes

This directory contains persistent data for Docker services. Data is stored locally in the project directory for easy access, backup, and portability.

## Directory Structure

```
volumes/
├── postgres/     # PostgreSQL database files
├── redis/        # Redis AOF and RDB files
└── minio/        # MinIO S3 object storage
```

## Benefits of Local Volumes

1. **Easy Backup**: Simply copy the volumes/ directory
2. **Portable**: Move entire project with data intact
3. **Visible**: Can inspect database files if needed
4. **Git-Friendly**: Structure is versioned, data is gitignored

## Important Notes

- ⚠️ **Data is gitignored**: The actual data files are NOT committed to git
- ✅ **Structure is versioned**: The directory structure and this README are committed
- 🔒 **Permissions**: Docker may create files as root user
- 📦 **Backups**: Consider regular backups of this directory

## First Time Setup

The directories will be created automatically when you run:

```bash
docker compose up -d
```

## Backup

To backup all data:

```bash
tar -czf backup-$(date +%Y%m%d).tar.gz volumes/
```

To restore from backup:

```bash
docker compose down
tar -xzf backup-YYYYMMDD.tar.gz
docker compose up -d
```

## Migrating from Named Volumes

If you previously used Docker named volumes, you can migrate the data:

```bash
# Stop containers
docker compose down

# Copy data from old volumes
docker run --rm \
  -v template-project_postgres-data:/from \
  -v $(pwd)/volumes/postgres:/to \
  alpine sh -c "cp -av /from/. /to/"

docker run --rm \
  -v template-project_redis-data:/from \
  -v $(pwd)/volumes/redis:/to \
  alpine sh -c "cp -av /from/. /to/"

docker run --rm \
  -v template-project_minio-data:/from \
  -v $(pwd)/volumes/minio:/to \
  alpine sh -c "cp -av /from/. /to/"

# Start containers with new bind mounts
docker compose up -d

# Optionally remove old volumes
docker volume rm template-project_postgres-data template-project_redis-data template-project_minio-data
```

## Cleaning Up

To completely remove all data:

```bash
docker compose down
rm -rf volumes/postgres volumes/redis volumes/minio
```

## Permissions

If you need to access the files directly:

```bash
# Fix ownership (run as needed)
sudo chown -R $USER:$USER volumes/
```
