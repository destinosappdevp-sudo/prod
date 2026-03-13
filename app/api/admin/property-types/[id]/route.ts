import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

const prismaAny = prisma as any;

function parseCategoryId(idParam: string): number | null {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const userRecord = await prismaAny.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (
    !userRecord ||
    (userRecord.role !== "ADMIN" && userRecord.role !== "SUPERADMIN")
  ) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const categoryId = parseCategoryId(params.id);
  if (!categoryId) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const category = await prismaAny.property_types.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const categoryId = parseCategoryId(params.id);
  if (!categoryId) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  try {
    const body = await request.json();

    const nameProvided = typeof body?.name === "string";
    const iconProvided = typeof body?.icon === "string";

    const updateData: { name?: string; icon?: string | null } = {};

    if (nameProvided) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json(
          { error: "Nombre de categoría requerido" },
          { status: 400 }
        );
      }
      updateData.name = name;
    }

    if (iconProvided) {
      const icon = body.icon.trim();
      updateData.icon = icon || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No changes provided" },
        { status: 400 }
      );
    }

    const existingCategory = await prismaAny.property_types.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updatedCategory = await prismaAny.$transaction(async (tx: any) => {
      const updated = await tx.property_types.update({
        where: { id: categoryId },
        data: updateData,
      });

      if (
        typeof updateData.name === "string" &&
        updateData.name !== existingCategory.name
      ) {
        await tx.home.updateMany({
          where: { categoryName: existingCategory.name },
          data: { categoryName: updateData.name },
        });
      }

      return updated;
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating property type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const categoryId = parseCategoryId(params.id);
  if (!categoryId) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  try {
    const existingCategory = await prismaAny.property_types.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const homesUsingCategory = await prismaAny.home.count({
      where: {
        categoryName: existingCategory.name,
      },
    });

    if (homesUsingCategory > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una categoría en uso" },
        { status: 409 }
      );
    }

    await prismaAny.property_types.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting property type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
