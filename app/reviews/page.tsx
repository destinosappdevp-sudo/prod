import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    // Get user role
    const userRecord = await (prisma as any).user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    let reviews: any[] = [];

    if (userRecord?.role === "HOST") {
      // HOST: Get reviews received (on their properties)
      reviews = await (prisma as any).review.findMany({
        where: {
          Home: {
            userId: user.id,
          },
        },
        include: {
          User: {
            select: {
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          Home: {
            select: {
              title: true,
              photo: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // GUEST: Get reviews given
      reviews = await (prisma as any).review.findMany({
        where: {
          userId: user.id,
        },
        include: {
          Home: {
            select: {
              title: true,
              photo: true,
            },
          },
          User: {
            select: {
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

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

          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex text-2xl">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < Math.round(parseFloat(avgRating as any))
                          ? "text-yellow-400"
                          : "text-slate-300"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-2xl font-bold">{avgRating}</span>
              </div>
              <div>
                <p className="text-slate-600">
                  Basado en {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
              <Star className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 mb-2">
                {userRecord?.role === "HOST"
                  ? "Aún no tienes reseñas"
                  : "Aún no has dejado reseñas"}
              </p>
              <p className="text-sm text-slate-400">
                {userRecord?.role === "HOST"
                  ? "Tus huéspedes podrán calificarte después de completar sus reservas"
                  : "Podrás dejar reseñas después de completar tus reservas"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {review.User?.profileImage && (
                        <img
                          src={review.User.profileImage}
                          alt={review.User.firstName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {review.User?.firstName} {review.User?.lastName}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {new Date(review.createdAt).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < review.rating
                              ? "text-yellow-400"
                              : "text-slate-300"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {review.Home && (
                    <p className="text-sm text-slate-600 mb-3">
                      Sobre: <span className="font-semibold">{review.Home.title}</span>
                    </p>
                  )}

                  <p className="text-slate-700 mb-4">{review.comment}</p>

                  {review.hostReply && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        Respuesta del anfitrión:
                      </p>
                      <p className="text-slate-600 text-sm">{review.hostReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching reviews:", error);
    redirect("/my-dashboard");
  }
}
