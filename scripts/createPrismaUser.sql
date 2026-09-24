-- KS-04: dedicated `prisma` user for Prisma Migrate and the application runtime connection.
-- Run it once per Supabase project in Dashboard > SQL Editor, before migrating.
-- Idempotent: safe to rerun when the role already exists (for example after an earlier
-- attempt failed on another line); its password is reset to the one written here.
--
-- 1. Replace <REPLACE_WITH_STRONG_PASSWORD> on the "prisma_password" line below with
--    a long random password. Only ONE place needs to change.
--    Never save a real password in this file (L-2).
-- 2. Use the user `prisma.<project-ref>` and that password in DATABASE_URL and DIRECT_URL.
--
-- BYPASSRLS is required because every table uses RLS without policies (KA-08):
-- Data API access is blocked, while server code can still read and write.
-- CREATEDB is used by Prisma Migrate for the shadow database during `prisma migrate dev`.

do $$
declare
    prisma_password constant text := '<REPLACE_WITH_STRONG_PASSWORD>';
begin
    if not exists (select from pg_catalog.pg_roles where rolname = 'prisma') then
        execute format('create user "prisma" with password %L bypassrls createdb', prisma_password);
    else
        execute format('alter user "prisma" with password %L bypassrls createdb', prisma_password);
    end if;
end
$$;

-- Keeps objects owned by `prisma` visible and manageable from the dashboard.
grant "prisma" to "postgres";

grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;

alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
