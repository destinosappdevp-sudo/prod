import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase.storage
      .from("images")
      .list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const images = data.map((file) => ({
      name: file.name,
      url: supabase.storage.from("images").getPublicUrl(file.name).data
        .publicUrl,
      createdAt: file.created_at,
    }));

    return NextResponse.json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Error fetching images" },
      { status: 500 }
    );
  }
}
