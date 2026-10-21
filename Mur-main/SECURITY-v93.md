# Security v93
Implemented: owner/project-scoped privileged Storage deletion; abort account cleanup on content lookup errors; bounded in-memory rate limiter; allowlisted push destinations at registration and delivery.
No SQL required for this patch. Deploy required. Test Chrome, Firefox, Safari and Edge push delivery after installation; unsupported push providers are rejected.
Remaining audit: deployed RLS policies and grants, secret rotation/history, public contact-data exposure, dependency audit, distributed rate limiting, push subscription ownership/races, authenticated end-to-end authorization tests.
This is a code hardening patch, not a complete security certification. No production data was modified. Build/deploy not run here.
SSRF reference: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
