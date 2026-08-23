/*
  Warnings:

  - You are about to drop the column `plan` on the `tenants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "plan";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'LOCAL',
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- DropEnum
DROP TYPE "SubscriptionPlan";
