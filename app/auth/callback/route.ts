import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Create or update user in database
      const userExists = await prisma.user.findUnique({
        where: { id: data.user.id },
      });

      if (!userExists) {
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email ?? "",
            firstName: data.user.user_metadata?.given_name ?? data.user.user_metadata?.full_name ?? "User",
            lastName: data.user.user_metadata?.family_name ?? "",
            profileImage: data.user.user_metadata?.avatar_url ?? 
              `https://avatar.vercel.sh/${data.user.user_metadata?.given_name ?? "user"}`,
          },
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
