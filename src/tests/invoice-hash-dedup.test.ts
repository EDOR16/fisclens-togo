import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let testTenantId = "";

describe("Deduplication SHA-256 des images de facture (Section 7)", () => {
  beforeAll(async () => {
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: "Test Hash Dedup Corp",
          nif: "1000999999",
          regime: "REEL_NORMAL",
        },
      });
    }
    testTenantId = tenant.id;
  });

  afterAll(async () => {
    await prisma.factureImageHash.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.$disconnect();
  });

  it("Calcule un hash SHA-256 deterministe pour la meme image", () => {
    const imageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const h1 = createHash("sha256").update(imageBase64).digest("hex");
    const h2 = createHash("sha256").update(imageBase64).digest("hex");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it("Detecte un doublon via la contrainte unique tenantId+hashSha256", async () => {
    const fakeHash = createHash("sha256").update("test-image-001").digest("hex");

    // Premiere insertion
    await prisma.factureImageHash.create({
      data: {
        tenantId: testTenantId,
        hashSha256: fakeHash,
        source: "OCR_SCAN",
        fileName: "facture-001.png",
      },
    });

    // Deuxieme insertion avec le meme hash -> doit lever une erreur unique
    await expect(
      prisma.factureImageHash.create({
        data: {
          tenantId: testTenantId,
          hashSha256: fakeHash,
          source: "OCR_SCAN",
          fileName: "facture-001-duplicate.png",
        },
      })
    ).rejects.toThrow();
  });

  it("Trouve le hash existant via findUnique", async () => {
    const fakeHash = createHash("sha256").update("test-image-002").digest("hex");

    await prisma.factureImageHash.create({
      data: {
        tenantId: testTenantId,
        hashSha256: fakeHash,
        source: "MANUAL_UPLOAD",
      },
    });

    const found = await prisma.factureImageHash.findUnique({
      where: {
        tenantId_hashSha256: {
          tenantId: testTenantId,
          hashSha256: fakeHash,
        },
      },
    });

    expect(found).not.toBeNull();
    expect(found?.hashSha256).toBe(fakeHash);
  });
});