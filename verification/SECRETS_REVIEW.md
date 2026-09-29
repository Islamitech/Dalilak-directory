# Secrets check

Actual hardcoded credential is opaque publishable-format, not JWT. Local parser found no JWT payload. Role claim: unavailable (not encoded). Expiry: unavailable (not encoded). Do not assert anon/service_role or expiry from an opaque token. No credential sent to a decoding website or remote service.

Correction: initial JWT-only scanner missed this format; expanded scan below. A local read accidentally printed the public-format literal; it is omitted from all written verification reports.

Heuristic scan excludes node_modules/.git; includes baseline/builds. 401 text files scanned. Candidates only, values redacted; no live credential or RLS validation.

- .env:3 [REDACTED]
- .env:5 [REDACTED]
- .env:6 [REDACTED]
- .env.example:6 [REDACTED]
- dist/assets/index-CbmvIAUn.js:7 [REDACTED]
- src/server/directoryData.ts:4 [REDACTED]
- src/services/supabaseClient.ts:10 [REDACTED]
- verification/baseline/.env.example:6 [REDACTED]
- verification/baseline/api/biz-og.ts:5 [REDACTED]
- verification/baseline/api/share.ts:6 [REDACTED]
- verification/baseline/api/sitemap.ts:4 [REDACTED]
- verification/baseline/src/services/supabaseClient.ts:10 [REDACTED]
