"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "./lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { headers } from "next/headers";

export async function getUserAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signIn() {
  const supabase = await createClient();
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
  const supabase = await createClient();
  
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


export async function signUpWithRole(email: string, password: string, role: 'GUEST' | 'HOST' | 'ADMIN' | 'SUPERADMIN' = 'GUEST') {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Error en registro:", error);
    return { error: error.message };
  }

  // Crear usuario en la base de datos con rol especificado
  if (data.user) {
    try {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email ?? email,
          firstName: "Usuario",
          lastName: "",
          profileImage: `https://avatar.vercel.sh/${email}`,
          role: role,
        },
      });
    } catch (e) {
      console.log("Usuario ya existe en BD, continuando...");
    }
  }

  return { success: true };
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = await createClient();
  
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
  const supabase = await createClient();
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
    !data.addedAmenities
  ) {
    return redirect(`/create/${data.id}/amenities`);
  } else if (
    data.addedCategory &&
    data.addedDescription &&
    data.addedAmenities &&
    !data.addedLocation
  ) {
    return redirect(`/create/${data.id}/address`);
  } else if (
    data.addedCategory &&
    data.addedDescription &&
    data.addedAmenities &&
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
  const supabaseServer = await createClient();
  
  // Verificar que el usuario esté autenticado
  const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
  
  if (userError || !user) {
    throw new Error("Debes iniciar sesión antes de subir imágenes");
  }

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
  const filePath = `user-${user.id}/${uniqueFileName}`;

  // Subir imagen a Supabase usando cliente de servidor
  const { data: imageData, error } = await supabaseServer.storage
    .from("images")
    .upload(filePath, imageFiles, {
      cacheControl: "3600",
      contentType: imageFiles.type,
      upsert: false,
    });

  if (error) {
    console.error("Error subiendo imagen:", error.message);
    throw new Error("Failed to upload image: " + error.message);
  }

  // Obtener URL pública
  const { data: publicUrlData } = supabaseServer.storage
    .from("images")
    .getPublicUrl(filePath);

  const imagePublicUrl = publicUrlData?.publicUrl;

  if (!imagePublicUrl) {
    throw new Error("Failed to get public URL for image");
  }

  // Guardar en la base de datos con la URL pública completa
  const data = await prisma.home.update({
    where: { id: homeId },
    data: {
      title: title,
      description: description,
      price: Number(price),
      bedrooms: roomsNumber,
      bathrooms: bathroomsNumber,
      guests: guestsNumber,
      photo: filePath, // Guardar la ruta relativa para compatibilidad
      addedDescription: true,
    },
  });

  return redirect(`/create/${homeId}/amenities`);
}

export async function createLocation(formData: FormData) {
  const homeId = formData.get("homeId") as string;
  const stateValue = formData.get("stateValue") as string;
  const municipalityValue = formData.get("municipalityValue") as string;
  const exactAddress = formData.get("exactAddress") as string;
  const checkInTime = formData.get("checkInTime") as string;
  const contactNumber = formData.get("contactNumber") as string;
  const data = await prisma.home.update({
    where: {
      id: homeId,
    },
    data: {
      addedLocation: !!(stateValue && municipalityValue),
      country: stateValue,
      municipality: municipalityValue,
      exactAddress: exactAddress || null,
      checkInTime: checkInTime || null,
      contactNumber: contactNumber || null,
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

  // Calcular noches
  const nights =
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
    (1000 * 60 * 60 * 24);

  // Obtener precio por noche
  const home = await prisma.home.findUnique({ where: { id: homeId } });
  const pricePerNight = home?.price ?? 0;

  // Calcular total
  const totalAmount = nights * pricePerNight;

  const data = await prisma.reservation.create({
    data: {
      userId: userId,
      homeId: homeId,
      startDate: startDate,
      endDate: endDate,
      nights: nights,
      totalAmount: totalAmount,
    },
  });

  return redirect(`/`);
}
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuario no autenticado" };
  }

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const profileImageFile = formData.get("profileImage") as File | null;

  let profileImageUrl = formData.get("currentProfileImage") as string;

  // Si hay una nueva foto, subirla a Supabase Storage
  if (profileImageFile && profileImageFile.size > 0) {
    const fileName = `${user.id}-${Date.now()}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from("images")
      .upload(`profiles/${fileName}`, profileImageFile, {
        upsert: true,
      });

    if (storageError) {
      console.error("Error subiendo imagen:", storageError);
      return { error: "Error al subir la imagen" };
    }

    profileImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${storageData.path}`;
  }

  // Actualizar usuario en la base de datos
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: firstName || "Usuario",
      lastName: lastName || "",
      phoneNumber: phoneNumber || null,
      profileImage: profileImageUrl,
    },
  });

  revalidatePath("/profile");
  return { success: true, user: updatedUser };
}

// ========== AUDIT LOG ==========
export async function logAuditAction(
  userId: string,
  action: string,
  details?: Record<string, any>
) {
  try {
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: details || null,
        ip,
        userAgent,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error logging audit action:", error);
    return { success: false, error: "Failed to log action" };
  }
}

// ========== NOTIFICATION PREFERENCES ==========
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    emailOnReservation?: boolean;
    emailOnReview?: boolean;
    emailOnMessage?: boolean;
    emailOnPayment?: boolean;
    smsNotifications?: boolean;
  }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const notifPrefs = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: {
        ...preferences,
        updatedAt: new Date(),
      },
      create: {
        userId,
        emailOnReservation: preferences.emailOnReservation ?? true,
        emailOnReview: preferences.emailOnReview ?? true,
        emailOnMessage: preferences.emailOnMessage ?? true,
        emailOnPayment: preferences.emailOnPayment ?? true,
        smsNotifications: preferences.smsNotifications ?? false,
      },
    });

    // Log the change
    await logAuditAction(userId, "NOTIFICATION_PREFERENCES_UPDATED", preferences);

    revalidatePath("/my-dashboard?tab=profile");
    return { success: true, preferences: notifPrefs };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return { success: false, error: "Failed to update preferences" };
  }
}

export async function getNotificationPreferences(userId: string) {
  try {
    const prefs = await prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) {
      // Create default preferences if not exists
      return await prisma.notificationPreferences.create({
        data: {
          userId,
          emailOnReservation: true,
          emailOnReview: true,
          emailOnMessage: true,
          emailOnPayment: true,
          smsNotifications: false,
        },
      });
    }

    return prefs;
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return null;
  }
}

// ========== MESSAGES ==========
export async function sendMessage(
  senderId: string,
  recipientId: string,
  content: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== senderId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!content.trim()) {
      return { success: false, error: "Message content cannot be empty" };
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        recipientId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    // Log the action
    await logAuditAction(senderId, "MESSAGE_SENT", { recipientId });

    // Check recipient's notification preferences
    const recipientPrefs = await getNotificationPreferences(recipientId);
    if (recipientPrefs?.emailOnMessage) {
      // TODO: Send email notification to recipient
    }

    return { success: true, message };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

export async function getMessages(userId: string, otherUserId?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: "Unauthorized", messages: [] };
    }

    const whereClause = otherUserId
      ? {
          OR: [
            { senderId: userId, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: userId },
          ],
        }
      : {
          OR: [{ senderId: userId }, { recipientId: userId }],
        };

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return { success: true, messages };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, error: "Failed to fetch messages", messages: [] };
  }
}

export async function markMessageAsRead(messageId: string, userId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.recipientId !== userId) {
      return { success: false, error: "Message not found or not authorized" };
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true, message: updated };
  } catch (error) {
    console.error("Error marking message as read:", error);
    return { success: false, error: "Failed to update message" };
  }
}
