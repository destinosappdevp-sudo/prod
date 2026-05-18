import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      device_id,
      device_name,
      os,
      browser,
      ip_address,
      location,
    } = body;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Try to upsert session, but don't fail if table doesn't exist
    try {
      const { error: sessionError } = await supabase
        .from("usersessions")
        .upsert(
          {
            user_id: user.id,
            device_id,
            device_name,
            os,
            browser,
            ip_address,
            location,
            last_active: new Date().toISOString(),
            created_at: new Date().toISOString(),
            is_active: true,
          },
          {
            onConflict: "user_id,device_id",
          }
        );

      if (sessionError) {
        console.warn("[Session Tracking] Supabase upsert warning:", sessionError.message);
        // Still return success - this is non-critical
      }
    } catch (tableError) {
      console.warn("[Session Tracking] Table may not exist:", tableError);
      // Still return success - this is non-critical
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Session Tracking] Error:", error);
    // Return success anyway - session tracking is non-critical
    return NextResponse.json({ success: true });
  }
}
