-- ============================================
-- Omnex Core Platform - Database Initialization
-- ============================================

-- Create additional databases for tenants
-- Note: Main omnex_core database is created by POSTGRES_DB env var

-- Create tenant database template
CREATE DATABASE tenant_omnexcore_2025;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE omnex_core TO omnex_user;
GRANT ALL PRIVILEGES ON DATABASE tenant_omnexcore_2025 TO omnex_user;

-- Enable extensions
\c omnex_core
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c tenant_omnexcore_2025
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
