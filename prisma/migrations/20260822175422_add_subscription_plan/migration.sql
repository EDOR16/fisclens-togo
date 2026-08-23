-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'PRO', 'PREMIUM');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "plan" "SubscriptionPlan" NOT NULL DEFAULT 'STARTER';
