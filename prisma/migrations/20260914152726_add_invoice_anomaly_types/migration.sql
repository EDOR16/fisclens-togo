-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TypeAnomalie" ADD VALUE 'TVA_INCOHERENTE_AVEC_TAUX';
ALTER TYPE "TypeAnomalie" ADD VALUE 'LIGNE_MONTANT_INCOHERENT';
ALTER TYPE "TypeAnomalie" ADD VALUE 'FACTURE_IMAGE_DUPLIQUEE';
ALTER TYPE "TypeAnomalie" ADD VALUE 'NIF_NOM_INCOHERENT';
ALTER TYPE "TypeAnomalie" ADD VALUE 'MONTANT_ANORMAL_VS_HISTORIQUE';

-- CreateTable
CREATE TABLE "facture_image_hashes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "ecritureId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'OCR_SCAN',
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facture_image_hashes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "facture_image_hashes_tenantId_idx" ON "facture_image_hashes"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "facture_image_hashes_tenantId_hashSha256_key" ON "facture_image_hashes"("tenantId", "hashSha256");

-- AddForeignKey
ALTER TABLE "facture_image_hashes" ADD CONSTRAINT "facture_image_hashes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
