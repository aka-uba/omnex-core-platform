-- Migration: Add layoutConfig and related columns to UserPreferences
-- This migration adds the new layout configuration columns that are defined in the schema
-- but may not exist in the database yet.

-- Add layoutConfig column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserPreferences' AND column_name = 'layoutConfig'
    ) THEN
        ALTER TABLE "UserPreferences" ADD COLUMN "layoutConfig" JSONB;
    END IF;
END $$;

-- Add sidebarConfig column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserPreferences' AND column_name = 'sidebarConfig'
    ) THEN
        ALTER TABLE "UserPreferences" ADD COLUMN "sidebarConfig" JSONB;
    END IF;
END $$;

-- Add topConfig column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserPreferences' AND column_name = 'topConfig'
    ) THEN
        ALTER TABLE "UserPreferences" ADD COLUMN "topConfig" JSONB;
    END IF;
END $$;

-- Add mobileConfig column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserPreferences' AND column_name = 'mobileConfig'
    ) THEN
        ALTER TABLE "UserPreferences" ADD COLUMN "mobileConfig" JSONB;
    END IF;
END $$;

-- Add contentAreaConfig column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserPreferences' AND column_name = 'contentAreaConfig'
    ) THEN
        ALTER TABLE "UserPreferences" ADD COLUMN "contentAreaConfig" JSONB;
    END IF;
END $$;

-- Add layoutSource column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserPreferences' AND column_name = 'layoutSource'
    ) THEN
        ALTER TABLE "UserPreferences" ADD COLUMN "layoutSource" TEXT;
    END IF;
END $$;









