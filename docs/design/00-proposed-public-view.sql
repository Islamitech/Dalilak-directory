-- =============================================================================
-- Proposed Public View: public_businesses_view
-- Purpose: Safely project public business information without exposing raw CRM notes
-- Status: PROPOSED ONLY (NOT APPLIED) - Code change to drop notes from SELECT is BLOCKED
-- =============================================================================

CREATE OR REPLACE VIEW public.public_businesses_view AS
SELECT
  b.id,
  b.name_ar,
  b.name_en,
  b.category,
  b.governorate,
  b.city,
  b.street,
  b.landmark,
  b.phone,
  b.secondary_phone,
  b.working_hours,
  b.description,
  b.photos,
  b.cover_photo,
  b.lat,
  b.lng,
  b.verification_status,
  b.package_id,
  b.package_name,
  b.package_price,
  b.created_at,
  b.updated_at,
  -- Safe JSON extracts from notes (eliminates raw CRM notes exposure)
  (b.notes::jsonb->>'customDirectoryUrl') AS custom_directory_url,
  (b.notes::jsonb->>'publishedStatus') AS published_status,
  (b.notes::jsonb->>'googleMapsUrl') AS google_maps_url,
  (b.notes::jsonb->>'repLocationUrl') AS rep_location_url,
  (b.notes::jsonb->>'googlePlaceId') AS google_place_id,
  ((b.notes::jsonb->>'googleRating')::numeric) AS google_rating,
  ((b.notes::jsonb->>'googleReviewsCount')::numeric) AS google_reviews_count,
  ((b.notes::jsonb->>'googleRatingEnabled')::boolean) AS google_rating_enabled,
  (b.notes::jsonb->'videos') AS videos,
  ((b.notes::jsonb->>'isFeeExempt')::boolean) AS is_fee_exempt,
  (b.notes::jsonb->>'feeExemptionReason') AS fee_exemption_reason,
  ((b.notes::jsonb->>'viewsCount')::numeric) AS views_count,
  ((b.notes::jsonb->>'favoriteCount')::numeric) AS favorite_count
FROM public.businesses b
WHERE
  b.verification_status = 'verified'
  AND b.package_id <> 'pkg_interested_lead'
  AND (b.notes::jsonb->>'publishedStatus' IS NULL OR b.notes::jsonb->>'publishedStatus' = 'published')
  AND (b.notes::jsonb->>'isDeleted' IS NULL OR (b.notes::jsonb->>'isDeleted')::boolean = false);
