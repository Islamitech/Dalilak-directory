-- Migration: 003_seo_columns.sql
-- Purpose: Add non-destructive SEO metadata columns to public.businesses table.
--          Original fields (description, name_ar, etc.) are strictly preserved.
-- Status: PROPOSED (DO NOT APPLY without explicit user command "APPLY SEO CONTENT").
-- Rollback:
--   ALTER TABLE public.businesses DROP COLUMN IF EXISTS seo_reviewed_by;
--   ALTER TABLE public.businesses DROP COLUMN IF EXISTS seo_generated_at;
--   ALTER TABLE public.businesses DROP COLUMN IF EXISTS seo_source_fields;
--   ALTER TABLE public.businesses DROP COLUMN IF EXISTS seo_status;
--   ALTER TABLE public.businesses DROP COLUMN IF EXISTS seo_faq;
--   ALTER TABLE public.businesses DROP COLUMN IF EXISTS seo_keywords_internal;
--   ALTER TABLE public.businesses DROP COLUMN IF EXISTS seo_intro;
--   ALTER TABLE public.businesses DROP COLUMN IF EXISTS seo_description;
--   ALTER TABLE public.businesses DROP COLUMN IF EXISTS seo_title;

ALTER TABLE public.businesses
    ADD COLUMN IF NOT EXISTS seo_title TEXT,
    ADD COLUMN IF NOT EXISTS seo_description TEXT,
    ADD COLUMN IF NOT EXISTS seo_intro TEXT,
    ADD COLUMN IF NOT EXISTS seo_keywords_internal TEXT,
    ADD COLUMN IF NOT EXISTS seo_faq JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS seo_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (seo_status IN ('draft', 'approved', 'rejected')),
    ADD COLUMN IF NOT EXISTS seo_source_fields JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS seo_generated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS seo_reviewed_by TEXT;

-- Create index on seo_status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_businesses_seo_status ON public.businesses(seo_status)
    WHERE seo_status = 'approved';

-- Notify PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';

