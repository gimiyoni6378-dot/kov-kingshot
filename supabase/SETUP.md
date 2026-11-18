# KOV gallery setup

1. In the matching Supabase project, open SQL Editor → New query. Paste `gallery.sql` and Run.
2. Open Authentication → URL Configuration. Set Site URL to `https://gimiyoni6378-dot.github.io/kov-kingshot/gallery.html` and add the same exact URL to Redirect URLs. Save.
3. Leave email confirmation enabled in Authentication → Providers → Email. For public use, configure a transactional email provider under Authentication's SMTP settings; Supabase's default email service restricts delivery and is not suitable for arbitrary member signups.
4. Open `gallery.html`, sign up with a real email address, confirm the email, log in, publish a JPG/PNG/WebP (up to 5 MB), and delete your own post. Test with a second user that another member's delete action is unavailable and unauthorized requests are rejected by RLS.

Only the public publishable key belongs in `gallery-config.js`. Never commit a database password, secret, service_role key, or SMTP credential.

Public visitors can read all published posts and images; authenticated members may insert posts for their own user ID, upload into their own folder, and delete their own posts/files. Posts cannot be updated via the API. Nicknames are display labels, not verified game identities. Empty galleries contain no fabricated posts. The browser renders user text with textContent.

Account deletion cascades posts but requires separate cleanup of storage objects. This version has no account-deletion UI or admin moderation UI. Operators can moderate in the Supabase dashboard. Email delivery, usage limits, storage cleanup and moderation should be configured for the intended membership size.
