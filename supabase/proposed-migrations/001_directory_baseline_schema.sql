-- Migration: 001_directory_baseline_schema.sql
-- Purpose: Establish canonical schema definition, constraints, and indexes for the Dalilak public directory businesses table.
-- Risk: Low. Uses CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS to prevent destructive changes.
-- Rollback:
--   DROP INDEX IF EXISTS idx_businesses_active_public;
--   DROP INDEX IF EXISTS idx_businesses_lat_lng;
--   DROP INDEX IF EXISTS idx_businesses_category;
--   DROP INDEX IF EXISTS idx_businesses_verification;
--   DROP TABLE IF EXISTS public.businesses;

CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL,
    governorate TEXT DEFAULT 'Giza',
    city TEXT DEFAULT 'Hadayek Al Ahram',
    street TEXT,
    phone TEXT,
    secondary_phone TEXT,
    working_hours JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    photos TEXT[] DEFAULT '{}'::text[],
    cover_photo TEXT,
    notes TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    verification_status TEXT NOT NULL DEFAULT 'pending',
    package_id TEXT NOT NULL DEFAULT 'free',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance and spatial query indexes
CREATE INDEX IF NOT EXISTS idx_businesses_verification ON public.businesses(verification_status);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_package ON public.businesses(package_id);
CREATE INDEX IF NOT EXISTS idx_businesses_lat_lng ON public.businesses(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_active_public ON public.businesses(created_at DESC, id ASC)
    WHERE verification_status = 'verified' AND package_id != 'pkg_interested_lead';
