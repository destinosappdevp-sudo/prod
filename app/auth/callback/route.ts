import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import {
  ensureAtLeastOneSuperadmin,
  getRoleForNewUserBootstrap,
} from "@/app/lib/user-role-bootstrap";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (code) {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }

      if (!error && data.user) {
        try {
          // Create or update user in database
          const userExists = await prisma.user.findUnique({
            where: { id: data.user.id },
          });

          if (!userExists) {
            const initialRole = await getRoleForNewUserBootstrap();
            await prisma.user.create({
              data: {
                id: data.user.id,
                email: data.user.email ?? "",
                firstName: data.user.user_metadata?.given_name ?? data.user.user_metadata?.full_name ?? "User",
                lastName: data.user.user_metadata?.family_name ?? "",
                profileImage: data.user.user_metadata?.avatar_url ?? 
                  `https://avatar.vercel.sh/${data.user.user_metadata?.given_name ?? "user"}`,
                role: initialRole,
              },
            });
          }

          await ensureAtLeastOneSuperadmin(data.user.id);

          const userRecord = await prisma.user.findUnique({
            where: { id: data.user.id },
            select: { role: true },
          });

          const isDefaultNext = next === "/" || next === "";
          const isAdminRole =
            userRecord?.role === "ADMIN" || userRecord?.role === "SUPERADMIN";
          const destination = isAdminRole && isDefaultNext ? "/admin" : next;

          return NextResponse.redirect(`${origin}${destination}`);
        } catch (dbError) {
          console.error("Error creating/updating user in database:", dbError);
          return NextResponse.redirect(`${origin}/auth/auth-code-error?error=database`);
        }
      }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  } catch (error) {
    console.error("Error in callback route:", error);
    return NextResponse.redirect(`${new URL(request.url).origin}/auth/auth-code-error?error=server`);
  }
}
