import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";

export default async function ReviewsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    // TODO: Fetch user reviews based on role (HOST or GUEST)
    // For HOST: reviews received
    // For GUEST: reviews given

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/my-dashboard"
              className="p-2 hover:bg-slate-200 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold">Reseñas</h1>
          </div>

          {/* TODO: Agregar contenido de reseñas */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <Star className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">Sistema de reseñas en desarrollo</p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching reviews:", error);
    redirect("/my-dashboard");
  }
}
