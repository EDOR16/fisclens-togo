-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "address" TEXT,
ADD COLUMN     "centreFiscal" TEXT DEFAULT 'DPME Lomé',
ADD COLUMN     "city" TEXT DEFAULT 'Lomé',
ADD COLUMN     "cnssNumber" TEXT,
ADD COLUMN     "formeJuridique" TEXT DEFAULT 'SARL',
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "rccm" TEXT,
ADD COLUMN     "secteurActivite" TEXT;
