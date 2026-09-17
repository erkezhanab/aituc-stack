# Legacy SQLite migrations

History of the project while it ran on SQLite (`prisma/dev.db`). Kept for reference only —
Prisma does not apply them: the active migration history is `prisma/migrations/` (PostgreSQL / Supabase).
To go back to SQLite locally, swap the two folders and set `provider = "sqlite"` in `schema.prisma`.
