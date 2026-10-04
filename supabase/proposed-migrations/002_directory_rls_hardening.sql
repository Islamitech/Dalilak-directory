-- Migration: 002_directory_rls_hardening.sql
-- Purpose: Hardens Row Level Security (RLS) on public.businesses and Supabase Storage bucket 'business-media'.
--          1. Blocks anonymous INSERT/UPDATE/DELETE from client browsers.
--          2. Restricts anonymous SELECT to verified, active listings (hiding leads, internal notes, and drafts).
--          3. Locks down media storage bucket against arbitrary anonymous file uploads.
-- Risk: Low-to-Medium. Direct client writes and direct anonymous storage uploads will be rejected by database policies.
--       Any administrative changes must be performed through verified service_role or server-side workflows.
-- Rollback:
--   DROP POLICY IF EXISTS "Public anonymous read verified listings" ON public.businesses;
--   DROP POLICY IF EXISTS "Service role full access on businesses" ON public.businesses;
--   DROP POLICY IF EXISTS "Public read business media" ON storage.objects;
--   DROP POLICY IF EXISTS "Service role upload business media" ON storage.objects;
--   ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;

-- 1. Enable Row Level Security on businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing permissive policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON public.businesses;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.businesses;
DROP POLICY IF EXISTS "Allow anonymous write" ON public.businesses;

-- 3. Policy: Public Anonymous Read Verified Listings Only
CREATE POLICY "Public anonymous read verified listings"
ON public.businesses
FOR SELECT
TO anon, authenticated
USING (
    verification_status = 'verified' 
    AND package_id != 'pkg_interested_lead'
);

-- 4. Policy: Service Role Full Access (Serverless / Admin Backend)
CREATE POLICY "Service role full access on businesses"
ON public.businesses
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Hardening Storage Bucket 'business-media'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'business-media',
    'business-media',
    true,
    5242880, -- 5 MB ceiling
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS: Public Read Only
DROP POLICY IF EXISTS "Public read business media" ON storage.objects;
CREATE POLICY "Public read business media"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'business-media');

-- Storage RLS: Service Role / Admin Upload Only (Blocks Browser Uploads)
DROP POLICY IF EXISTS "Service role upload business media" ON storage.objects;
CREATE POLICY "Service role upload business media"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (
    bucket_id = 'business-media'
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp'))
);
