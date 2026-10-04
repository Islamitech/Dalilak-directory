--
-- DALILAK SEO CONTENT - POST-APPLY VERIFICATION QUERIES
-- Run this in Supabase SQL Editor after applying to verify counts and inspect sample rows.
--
-- 1. Counts Summary (Expect: ~1,952 approved_seo)
SELECT 
    count(*) AS total_businesses,
    count(seo_title) AS businesses_with_seo,
    count(*) FILTER (WHERE seo_status = 'approved') AS approved_seo,
    count(*) FILTER (WHERE seo_status = 'draft') AS draft_seo,
    count(*) FILTER (WHERE seo_status = 'rejected') AS rejected_seo
FROM public.businesses;

-- 2. Sample 10 Approved Businesses
SELECT 
    id,
    name_ar,
    category,
    seo_title,
    seo_description,
    seo_status,
    seo_generated_at
FROM public.businesses
WHERE seo_status = 'approved'
LIMIT 10;
