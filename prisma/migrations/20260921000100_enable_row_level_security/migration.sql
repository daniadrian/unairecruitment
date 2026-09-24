-- KA-08 and 06 section 3: Row Level Security is enabled on every table WITHOUT any policy.
-- This blocks access through the Supabase Data API for both the anon and authenticated roles.
-- The application connects with a role that bypasses RLS (Prisma through the pooler), so
-- authorization is still enforced by server code (L-5), not by policies.
-- FORCE ROW LEVEL SECURITY is deliberately not used so the table owner role keeps working.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_reset_otps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recruitment_fields" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "application_answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stored_files" ENABLE ROW LEVEL SECURITY;
