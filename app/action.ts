"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "./lib/db";
import { supabase } from "./lib/supabase";
import { createClient } from "@/app/lib/supabase/server";
import { headers } from "next/headers";

export async function signIn() {
  const supabase = createClient();
  const origin = headers().get("origin");
  
  // Por ahora redirigir directo a Google OAuth
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Error en login:", error);
    // Si Google no está configurado, mostrar mensaje
    return redirect("/?error=configure-google-oauth");
  }

  return redirect(data.url);
}

export async function signUp(email: string, password: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Error en registro:", error);
    return { error: error.message };
  }

  // Crear usuario en la base de datos
  if (data.user) {
    try {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email ?? email,
          firstName: "Usuario",
          lastName: "",
          profileImage: `https://avatar.vercel.sh/${email}`,
        },
      });
    } catch (e) {
      console.log("Usuario ya existe en BD, continuando...");
    }
  }

  return { success: true };
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Error en login:", error);
    return { error: error.message };
  }

  // Asegurar que el usuario existe en la base de datos
  if (data.user) {
    const userExists = await prisma.user.findUnique({
      where: { id: data.user.id },
    });

    if (!userExists) {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email ?? email,
          firstName: "Usuario",
          lastName: "",
          profileImage: `https://avatar.vercel.sh/${email}`,
        },
      });
    }
  }

  return redirect("/");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/");
}

export async function createAirbnbHome({ userId }: { userId: string }) {
  const data = await prisma.home.findFirst({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (data === null) {
    const data = await prisma.home.create({
      data: {
        userId: userId,
      },
    });

    return redirect(`/create/${data.id}/structure`);
  } else if (
    !data.addedCategory &&
    !data.addedDescription &&
    !data.addedLocation
  ) {
    return redirect(`/create/${data.id}/structure`);
  } else if (data.addedCategory && !data.addedDescription) {
    return redirect(`/create/${data.id}/description`);
  } else if (
    data.addedCategory &&
    data.addedDescription &&
    !data.addedLocation
  ) {
    return redirect(`/create/${data.id}/address`);
  } else if (
    data.addedCategory &&
    data.addedDescription &&
    data.addedLocation
  ) {
    const data = await prisma.home.create({
      data: {
        userId: userId,
      },
    });

    return redirect(`/create/${data.id}/structure`);
  }
}

export async function createCategoryPage(formData: FormData) {
  const categoryName = formData.get("categoryName") as string;
  const homeId = formData.get("homeId") as string;
  const data = await prisma.home.update({
    where: {
      id: homeId,
    },
    data: {
      categoryName: categoryName,
      addedCategory: true,
    },
  });

  return redirect(`/create/${homeId}/description`);
}

export async function createDescription(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price");
  const imageFiles = formData.get("image") as File;
  const homeId = formData.get("homeId") as string;

  const guestsNumber = formData.get("guests") as string;
  const roomsNumber = formData.get("rooms") as string;
  const bathroomsNumber = formData.get("bathrooms") as string;

  // Generar nombre de archivo único y válido
  const fileExtension = imageFiles.name.split('.').pop();
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

  const { data: imageData, error } = await supabase.storage
    .from("images")
    .upload(uniqueFileName, imageFiles, {
      cacheControl: "2592000",
      contentType: imageFiles.type,
    });

  if (error) {
    console.error("Error uploading image to Supabase:", error);
    throw new Error("Failed to upload image");
  }

  const data = await prisma.home.update({
    where: { id: homeId },
    data: {
      title: title,
      description: description,
      price: Number(price),
      bedrooms: roomsNumber,
      bathrooms: bathroomsNumber,
      guests: guestsNumber,
      photo: imageData?.path,
      addedDescription: true,
    },
  });

  return redirect(`/create/${homeId}/address`);
}

export async function createLocation(formData: FormData) {
  const homeId = formData.get("homeId") as string;
  const countryValue = formData.get("countryValue") as string;
  const data = await prisma.home.update({
    where: {
      id: homeId,
    },
    data: {
      addedLocation: true,
      country: countryValue,
    },
  });
  return redirect(`/`);
}

export async function AddToFavorite(formData: FormData) {
  const homeId = formData.get("homeId") as string;
  const userId = formData.get("userId") as string;
  const pathName = formData.get("pathName") as string;

  const data = await prisma.favorite.create({
    data: {
      homeId: homeId,
      userId: userId,
    },
  });

  revalidatePath(pathName);
}

export async function RemoveFromFavorite(formData: FormData) {
  const favoriteId = formData.get("favoriteId") as string;
  const pathName = formData.get("pathName") as string;
  const userId = formData.get("userId") as string;

  const data = await prisma.favorite.delete({
    where: {
      id: favoriteId,
      userId: userId,
    },
  });

  revalidatePath(pathName);
}

export async function creteReservation(formDate: FormData) {
  const homeId = formDate.get("homeId") as string;
  const userId = formDate.get("userId") as string;
  const startDate = formDate.get("startDate") as string;
  const endDate = formDate.get("endDate") as string;

  const data = await prisma.reservation.create({
    data: {
      userId: userId,
      homeId: homeId,
      startDate: startDate,
      endDate: endDate,
    },
  });

  return redirect(`/`);
}
