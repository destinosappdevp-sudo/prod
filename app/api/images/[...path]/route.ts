import { createAdminClient } from "@/app/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 3600;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: rawSegments } = await params;

  const segments = rawSegments.map((s) => decodeURIComponent(s));
  if (
    segments.length === 0 ||
    segments.some((s) => !s || s === "." || s === ".." || s.includes("\0"))
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  const storagePath = segments.join("/");

  const adminClient = createAdminClient();
  if (!adminClient) {
    return new NextResponse("Not configured", { status: 500 });
  }

  const { data, error } = await adminClient.storage
    .from("images")
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl, {
    status: 307,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
