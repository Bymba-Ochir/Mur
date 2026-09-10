> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# v87 incremental patch
Apply over the current project after v86. This is not a complete project archive.

Implemented: adoption/sitting guest form gates; negotiable/null versus free/zero price; daily price hint matching the existing booking calculation; adoption request login button; English empty translation fallback; singular relative times; theme labels; adoption URL filters and bounded internal listing return links.

No database migration or new dependency.

Verify locally: npm run typecheck; npm run lint; npm test; npm run build.

Still pending: production deployment; mobile visual/keyboard checks; authenticated upload/save/edit/delete/messages flows; actual clinic delivery and current hours verification; production test data/age cleanup after owner review; AI/QPay/push/cron end-to-end delivery; localized browser metadata and remaining skip-link labels. No real records were changed, no payments or messages were sent. Production build was not run in this environment because of the earlier automatic approval restriction concerning Sentry transfers.

Return links preserve filters; adoption scroll/pagination restoration remains a separate follow-up.
