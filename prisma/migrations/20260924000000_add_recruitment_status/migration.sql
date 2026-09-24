-- AB-04 (revised 2026-09-24): a recruitment can now be opened or closed by the admin.
-- Existing rows default to OPEN, matching current behavior exactly (no visible change on deploy).

-- CreateEnum
CREATE TYPE "recruitment_status" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "recruitments" ADD COLUMN "status" "recruitment_status" NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX "recruitments_status_idx" ON "recruitments"("status");
