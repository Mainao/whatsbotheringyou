-- DropIndex
DROP INDEX "stars_expires_at_idx";

-- AlterTable
ALTER TABLE "stars" DROP COLUMN "expires_at";
