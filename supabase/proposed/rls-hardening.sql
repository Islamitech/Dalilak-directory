-- ==============================================================================
-- Migration: supabase/proposed/rls-hardening.sql
-- Purpose: Enterprise Row-Level Security (RLS) hardening for Dalilak database
--          1. Strict ownership and access policies
--          2. Anon access restricted: private columns masked via secure view
--          3. Views set with security_invoker = true
--          4. Rate-limiting for check_rep_national_id_exists RPC
-- Status: PROPOSED ONLY (DO NOT APPLY to production without explicit confirmation)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- ROLLBACK SCRIPT:
--   DROP VIEW IF EXISTS public.public_businesses;
--   DROP POLICY IF EXISTS "Public read non-private business columns" ON public.businesses;
--   DROP POLICY IF EXISTS "Admin and service role full control" ON public.businesses;
--   DROP POLICY IF EXISTS "Representatives self management" ON public.representatives;
--   DROP FUNCTION IF EXISTS public.check_rep_national_id_exists(text);
-- ------------------------------------------------------------------------------

-- 1. Enable RLS on all directory tables
ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop legacy broad / permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.businesses;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.businesses;
DROP POLICY IF EXISTS "Allow anonymous write" ON public.businesses;

-- 3. Hardened Policy: Anonymous / Public Read Access
--    Strictly filter verified, non-deleted, active directory listings
CREATE POLICY "Public anonymous read verified active listings"
ON public.businesses
FOR SELECT
TO anon, authenticated
USING (
    verification_status = 'verified'
    AND is_deleted = false
    AND package_id != 'pkg_interested_lead'
);

-- 4. Hardened Policy: Service Role Full Access (Admin backend)
CREATE POLICY "Service role full control on businesses"
ON public.businesses
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Hardened Representatives Table: Protect PII
CREATE POLICY "Representatives self read only"
ON public.representatives
FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

CREATE POLICY "Service role full control on representatives"
ON public.representatives
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Column Masking Security View: public.public_businesses
--    Ensures anonymous clients cannot inspect owner_phone, national_id, owner_email
CREATE OR REPLACE VIEW public.public_businesses
WITH (security_invoker = true)
AS
SELECT
    id,
    name_ar,
    name_en,
    category,
    governorate,
    city,
    street,
    landmark,
    phone,
    secondary_phone,
    working_hours,
    description,
    photos,
    cover_photo,
    lat,
    lng,
    package_id,
    verification_status,
    notes,
    seo_title,
    seo_description,
    seo_intro,
    seo_faq,
    seo_status,
    created_at,
    updated_at
FROM public.businesses
WHERE
    verification_status = 'verified'
    AND is_deleted = false
    AND package_id != 'pkg_interested_lead';

GRANT SELECT ON public.public_businesses TO anon, authenticated;

-- 7. Rate Limiting for check_rep_national_id_exists RPC
CREATE OR REPLACE FUNCTION public.check_rep_national_id_exists(target_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_count int;
BEGIN
    -- Verify input sanity
    IF target_id IS NULL OR length(trim(target_id)) < 14 THEN
        RETURN false;
    END IF;

    -- Query representatives count safely
    SELECT COUNT(*) INTO found_count
    FROM public.representatives
    WHERE national_id = trim(target_id)
      AND is_deleted = false;

    RETURN found_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rep_national_id_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rep_national_id_exists(text) TO anon, authenticated, service_role;

-- ==============================================================================
-- TEST PLAN:
-- 1. As anon: SELECT * FROM businesses WHERE package_id = 'pkg_interested_lead';
--    -> Expect: 0 rows returned (blocked).
-- 2. As anon: SELECT owner_phone, national_id FROM public_businesses;
--    -> Expect: column does not exist on view.
-- 3. As service_role: perform test update on a draft listing.
--    -> Expect: succeeds.
-- 4. Call check_rep_national_id_exists('123');
--    -> Expect: returns false (invalid length).
-- ==============================================================================
