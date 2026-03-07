import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import HostDashboardClient from "@/app/components/HostDashboardClient";
import GuestDashboardClient from "@/app/components/DashboardClient_min";
import { createAirbnbHome } from "@/app/action";

async function getHostDashboardData(userId: string) {
  noStore();
  const prismaAny = prisma as any;
  
  type ListingRow = {
    id: string;
    country: string | null;
    municipality: string | null;
    photo: string | null;
    title: string | null;
    description: string | null;
    price: number | null;
    publishStatus?: string;
    approvalRejectionReason?: string;
    createdAt?: Date;
  };

  const [
    listings,
    reservations,
    totalProperties,
    activeReservations,
    pendingReservations,
    confirmedRevenueAgg,
    pendingRevenueAgg,
    serviceFeeAgg,
    ratingAgg,
  ] = await Promise.all([
    prismaAny.home.findMany({
      where: {
        userId,
        addedCategory: true,
        addedDescription: true,
        addedLocation: true,
      },
      select: {
        id: true,
        country: true,
        municipality: true,
        photo: true,
        title: true,
        description: true,
        price: true,
        publishStatus: true,
        approvalRejectionReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prismaAny.reservation.findMany({
      where: {
        Home: { userId },
      },
      include: {
        User: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } },
        Home: { select: { guests: true } },
        Payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prismaAny.home.count({ where: { userId } }),
    prismaAny.reservation.count({
      where: {
        Home: { userId },
        status: "CONFIRMED",
        endDate: { gte: new Date() },
      },
    }),
    prismaAny.reservation.count({
      where: {
        Home: { userId },
        status: "PENDING",
      },
    }),
    prismaAny.payment.aggregate({
      where: {
        status: "CONFIRMED",
        Reservation: { Home: { userId } },
      },
      _sum: { amount: true },
    }),
    prismaAny.payment.aggregate({
      where: {
        status: "PENDING",
        Reservation: { Home: { userId } },
      },
      _sum: { amount: true },
    }),
    prismaAny.payment.aggregate({
      where: {
        status: "CONFIRMED",
        Reservation: { Home: { userId } },
      },
      _sum: { serviceFee: true },
    }),
    prismaAny.review.aggregate({
      where: {
        Home: { userId },
      },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const occupancy = totalProperties > 0
    ? Math.round((activeReservations / totalProperties) * 100)
    : 0;

  const recentReservations = reservations.map((reservation: any) => {
    const guestName = reservation.User
      ? `${reservation.User.firstName || ""} ${reservation.User.lastName || ""}`.trim() || reservation.User.email
      : "Huesped";
    const dates = `${new Date(reservation.startDate).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    })} - ${new Date(reservation.endDate).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    })}`;
    
    // Crear ID de reserva formateado
    const reservationId = `ZRK-${new Date(reservation.createdAt).getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
    
    return {
      id: reservation.id,
      reservationId,
      guestName,
      guestPhone: reservation.User?.phoneNumber,
      dates,
      pax: `${reservation.Home?.guests || 1} huésped${parseInt(reservation.Home?.guests || "1") > 1 ? "es" : ""}`,
      amount: reservation.Payment?.amount || reservation.totalAmount || 0,
      status: reservation.status,
    };
  });

  return {
    listings: (listings as ListingRow[]).map((item) => ({
      id: item.id,
      imagePath: item.photo || "",
      description: item.description || "",
      stateValue: item.country || "",
      municipalityValue: item.municipality,
      price: item.price || 0,
      title: item.title || "Sin titulo",
      publishStatus: item.publishStatus || "DRAFT",
      approvalRejectionReason: item.approvalRejectionReason,
      createdAt: item.createdAt,
    })),
    reservations: recentReservations,
    stats: {
      totalRevenue: confirmedRevenueAgg._sum.amount || 0,
      serviceFee: serviceFeeAgg._sum.serviceFee || 0,
      pendingAmount: pendingRevenueAgg._sum.amount || 0,
      availableAmount: (confirmedRevenueAgg._sum.amount || 0) - (serviceFeeAgg._sum.serviceFee || 0), // El anfitrión recibe el total menos la comisión
      activeReservations,
      occupancy,
      rating: ratingAgg._avg.rating || null,
      ratingCount: ratingAgg._count.rating || 0,
      requests: pendingReservations,
    },
  };
}

async function getGuestDashboardData(userId: string) {
  noStore();
  const prismaAny = prisma as any;

  const [favorites, reservations] = await Promise.all([
    prismaAny.favorite.findMany({
      where: { userId },
      select: {
        id: true,
        Home: {
          select: {
            id: true,
            photo: true,
            title: true,
            country: true,
            municipality: true,
            price: true,
            description: true,
          },
        },
      },
    }),
    prismaAny.reservation.findMany({
      where: { userId },
      include: {
        Home: {
          select: {
            id: true,
            photo: true,
            title: true,
            country: true,
            municipality: true,
            price: true,
            description: true,
            Favorite: {
              where: { userId },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    favorites: favorites.map((fav: any) => ({
      id: fav.Home.id,
      title: fav.Home.title || "Sin título",
      country: fav.Home.country || "",
      municipality: fav.Home.municipality,
      price: fav.Home.price || 0,
      photo: fav.Home.photo || "",
      favoriteId: fav.id,
      description: fav.Home.description || "",
    })),
    guestReservations: reservations.map((res: any) => ({
      id: res.id,
      homeId: res.Home.id,
      title: res.Home.title || "Sin título",
      country: res.Home.country || "",
      municipality: res.Home.municipality,
      price: res.Home.price || 0,
      photo: res.Home.photo || "",
      description: res.Home.description || "",
      startDate: res.startDate,
      endDate: res.endDate,
      status: res.status,
      totalAmount: res.totalAmount,
      favoriteId: res.Home.Favorite[0]?.id,
      isInFavoriteList: (res.Home.Favorite.length || 0) > 0,
    })),
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const userRecord = await (prisma as any).user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      profileImage: true,
      document1Image: true,
      document2Image: true,
      verificationStatus: true,
      isVerified: true,
      email: true,
    },
  });

  if (!userRecord) {
    redirect("/");
  }

  const userName = user.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
    : user.email?.split("@")[0];

  // Roles administrativos van directo a su panel
  if (userRecord.role === "ADMIN" || userRecord.role === "SUPERADMIN") {
    redirect("/admin");
  }
  if (userRecord.role === "BANER") {
    redirect("/admin/banners");
  }

  const role = userRecord.role as "HOST" | "GUEST";
  const initialTab = searchParams.tab;

  if (role === "HOST") {
    const data = await getHostDashboardData(user.id);
    const createHomeAction = createAirbnbHome.bind(null, { userId: user.id });
    const initialDocs = await (prisma as any).$queryRawUnsafe(
      `SELECT id, url, "fileName", "fileSize", "mimeType", "uploadedAt" FROM "UserDocument" WHERE "userId" = $1 ORDER BY "uploadedAt" ASC`,
      user.id
    ).catch(() => []);
    return (
      <HostDashboardClient
        userName={userName}
        userEmail={user.email}
        firstName={userRecord?.firstName}
        lastName={userRecord?.lastName}
        profileImage={userRecord?.profileImage}
        country="Venezuela"
        city="Caracas"
        stats={data.stats}
        reservations={data.reservations}
        listings={data.listings}
        createHomeAction={createHomeAction}
        userData={{ ...userRecord, email: userRecord?.email || user.email }}
        userId={user.id}
        initialDocs={initialDocs || []}
      />
    );
  } else {
    const data = await getGuestDashboardData(user.id);
    return (
      <GuestDashboardClient
        role="GUEST"
        userName={userName}
        userEmail={user.email}
        userId={user.id}
        firstName={userRecord?.firstName}
        lastName={userRecord?.lastName}
        phoneNumber={userRecord?.phoneNumber}
        profileImage={userRecord?.profileImage}
        country="Venezuela"
        city="Caracas"
        initialTab={initialTab}
        favorites={data.favorites}
        guestReservations={data.guestReservations}
      />
    );
  }
}
