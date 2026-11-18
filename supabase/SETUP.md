# KOV gallery setup

1. In the matching Supabase project, open SQL Editor → New query. Paste `gallery.sql` and Run.
2. Open Authentication → URL Configuration. Set Site URL to `https://gimiyoni6378-dot.github.io/kov-kingshot/gallery.html` and add the same exact URL to Redirect URLs. Save.
3. Leave email confirmation enabled in Authentication → Providers → Email. For public use, configure a transactional email provider under Authentication's SMTP settings; Supabase's default email service restricts delivery and is not suitable for arbitrary member signups.
4. Open `gallery.html`, sign up with a real email address, confirm the email, log in, publish a JPG/PNG/WebP (up to 5 MB), and delete your own post. Test with a second user that another member's delete action is unavailable and unauthorized requests are rejected by RLS.

Only the public publishable key belongs in `gallery-config.js`. Never commit a database password, secret, service_role key, or SMTP credential.

Public visitors can read all published posts and images; authenticated members may insert posts for their own user ID, upload into their own folder, and delete their own posts/files. Posts cannot be updated via the API. Nicknames are display labels, not verified game identities. Empty galleries contain no fabricated posts. The browser renders user text with textContent.

Account deletion cascades posts but requires separate cleanup of storage objects. This version has no account-deletion UI or admin moderation UI. Operators can moderate in the Supabase dashboard. Email delivery, usage limits, storage cleanup and moderation should be configured for the intended membership size.

## Points, attendance and comments

Run `002-points.sql` after `gallery.sql`. This migration includes existing posts exactly once. It is safe to rerun and preserves all point history.

- Posts +10, comments +1, explicit attendance check-in +1 per Asia/Seoul calendar date.
- Content awards run in the same database transaction as the content insert. Deletion adds an equal negative event; cascading comment deletions reverse each comment author's point. Reversed awards remain in private point history.
- Point events cannot be inserted, updated or deleted by clients. Authenticated RPCs derive identity from `auth.uid()` and never accept a target user or amount. Only the owner can read their own ledger and dashboard.
- There is no daily post/comment reward cap in this version. Attendance is capped at one/day by a unique key, including concurrent requests. Deleting an account removes its private ledger; this is separate from gallery storage cleanup noted above.
- `ranks.js` controls the display thresholds: 100P per level, then 1,000P per TG tier. Lv.30 = 2,900P, TG1 = 3,900P, TG10 = 12,900P. Changing rank steps recalculates all activity ranks while preserving balances. Website ranks do not represent actual in-game castle levels.
- Dashboard counts reflect currently published content; points history includes awards and reversals. Check-in uses the database clock; tab focus refreshes the dashboard after a new KST day or activity in another tab.

Checks: `node tests/ranks.mjs`. For isolated PostgreSQL integration checks, create a DISPOSABLE database and run `tests/points-bootstrap.sql`, `supabase/002-points.sql` twice, then `tests/points.sql` using `psql -v ON_ERROR_STOP=1`. These test files create roles and test accounts and must never run against production. The bootstrap models Supabase JWT identity/RLS; production Auth and Storage are not replaced by it.
