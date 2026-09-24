# UNAI Recruitment

A web application for managing membership applicants: applicants view recruitment openings and submit applications, admins manage recruitments and update application status.

This repository holds the full application: backend and web interface, built with Next.js on top of PostgreSQL (Supabase).

## Live Demo

- URL: [unairecruitment.blog](https://unairecruitment.blog)
- Admin login email: `daniadrian1311@gmail.com`
- Admin password: provided separately through the assignment submission form, not committed here.

## Status

| Part                                       | Status            |
| ------------------------------------------- | ----------------- |
| Database schema and migrations              | Done              |
| Model layer (entities and repositories)     | Done              |
| Controller layer (business logic)           | Done              |
| Routing adapters (Server Actions and Route Handlers) | Done      |
| Unit and integration tests                  | Done              |
| View layer (screens and components)         | Done (2026-09-24) |

## Stack

| Area               | Choice                                                                                |
| ------------------- | -------------------------------------------------------------------------------------- |
| Framework           | Next.js 16 (App Router) with strict TypeScript                                         |
| Runtime             | Node.js 24 (Active LTS)                                                                |
| Database            | PostgreSQL on Supabase, accessed from the server via Prisma 7 with the `pg` driver adapter |
| File storage        | Supabase Storage, private buckets `cv` and `attachments`                               |
| Authentication      | Custom: Argon2id, database-backed sessions, httpOnly cookie                            |
| Email               | Nodemailer over Gmail SMTP for forgot-password OTP                                     |
| UI                  | Tailwind CSS 4, Radix primitives (shadcn/ui style), lucide-react, Recharts              |
| Testing             | Vitest                                                                                  |
| Hosting             | Vercel, region `sin1`                                                                   |

## Architecture

Monolith following the MVC pattern. Dependencies flow in one direction:

```
routing (src/app) -> Controller -> Repository -> Infra (data clients)
```

| Folder                     | Contents                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/app/`                 | Thin routing adapters: pages, layouts, Server Actions and Route Handlers. Only call controllers.     |
| `src/views/`               | Screens (one per route) and components. Screens are async Server Components that call controllers.  |
| `src/controllers/`         | Business logic: validation, status rules, orchestration, translating errors into user-facing messages. |
| `src/models/entities/`     | Domain data shapes, no logic.                                                                        |
| `src/models/repositories/` | The only layer that touches the database, storage, and SMTP.                                        |
| `src/types/`               | Write payloads (`inputs/`) and read models per domain.                                               |
| `src/utils/`                | Pure functions: status transition tables, CSV builders, file constants, identity policy.             |
| `src/libs/`                 | Third-party client configuration: Prisma, Supabase Storage, session cookies, mailer, environment.    |
| `public/brand/`             | UNA logo and emblem.                                                                                 |
| `prisma/`                   | Schema, migrations, and admin account seed.                                                          |

Layer boundaries are enforced by ESLint (`no-restricted-imports`) and the `npm run audit:layers` script.

## Setup

The app uses two environments, each with its own environment file:

| Environment          | Database                            | Env file           | Used for                                    |
| ---------------------- | ------------------------------------ | -------------------- | --------------------------------------------- |
| Development and tests | Local PostgreSQL                     | `.env`               | Running the app, migrations, and integration tests |
| Production             | Supabase project (`ap-southeast-1`) | `.env.production`    | The live deployment and grading                |

The Supabase free tier only allows two active projects, so the single Supabase project is used for production while the development database runs locally. Neither env file is committed to version control.

Prerequisites: Node.js 24 (see `.nvmrc`), npm, and a local PostgreSQL instance.

### Development (local PostgreSQL)

1. **Install dependencies**

    ```bash
    npm install
    ```

2. **Create a local database** named `unairecruitment_dev`.

3. **Fill in `.env`.** Copy `.env.example` to `.env`. Set `DATABASE_URL` and `DIRECT_URL` to the same URL, e.g. `postgresql://<user>:<password>@localhost:5432/unairecruitment_dev`, plus `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. `SUPABASE_*` and `SMTP_*` can stay empty: the OTP will be printed to the console instead.

4. **Run migrations and seed**

    ```bash
    npm run db:deploy
    npm run db:seed
    ```

5. **Run the app**

    ```bash
    npm run dev
    ```

### Production (Supabase)

1. **Create a Supabase project** in the `ap-southeast-1` region (Southeast Asia, Singapore).

2. **Create the `prisma` database user.** Open the Dashboard, SQL Editor, then run the contents of [`scripts/createPrismaUser.sql`](scripts/createPrismaUser.sql) after replacing the placeholder password. This user has `BYPASSRLS` because every table uses RLS without a policy.

3. **Fill in `.env.production`.** Special characters in the password must be URL-encoded in the connection string.

    | Name                                                                 | Notes                                                                                                                                                                                                                   |
    | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `DATABASE_URL`                                                        | Connect, Transaction pooler (port 6543), with user `prisma.<project-ref>`. Used at runtime.                                                                                                                           |
    | `DIRECT_URL`                                                          | Connect, Session pooler (port 5432), with the same user. Used for migrations and seeding.                                                                                                                             |
    | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`                           | Server-side access to Storage. The service-role key never reaches the browser.                                                                                                                                        |
    | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`   | Gmail SMTP for the OTP. Required in production. Use a project-specific Gmail account (not personal) with 2-step verification and an App Password as `SMTP_PASSWORD`, port `465`, `SMTP_FROM` equal to `SMTP_USER`.   |
    | `CRON_SECRET`                                                          | Validates the caller of `/api/cron`.                                                                                                                                                                                   |
    | `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`                         | Initial admin account created by the seed.                                                                                                                                                                             |

4. **Run migrations, set up Storage, check the connection, then seed.** Point commands at the production file via `DOTENV_CONFIG_PATH`.

    ```bash
    # bash
    DOTENV_CONFIG_PATH=.env.production npm run db:deploy
    DOTENV_CONFIG_PATH=.env.production npm run storage:setup
    DOTENV_CONFIG_PATH=.env.production npm run db:check
    DOTENV_CONFIG_PATH=.env.production npm run db:seed
    DOTENV_CONFIG_PATH=.env.production npm run storage:check
    DOTENV_CONFIG_PATH=.env.production npm run smtp:check
    ```

    ```powershell
    # PowerShell
    $env:DOTENV_CONFIG_PATH = '.env.production'
    npm run db:deploy; npm run storage:setup; npm run db:check; npm run db:seed; npm run storage:check; npm run smtp:check
    Remove-Item Env:DOTENV_CONFIG_PATH
    ```

    The second migration enables Row Level Security on every table without a policy, so tables cannot be reached through the Supabase Data API. Authorization is enforced by server code instead.

    `storage:setup` creates or updates two private buckets idempotently:

    | Bucket        | Size limit | Allowed types      |
    | ------------- | ---------- | ------------------- |
    | `cv`          | 3 MB       | `application/pdf`   |
    | `attachments` | 3 MB       | any                  |

    `db:check` is read-only: it checks the runtime connection through the pooler, the eight tables, RLS, migrations, and the admin account count, without printing credentials.

    `storage:check` tests Storage end-to-end through the `FileRepository` the app uses: uploads a test PDF owned by the admin account, downloads it via a signed URL, confirms the public URL is rejected, confirms the bucket rejects non-PDF types and files over 3 MB, then always deletes the test file. Requires an admin account (run `db:seed` first).

    `smtp:check` tests SMTP end-to-end through `AuthController.submitForgotPassword`, the actual UC-03 code path: checks the SMTP connection and authentication, then sends a real OTP to the admin account's email. Requires an admin account and `SMTP_*` to be filled in; check the admin's inbox to confirm the OTP actually arrives.

    **Note on `.env.production`.** Next.js itself loads `.env.production` during `next build` and `next start`. That means running `npm run build` and `npm start` on a local machine uses the **production** database and Storage; use `npm run dev` to work against the local database. This file is git-ignored, so it is not deployed to Vercel; there, values are set through the project settings instead.

## Commands

| Command                     | Purpose                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `npm run dev`                | Run the development server.                                                            |
| `npm run build`              | Production build.                                                                      |
| `npm run typecheck`          | `tsc --noEmit`.                                                                          |
| `npm run lint`                | ESLint, including layer-boundary rules.                                                |
| `npm run audit:layers`       | Check for MVC layer-boundary violations.                                               |
| `npm test`                    | Unit tests. Does not load `.env` and does not touch the database.                      |
| `npm run test:integration`   | Integration tests against local PostgreSQL. Rejects non-local hosts. See the warning below. |
| `npm run verify`              | Runs typecheck, lint, layer audit, and unit tests together.                            |
| `npm run db:deploy`          | Apply migrations.                                                                       |
| `npm run db:seed`             | Create or update the admin account from environment variables.                         |
| `npm run db:check`            | Read-only connection and schema check; safe for production.                            |
| `npm run storage:setup`      | Create or update the `cv` and `attachments` Storage buckets.                            |
| `npm run storage:check`      | End-to-end Storage test with a test file that is always deleted afterward; safe for production. |
| `npm run smtp:check`          | End-to-end SMTP test, sending a real OTP through the UC-03 code path; safe for production. |

**Integration test warning.** `npm run test:integration` truncates every application table (`TRUNCATE`) before each test, so it must only run against local PostgreSQL. `vitest.setup.ts` refuses to run it unless the `DATABASE_URL` host is `localhost`, `127.0.0.1`, or `::1`, with no exceptions. Run `npm run db:seed` again afterward to restore the local admin account.

## Backend surface

Forms use Server Actions, while uploads, downloads, exports, and the cron job use Route Handlers.

**Server Actions** (`src/app/actions/`)

| Action                                        | Use case                              |
| ---------------------------------------------- | -------------------------------------- |
| `registerAction`                              | UC-01 Register                        |
| `loginAction`                                 | UC-02 Login                           |
| `forgotPasswordAction`, `resetPasswordAction` | UC-03 Forgot Password                 |
| `logoutAction`                                | UC-04 Logout                          |
| `saveRecruitmentAction`                       | UC-10 Add and UC-11 Edit Recruitment  |
| `submitApplicationAction`                     | UC-07 Fill Application Form           |
| `saveStatusAction`                            | UC-14 Change Applicant Status         |

**Route Handlers**

| Method and route                                   | Purpose                                                                                                      | Status codes            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `POST /api/uploads`                                 | Upload a single file (CV or extra field file), 3 MB max.                                                     | 201, 400, 401, 403, 413 |
| `GET /admin/files/:id?application=:applicationId`   | Redirects an admin to a short-lived signed URL.                                                               | 302, 400, 401, 403, 404 |
| `GET /admin/applicants/export`                      | Downloads a CSV of applicant data matching the active filters.                                                | 200, 401, 403           |
| `GET /api/cron`                                     | Daily maintenance: removes orphaned files and expired sessions. Requires `Authorization: Bearer <CRON_SECRET>`. | 200, 401                |

Data reads (recruitment lists, details, applicant lists, dashboard) are done by screens through controllers, not through dedicated HTTP endpoints.

## Interface

`/` sends admins to the dashboard and everyone else to the list of open roles.

| Area      | Routes                                                                                                                                             | Who can open it |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Public    | `/recruitments`, `/recruitments/:id`, `/login`, `/register`, `/forgot-password`                                                                    | Everyone        |
| Applicant | `/recruitments/:id/apply`, `/my-applications`                                                                                                      | Applicants      |
| Admin     | `/admin/dashboard`, `/admin/recruitments`, `/admin/recruitments/new`, `/admin/recruitments/:id/edit`, `/admin/applicants`, `/admin/applicants/:id` | Admins          |

A guest who opens a protected page is sent to `/login?next=…` and returns there after signing in. In local development, the forgot-password OTP is printed to the `npm run dev` console. File uploads need Supabase Storage, so a successful upload only works with the production environment variables.

## Database

Eight tables: `users`, `sessions`, `password_reset_otps`, `recruitments`, `recruitment_fields`, `applications`, `application_answers`, `stored_files`.

Key guarantees enforced at the database level:

| Constraint                                                                                | Rule                                                                                          |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `applications (user_id, recruitment_id)` unique                                             | One application per applicant per recruitment.                                                |
| `recruitment_fields (recruitment_id, name)` unique                                          | Extra field names cannot be duplicated within the same recruitment.                           |
| `application_answers.field_id` nullable, `ON DELETE SET NULL`                               | Old answers remain intact with a snapshot of the field's name and type even if it is deleted. |
| `applications.cv_file_id` and `application_answers.file_id` unique, `ON DELETE RESTRICT`     | A file can only be referenced by one application and cannot be deleted while still in use.    |

## Security

- Passwords are stored as Argon2id hashes and are never returned to the view layer.
- Database-backed sessions: a random 32-byte token is sent via an httpOnly cookie, only its SHA-256 hash is stored, sessions last 7 days, and all sessions are terminated when the password changes.
- Forgot-password OTPs are 6 digits, stored as Argon2id hashes, valid for 10 minutes, single-use, allow at most 5 failed attempts, with a 60-second cooldown and a maximum of 5 requests per hour per email.
- Every admin action checks the role on the server, rather than relying on hiding UI elements.
- Uploads are validated server-side: 3 MB size limit, CVs must have a `.pdf` extension and the `%PDF-` byte signature. Files referenced when submitting an application must belong to the applicant and not already be used by another application.
- Buckets are private; files can only be opened by admins via short-lived signed URLs.
- All queries use Prisma with bound parameters; no SQL is built by concatenating user input.
- Credentials only come from environment variables and are never written into code or documentation.
- Failure responses only contain user-safe messages; technical details go to server logs only.

## Deployment (Vercel)

1. Connect the repository to a Vercel project.
2. Fill in environment variables under Settings, Environment Variables for the Production and Preview environments.
3. `vercel.json` already sets the function region to `sin1` and a daily cron schedule for `/api/cron`.
4. Make sure the Vercel project's Node version is 24, matching `engines` in `package.json`.
5. Set up the production Supabase project following the Setup, Production section above. Integration tests never run against production.

## Use of AI

As required for submission, here is a summary of how AI was used on this project.

| Item                        | Notes                                                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tool                          | Claude Code (Claude Sonnet 5 model).                                                                                                                                                                                         |
| Scope                         | Implementing the backend and view layer in this repository.                                                                                                                                                                |
| AI Contribution               | Implementation, under direction.                                                                                                                                                                                            |
| My Role                       | Defined the requirements, architecture, and every design decision (monolith/MVC, stack, OTP and session policy, password policy, file size limits, scope). Directed each implementation step, reviewed and verified every AI output, and made every final call.               |
| Verification                  | AI output was verified with typecheck, ESLint, layer-boundary audit, unit tests, integration tests, and a production build. Layer boundaries were also tested negatively with trial files to confirm the rule was actually active. |
