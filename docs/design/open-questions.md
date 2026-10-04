# Dalilak Directory Experience — Open Questions & Decision Log

This log records any ambiguities encountered during the prototype port, along with the authoritative decision applied based on the prototype specification (`docs/design/00-prototype-spec.md`) and owner directives.

| # | Question / Ambiguity | Default Spec Decision Applied | Status |
|---|---|---|:---:|
| 1 | Dropping `notes` column from Supabase SELECT vs breaking publishedStatus/videos | Retain `notes` in SELECT until `public_businesses_view` is deployed in Supabase (Rule 3) | BLOCKED (Per Owner Rule 3) |
| 2 | Rating & Review counts for unrated businesses | Do not fabricate 4.8 or 5.0 placeholders; render rating and review count only when verified in real business data | RESOLVED (Rule 6) |
| 3 | Operating hours open/closed status | Render green "مفتوح" or red "مغلق" badge only when working hours or explicit status exists in record | RESOLVED (Rule 6) |
| 4 | Offer chip rendering | Render offer pill/box only when active promotion text exists in business record | RESOLVED (Rule 6) |
