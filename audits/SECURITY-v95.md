# v95 security review
Changed: QPay callback fails closed without secret; invoice input type/length validation; donation polling rate limit; token format validation; minimal database projection; no-store response; database update failure no longer reported as paid.
Validated locally: see test output supplied with delivery. No production payments or database mutations performed.
Run audits/security-readonly-v95.sql in Supabase SQL Editor to inspect actual deployed policies/grants. It does not change data.
Deployment requires QPAY_CALLBACK_SECRET to match callback configuration.
Remaining: actual RLS/grants (no connected Supabase tools available), secret history/rotation, distributed limiter, phone visibility/privacy, payment amount/currency verification against provider contract, real authorization and push tests.
Repository files can differ from the cumulative Windows project. This ZIP contains only listed changed files.
Build/deploy not performed in this environment.
