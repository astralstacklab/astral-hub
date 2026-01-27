-- This script is executed when the PostgreSQL container is first created.

-- Set client encoding to UTF8
SET client_encoding = 'UTF8';

-- Enable the uuid-ossp extension to generate UUIDs, required by Prisma/other tools.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: The database itself is created by the Docker entrypoint using environment variables.
-- The encoding of the database is best set at creation time. The official postgres
-- image defaults to a UTF8 locale which is generally sufficient.