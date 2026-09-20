import { NextResponse } from "next/server";

/**
 * GET/POST /api/v1/bi/import/upload-token
 * Endpoint legacy Vercel Blob — supprimé car Vercel Blob n'est plus configuré.
 * L'import Excel se fait désormais directement via FormData sur /api/v1/bi/import/unified.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "DEPRECATED",
      message:
        "L'upload via token Vercel Blob n'est plus supporté. Utilisez l'import Excel unifié via FormData sur /api/v1/bi/import/unified.",
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: "DEPRECATED",
      message:
        "L'upload via token Vercel Blob n'est plus supporté. Utilisez l'import Excel unifié via FormData sur /api/v1/bi/import/unified.",
    },
    { status: 410 }
  );
}