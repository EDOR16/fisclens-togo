-- CreateEnum
CREATE TYPE "SeveriteAnomalie" AS ENUM ('INFO', 'AVERTISSEMENT', 'BLOQUANT');

-- CreateEnum
CREATE TYPE "StatutAnomalie" AS ENUM ('A_EXAMINER', 'IGNOREE', 'CORRIGEE');

-- CreateEnum
CREATE TYPE "TypeAnomalie" AS ENUM ('ECRITURE_DESEQUILIBREE', 'NUMEROTATION_NON_CONTINUE', 'COMPTE_HORS_MAPPING_JOURNAL', 'FACTURE_NUMERO_DUPLIQUE', 'FACTURE_TROU_SEQUENCE', 'FACTURE_NIF_MANQUANT_OU_INVALIDE', 'ECART_TVA_DECLAREE_VS_COLLECTEE', 'PARTIE_LIEE_PRIX_ANORMAL');

-- AlterTable
ALTER TABLE "ecritures" ADD COLUMN     "documentName" TEXT,
ADD COLUMN     "documentUrl" TEXT;

-- CreateTable
CREATE TABLE "csp_evaluations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "exercice" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'CONFORME',
    "hashCertificat" TEXT NOT NULL,
    "detailsJson" TEXT NOT NULL,
    "recommendations" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "csp_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csp_attachments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "evaluationId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "fileSize" INTEGER NOT NULL,
    "fileData" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "notes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "csp_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomalies_detectees" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "TypeAnomalie" NOT NULL,
    "severite" "SeveriteAnomalie" NOT NULL,
    "description" TEXT NOT NULL,
    "statut" "StatutAnomalie" NOT NULL DEFAULT 'A_EXAMINER',
    "justification" TEXT,
    "ecritureId" TEXT,
    "factureRef" TEXT,
    "metadata" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "anomalies_detectees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "csp_evaluations_tenantId_exercice_idx" ON "csp_evaluations"("tenantId", "exercice");

-- CreateIndex
CREATE INDEX "csp_attachments_tenantId_idx" ON "csp_attachments"("tenantId");

-- CreateIndex
CREATE INDEX "csp_attachments_evaluationId_idx" ON "csp_attachments"("evaluationId");

-- CreateIndex
CREATE INDEX "anomalies_detectees_tenantId_statut_idx" ON "anomalies_detectees"("tenantId", "statut");

-- CreateIndex
CREATE INDEX "anomalies_detectees_tenantId_type_idx" ON "anomalies_detectees"("tenantId", "type");

-- AddForeignKey
ALTER TABLE "csp_evaluations" ADD CONSTRAINT "csp_evaluations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csp_attachments" ADD CONSTRAINT "csp_attachments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csp_attachments" ADD CONSTRAINT "csp_attachments_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "csp_evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies_detectees" ADD CONSTRAINT "anomalies_detectees_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies_detectees" ADD CONSTRAINT "anomalies_detectees_ecritureId_fkey" FOREIGN KEY ("ecritureId") REFERENCES "ecritures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
