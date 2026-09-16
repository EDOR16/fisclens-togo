-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TypeAnomalie" ADD VALUE 'COMPTE_SYSCOHADA_INEXISTANT';
ALTER TYPE "TypeAnomalie" ADD VALUE 'TAUX_SOCIAL_INCORRECT';
ALTER TYPE "TypeAnomalie" ADD VALUE 'TAUX_RETENUE_INCORRECT';

-- CreateTable
CREATE TABLE "FournisseurNifRef" (
    "tenantId" TEXT NOT NULL,
    "nif" TEXT NOT NULL,
    "nom" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "FournisseurNifRef_tenantId_nif_key" ON "FournisseurNifRef"("tenantId", "nif");
