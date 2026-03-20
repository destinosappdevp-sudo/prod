import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import HostDashboardClient from "@/app/components/HostDashboardClient";
import GuestDashboardClient from "@/app/components/DashboardClient_min";
import { createAirbnbHome } from "@/app/action";
import {
  formatCurrencyAmount,
  parsePaymentFinancials,
} from "@/app/lib/payment-currency";

type HostPublishStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED";

function normalizePublishStatus(status?: string | null): HostPublishStatus {
  if (
    status === "DRAFT" ||
    status === "PENDING_APPROVAL" ||
    status === "APPROVED" ||
    status === "REJECTED"
  ) {
    return status;
  }

  return "DRAFT";
}

type HostAnalyticsPeriod = {
  labels: string[];
  revenueUsd: number[];
  bookings: number[];
  grossRevenueUsd: number;
  commissionUsd: number;
  netRevenueUsd: number;
  totalBookings: number;
  averageTicketUsd: number;
  maxRevenue: number;
  maxBookings: number;
  bestBookingIndex: number;
  bestPeriodLabel: string;
  rangeLabel: string;
};

type HostAnalyticsData = {
  weekly: HostAnalyticsPeriod;
  monthly: HostAnalyticsPeriod;
};

type AnalyticsReservationRow = {
  createdAt: Date;
  status: string;
};

type AnalyticsPaymentRow = {
  amount: number;
  subtotal: number;
  serviceFee: number;
  paymentMethod?: string | null;
  paymentDetails?: unknown;
  Reservation?: {
    createdAt: Date | null;
  } | null;
};

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function capitalizeWord(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatRangeDate(date: Date) {
  const month = date
    .toLocaleDateString("es-ES", { month: "short" })
    .replace(".", "")
    .toLowerCase();
  return `${date.getDate()} ${capitalizeWord(month)}`;
}

function buildAnalyticsPeriod(
  labels: string[],
  keys: string[],
  reservations: AnalyticsReservationRow[],
  payments: AnalyticsPaymentRow[],
  keyFromDate: (date: Date) => string,
  rangeLabel: string
): HostAnalyticsPeriod {
  const bookingsByKey = new Map<string, number>();
  const revenueByKey = new Map<string, number>();
  const commissionByKey = new Map<string, number>();

  for (const key of keys) {
    bookingsByKey.set(key, 0);
    revenueByKey.set(key, 0);
    commissionByKey.set(key, 0);
  }

  for (const reservation of reservations) {
    if (!reservation?.createdAt || reservation.status === "CANCELLED") {
      continue;
    }

    const key = keyFromDate(new Date(reservation.createdAt));
    if (!bookingsByKey.has(key)) {
      continue;
    }

    bookingsByKey.set(key, (bookingsByKey.get(key) ?? 0) + 1);
  }

  for (const payment of payments) {
    const paymentDate = payment?.Reservation?.createdAt;
    if (!paymentDate) {
      continue;
    }

    const key = keyFromDate(new Date(paymentDate));
    if (!revenueByKey.has(key)) {
      continue;
    }

    const parsed = parsePaymentFinancials(payment);
    const amountUsd =
      parsed.amountUsd > 0
        ? parsed.amountUsd
        : parsed.currency === "USD"
        ? parsed.amount
        : 0;
    const serviceFeeUsd =
      parsed.serviceFeeUsd > 0
        ? parsed.serviceFeeUsd
        : parsed.currency === "USD"
        ? parsed.serviceFee
        : 0;

    revenueByKey.set(key, Number(((revenueByKey.get(key) ?? 0) + amountUsd).toFixed(2)));
    commissionByKey.set(
      key,
      Number(((commissionByKey.get(key) ?? 0) + serviceFeeUsd).toFixed(2))
    );
  }

  const bookings = keys.map((key) => bookingsByKey.get(key) ?? 0);
  const revenueUsd = keys.map((key) => Number((revenueByKey.get(key) ?? 0).toFixed(2)));
  const commissions = keys.map((key) => Number((commissionByKey.get(key) ?? 0).toFixed(2)));

  const grossRevenueUsd = Number(
    revenueUsd.reduce((total, value) => total + value, 0).toFixed(2)
  );
  const commissionUsd = Number(
    commissions.reduce((total, value) => total + value, 0).toFixed(2)
  );
  const netRevenueUsd = Number((grossRevenueUsd - commissionUsd).toFixed(2));
  const totalBookings = bookings.reduce((total, value) => total + value, 0);
  const averageTicketUsd =
    totalBookings > 0 ? Number((grossRevenueUsd / totalBookings).toFixed(2)) : 0;
  const maxRevenue = Math.max(...revenueUsd, 1);
  const maxBookings = Math.max(...bookings, 1);
  const bestBookingIndex = bookings.indexOf(maxBookings);

  return {
    labels,
    revenueUsd,
    bookings,
    grossRevenueUsd,
    commissionUsd,
    netRevenueUsd,
    totalBookings,
    averageTicketUsd,
    maxRevenue,
    maxBookings,
    bestBookingIndex,
    bestPeriodLabel: labels[bestBookingIndex] ?? "-",
    rangeLabel,
  };
}

function buildHostAnalyticsData(
  reservations: AnalyticsReservationRow[],
  payments: AnalyticsPaymentRow[]
): HostAnalyticsData {
  const now = new Date();

  const currentDay = now.getDay();
  const mondayOffset = (currentDay + 6) % 7;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weeklyLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const weeklyDates = weeklyLabels.map(
    (_, index) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index)
  );
  const weeklyKeys = weeklyDates.map((date) => toDateKey(date));
  const weeklyRangeLabel = `${formatRangeDate(weekStart)} - ${formatRangeDate(weekEnd)} ${weekEnd.getFullYear()}`;

  const monthlyStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyLabels: string[] = [];
  const monthlyDates: Date[] = [];
  const monthlyKeys: string[] = [];

  for (let index = 0; index < 6; index += 1) {
    const monthDate = new Date(monthlyStart.getFullYear(), monthlyStart.getMonth() + index, 1);
    monthlyDates.push(monthDate);
    monthlyKeys.push(toMonthKey(monthDate));
    monthlyLabels.push(
      capitalizeWord(
        monthDate
          .toLocaleDateString("es-ES", { month: "short" })
          .replace(".", "")
          .toLowerCase()
      )
    );
  }

  const monthlyEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthlyRangeLabel = `${formatRangeDate(monthlyDates[0])} - ${formatRangeDate(monthlyEnd)} ${monthlyEnd.getFullYear()}`;

  const weekly = buildAnalyticsPeriod(
    weeklyLabels,
    weeklyKeys,
    reservations,
    payments,
    toDateKey,
    weeklyRangeLabel
  );

  const monthly = buildAnalyticsPeriod(
    monthlyLabels,
    monthlyKeys,
    reservations,
    payments,
    toMonthKey,
    monthlyRangeLabel
  );

  return { weekly, monthly };
}

async function getUserDocuments(userId: string) {
  noStore();
  return (prisma as any)
    .$queryRawUnsafe(
      'SELECT id, "userId", url, "fileName", "fileSize", "mimeType", "uploadedAt" FROM "UserDocument" WHERE "userId" = $1 ORDER BY "uploadedAt" DESC',
      userId
    )
    .catch(() => []);
}

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
    publishStatus?: string | null;
    approvalRejectionReason?: string;
    createdAt?: Date;
  };

  const analyticsStartDate = new Date();
  analyticsStartDate.setMonth(analyticsStartDate.getMonth() - 5);
  analyticsStartDate.setDate(1);
  analyticsStartDate.setHours(0, 0, 0, 0);

  const [
    listings,
    reservations,
    totalProperties,
    activeReservations,
    pendingReservations,
    confirmedPayments,
    pendingPayments,
    releasableConfirmedPayments,
    analyticsReservationsRaw,
    analyticsPaymentsRaw,
    ratingAgg,
  ] = await Promise.all([
    prismaAny.home.findMany({
      where: {
        userId,
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
      take: 100, // Limit listings
    }),
    prismaAny.reservation.findMany({
      where: {
        Home: { userId },
      },
      select: {
        id: true,
        createdAt: true,
        startDate: true,
        endDate: true,
        status: true,
        totalAmount: true,
        User: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } },
        Home: { select: { guests: true } },
        Payment: {
          select: {
            amount: true,
            subtotal: true,
            serviceFee: true,
            paymentMethod: true,
            paymentDetails: true,
          },
        },
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
    prismaAny.payment.findMany({
      where: {
        status: "CONFIRMED",
        Reservation: { Home: { userId } },
      },
      select: {
        amount: true,
        subtotal: true,
        serviceFee: true,
        paymentMethod: true,
        paymentDetails: true,
      },
    }),
    prismaAny.payment.findMany({
      where: {
        status: "PENDING",
        Reservation: { Home: { userId } },
      },
      select: {
        amount: true,
        subtotal: true,
        serviceFee: true,
        paymentMethod: true,
        paymentDetails: true,
      },
    }),
    prismaAny.payment.findMany({
      where: {
        status: "CONFIRMED",
        Reservation: {
          Home: { userId },
          endDate: { lt: new Date() },
        },
      },
      select: {
        amount: true,
        subtotal: true,
        serviceFee: true,
        paymentMethod: true,
        paymentDetails: true,
      },
    }),
    prismaAny.reservation.findMany({
      where: {
        Home: { userId },
        createdAt: { gte: analyticsStartDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
    }),
    prismaAny.payment.findMany({
      where: {
        status: "CONFIRMED",
        Reservation: {
          Home: { userId },
          createdAt: { gte: analyticsStartDate },
        },
      },
      select: {
        amount: true,
        subtotal: true,
        serviceFee: true,
        paymentMethod: true,
        paymentDetails: true,
        Reservation: {
          select: {
            createdAt: true,
          },
        },
      },
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

  const walletStats = {
    USD: {
      totalRevenue: 0,
      serviceFee: 0,
      pendingAmount: 0,
      availableAmount: 0,
    },
    VES: {
      totalRevenue: 0,
      serviceFee: 0,
      pendingAmount: 0,
      availableAmount: 0,
    },
  } as const;

  const mutableWalletStats: Record<"USD" | "VES", {
    totalRevenue: number;
    serviceFee: number;
    pendingAmount: number;
    availableAmount: number;
  }> = {
    USD: { ...walletStats.USD },
    VES: { ...walletStats.VES },
  };

  for (const payment of confirmedPayments as Array<any>) {
    const parsed = parsePaymentFinancials(payment);
    mutableWalletStats[parsed.currency].totalRevenue += parsed.amount;
    mutableWalletStats[parsed.currency].serviceFee += parsed.serviceFee;
  }

  for (const payment of pendingPayments as Array<any>) {
    const parsed = parsePaymentFinancials(payment);
    mutableWalletStats[parsed.currency].pendingAmount += parsed.amount;
  }

  for (const payment of releasableConfirmedPayments as Array<any>) {
    const parsed = parsePaymentFinancials(payment);
    mutableWalletStats[parsed.currency].availableAmount += parsed.amount - parsed.serviceFee;
  }

  for (const currency of ["USD", "VES"] as const) {
    mutableWalletStats[currency].totalRevenue = Number(
      mutableWalletStats[currency].totalRevenue.toFixed(2)
    );
    mutableWalletStats[currency].serviceFee = Number(
      mutableWalletStats[currency].serviceFee.toFixed(2)
    );
    mutableWalletStats[currency].pendingAmount = Number(
      mutableWalletStats[currency].pendingAmount.toFixed(2)
    );
    mutableWalletStats[currency].availableAmount = Number(
      Math.max(0, mutableWalletStats[currency].availableAmount).toFixed(2)
    );
  }

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

    const parsedPayment = reservation.Payment
      ? parsePaymentFinancials(reservation.Payment)
      : null;

    const amountCurrency = parsedPayment?.currency ?? "USD";
    const amountValue = parsedPayment?.amount ?? reservation.totalAmount ?? 0;
    
    return {
      id: reservation.id,
      reservationId,
      guestName,
      guestPhone: reservation.User?.phoneNumber,
      dates,
      pax: `${reservation.Home?.guests || 1} huésped${parseInt(reservation.Home?.guests || "1") > 1 ? "es" : ""}`,
      amount: amountValue,
      amountCurrency,
      amountLabel: formatCurrencyAmount(amountValue, amountCurrency),
      status: reservation.status,
    };
  });

  const analytics = buildHostAnalyticsData(
    analyticsReservationsRaw as AnalyticsReservationRow[],
    analyticsPaymentsRaw as AnalyticsPaymentRow[]
  );

  return {
    listings: (listings as ListingRow[]).map((item) => ({
      id: item.id,
      imagePath: item.photo || "",
      description: item.description || "",
      stateValue: item.country || "",
      municipalityValue: item.municipality,
      price: item.price || 0,
      title: item.title || "Borrador sin titulo",
      publishStatus: normalizePublishStatus(item.publishStatus),
      approvalRejectionReason: item.approvalRejectionReason,
      createdAt: item.createdAt,
    })),
    reservations: recentReservations,
    stats: {
      walletUsd: mutableWalletStats.USD,
      walletBs: mutableWalletStats.VES,
      activeReservations,
      occupancy,
      rating: ratingAgg._avg.rating || null,
      ratingCount: ratingAgg._count.rating || 0,
      requests: pendingReservations,
    },
    analytics,
  };
}

async function getGuestDashboardData(userId: string) {
  noStore();
  const prismaAny = prisma as any;

  const [favorites, reservations, favoriteIds] = await Promise.all([
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
      take: 50,
    }),
    prismaAny.reservation.findMany({
      where: { userId },
      select: {
        id: true,
        homeId: true,
        startDate: true,
        endDate: true,
        status: true,
        totalAmount: true,
        createdAt: true,
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
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    // Separate query: get all favorite homeIds for this user
    prismaAny.favorite.findMany({
      where: { userId },
      select: { homeId: true },
    }),
  ]);

  // Create set of favorited homeIds for fast lookup
  const favoriteHomeIds = new Set(favoriteIds.map((f: any) => f.homeId));
  const favoriteByHomeId = new Map(
    favorites.map((fav: any) => [fav.Home.id, fav.id])
  );

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
      favoriteId: favoriteByHomeId.get(res.Home.id),
      isInFavoriteList: favoriteHomeIds.has(res.Home.id),
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
    const initialDocs = await getUserDocuments(user.id);
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
        analytics={data.analytics}
        initialTab={initialTab}
        createHomeAction={createHomeAction}
        userData={{ ...userRecord, email: userRecord?.email || user.email }}
        userId={user.id}
        initialDocs={initialDocs || []}
      />
    );
  } else {
    const data = await getGuestDashboardData(user.id);
    const initialDocs = await getUserDocuments(user.id);
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
        userData={{ ...userRecord, email: userRecord?.email || user.email }}
        initialDocs={initialDocs || []}
      />
    );
  }
}
