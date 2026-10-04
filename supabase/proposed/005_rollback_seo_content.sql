--
-- DALILAK SEO CONTENT - ONE-CLICK ROLLBACK SCRIPT
-- Generated: 2026-10-04T17:52:08.772Z
-- Reverts all approved seo_* columns to NULL / default without touching original data.
--
BEGIN;

UPDATE public.businesses
SET seo_title = NULL,
    seo_description = NULL,
    seo_intro = NULL,
    seo_keywords_internal = NULL,
    seo_faq = '[]'::jsonb,
    seo_status = 'draft',
    seo_source_fields = '[]'::jsonb,
    seo_generated_at = NULL,
    seo_reviewed_by = NULL
WHERE seo_status = 'approved';

COMMIT;
