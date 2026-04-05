import { SupabaseImage } from "@/app/components/SupabaseImage";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { toCategorySlug } from "@/app/lib/slug";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

const prismaAny = prisma as any;

async function getDataBySlug(slug: string) {
  noStore();
  return await prismaAny.home.findUnique({
    where: { slug },
    select: {
      id: true,
      photo: true,
      title: true,
      description: true,
      categoryName: true,
      price: true,
      country: true,
      slug: true,
      publishStatus: true,
      User: {
        select: { id: true, role: true },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { categorySlug: string; slug: string };
}): Promise<Metadata> {
  const data = await getDataBySlug(params.slug);
  if (!data) return { title: "Paquete no encontrado" };
  return {
    title: `${data.title} | Destinos Venezuela`,
    description: data.description?.slice(0, 160) || "Reserva tu cupo",
  };
}

async function DestinoPage({
  params,
}: {
  params: { categorySlug: string; slug: string };
}) {
  const data = await getDataBySlug(params.slug);

  if (!data) notFound();

  const correctCategorySlug = toCategorySlug(data.categoryName);
  if (params.categorySlug !== correctCategorySlug) {
    redirect(`/destinos/${correctCategorySlug}/${data.slug}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isApproved = data.publishStatus === "APPROVED";

  if (!isApproved) {
    if (!user) notFound();
    const userDb = await prismaAny.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    const canView =
      data.User?.id === user.id ||
      userDb?.role === "ADMIN" ||
      userDb?.role === "SUPERADMIN";
    if (!canView) notFound();
  }

  return (
    <div className="mx-auto mt-6 mb-12 w-full max-w-7xl px-4 sm:px-6 lg:mt-10 lg:px-8">
      <h1 className="font-medium text-2xl mb-5">{data.title}</h1>
      <div className="relative h-[260px] sm:h-[360px] lg:h-[550px]">
        <SupabaseImage
          imagePath={data.photo as string}
          alt={data.title as string}
          fill
          className="rounded-lg h-full object-cover w-full"
        />
      </div>
    </div>
  );
}

export default DestinoPage;
