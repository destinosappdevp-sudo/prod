"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "./lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { getResendClient, FROM_EMAIL } from "@/app/lib/resend";
import { generateWelcomeEmail } from "@/app/lib/email-templates";
import { getStateByValue } from "@/app/lib/venezuelaStates";

type RegistrationProfile = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  stateCode: string;
};

function normalizeRegistrationProfile(profile: RegistrationProfile) {
  return {
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    phoneNumber: profile.phoneNumber.trim(),
    stateCode: profile.stateCode.trim().toUpperCase(),
  };
}

function validateRegistrationProfile(profile: RegistrationProfile) {
  const normalizedProfile = normalizeRegistrationProfile(profile);

  if (!normalizedProfile.firstName) {
    return { error: "Debes ingresar tu nombre" };
  }

  if (!normalizedProfile.lastName) {
    return { error: "Debes ingresar tu apellido" };
  }

  if (!normalizedProfile.phoneNumber) {
    return { error: "Debes ingresar tu teléfono" };
  }

  if (normalizedProfile.phoneNumber.length < 7) {
    return { error: "Ingresa un número de teléfono válido" };
  }

  if (!normalizedProfile.stateCode || !getStateByValue(normalizedProfile.stateCode)) {
    return { error: "Debes seleccionar un estado de Venezuela" };
  }

  return { data: normalizedProfile };
}

async function sendWelcomeEmail(email: string) {
  const resend = getResendClient();

  if (!resend) {
    console.warn("RESEND_API_KEY no configurada; se omite email de bienvenida.");
    return;
  }

  const displayName = email.split("@")[0] || "nuevo usuario";

  try {
    console.log(`📧 Enviando email de bienvenida a: ${email}`);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Bienvenido a Zerkka",
      html: generateWelcomeEmail({
        email,
        displayName,
      }),
    });

    if (result.error) {
      console.error(`❌ Resend rechazó el email de bienvenida a ${email}:`, result.error);
      return;
    }

    console.log(`✅ Email de bienvenida enviado exitosamente a ${email}`, result.data);
  } catch (error) {
    console.error("❌ Error enviando email de bienvenida:", error);
  }
}

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

    await sendWelcomeEmail(data.user.email ?? email);
  }

  return { success: true };
}


export async function signUpWithRole(
  email: string,
  password: string,
  role: 'GUEST' | 'HOST' | 'ADMIN' | 'SUPERADMIN' = 'GUEST',
  profile?: RegistrationProfile
) {
  const supabase = await createClient();
  let normalizedProfile: RegistrationProfile;

  if (!profile) {
    if (role === "GUEST" || role === "HOST") {
      return { error: "Faltan datos del perfil para crear la cuenta" };
    }

    normalizedProfile = {
      firstName: "Usuario",
      lastName: "",
      phoneNumber: "",
      stateCode: "CC",
    };
  } else {
    const validatedProfile = validateRegistrationProfile(profile);
    if ("error" in validatedProfile) {
      return validatedProfile;
    }

    normalizedProfile = validatedProfile.data;
  }
  
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
          firstName: normalizedProfile.firstName,
          lastName: normalizedProfile.lastName,
          profileImage: `https://avatar.vercel.sh/${email}`,
          role: role,
          phoneNumber: normalizedProfile.phoneNumber,
          stateCode: normalizedProfile.stateCode,
        },
      });
    } catch (e) {
      console.log("Usuario ya existe en BD, continuando...");
    }

    await sendWelcomeEmail(data.user.email ?? email);
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
    const errorMap: Record<string, string> = {
      "Invalid login credentials": "Correo o contraseña incorrectos",
      "Email not confirmed": "Debes confirmar tu correo antes de iniciar sesión",
      "Too many requests": "Demasiados intentos. Por favor intenta más tarde",
      "User not found": "No existe una cuenta con ese correo",
    };
    return { error: errorMap[error.message] ?? "Error al iniciar sesión. Intenta de nuevo" };
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

  return { success: true, userId: data.user?.id };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
}

export async function createAirbnbHome({ userId }: { userId: string }) {
  const data = await prisma.home.create({
    data: {
      id: randomUUID(),
      userId,
    },
  });

  return redirect(`/create/${data.id}/structure`);
}

export async function createCategoryPage(formData: FormData) {
  const homeId = (formData.get("homeId") as string | null)?.trim() || "";
  const categoryNameRaw =
    (formData.get("categoryName") as string | null)?.trim() || "";
  const propertyTypeIdRaw =
    (formData.get("propertyTypeId") as string | null)?.trim() || "";

  if (!homeId) {
    return redirect("/my-dashboard?tab=listings");
  }

  const prismaAny = prisma as any;

  let selectedCategory: { id: number; name: string } | null = null;

  if (propertyTypeIdRaw) {
    const propertyTypeId = Number(propertyTypeIdRaw);
    if (Number.isInteger(propertyTypeId) && propertyTypeId > 0) {
      selectedCategory = await prismaAny.property_types.findUnique({
        where: { id: propertyTypeId },
        select: { id: true, name: true },
      });
    }
  }

  if (!selectedCategory && categoryNameRaw) {
    selectedCategory = await prismaAny.property_types.findFirst({
      where: { name: categoryNameRaw },
      select: { id: true, name: true },
    });
  }

  if (!selectedCategory) {
    return redirect(`/create/${homeId}/structure?error=category-required`);
  }

  const homeExists = await prismaAny.home.findUnique({
    where: { id: homeId },
    select: { id: true },
  });

  if (!homeExists) {
    return redirect("/my-dashboard?tab=listings");
  }

  try {
    await prismaAny.home.update({
      where: { id: homeId },
      data: {
        categoryName: selectedCategory.name,
        propertyTypeId: selectedCategory.id,
        addedCategory: true,
      },
    });
  } catch {
    // Fallback si el schema local no expone propertyTypeId.
    await prisma.home.update({
      where: { id: homeId },
      data: {
        categoryName: selectedCategory.name,
        addedCategory: true,
      },
    });
  }

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
  const latRaw = formData.get("latitude") as string;
  const lngRaw = formData.get("longitude") as string;
  const latitude = latRaw ? parseFloat(latRaw) : null;
  const longitude = lngRaw ? parseFloat(lngRaw) : null;

  // Obtener el usuario autenticado
  const supabaseServer = await createClient();
  const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

  if (userError || !user) {
    throw new Error("Debes iniciar sesión para publicar un alojamiento");
  }

  // Obtener datos del usuario para verificar si está verificado
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isVerified: true },
  });

  const isUserVerified = userData?.isVerified ?? false;

  // Determinar el estado de publicación
  const publishStatus = isUserVerified ? "APPROVED" : "PENDING_APPROVAL";
  const approvedAt = isUserVerified ? new Date() : null;
  const approvedById = isUserVerified ? user.id : null;

  const data = await prisma.home.update({
    where: {
      id: homeId,
    },
    data: {
      addedLocation: !!(stateValue && municipalityValue),
      country: stateValue,
      municipality: municipalityValue,
      exactAddress: exactAddress || null,
      latitude: latitude,
      longitude: longitude,
      checkInTime: checkInTime || null,
      contactNumber: contactNumber || null,
      publishStatus: publishStatus as any,
      approvedAt,
      approvedById,
    },
  });

  // Log para auditoría
  await logAuditAction(user.id, "HOME_PUBLISHED", {
    homeId,
    status: publishStatus,
    isVerified: isUserVerified,
  });

  return redirect(`/`);
}

export async function AddToFavorite(formData: FormData) {
  try {
    const homeId = formData.get("homeId") as string;
    const userId = formData.get("userId") as string;
    const pathName = formData.get("pathName") as string;

    // Validar datos requeridos
    if (!homeId || !userId) {
      throw new Error("Faltan datos requeridos para guardar el favorito");
    }

    // Verificar que la propiedad existe
    const homeExists = await prisma.home.findUnique({
      where: { id: homeId },
      select: { id: true },
    });

    if (!homeExists) {
      throw new Error("La propiedad no existe");
    }

    // Verificar que no exista ya en favoritos
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        homeId: homeId,
        userId: userId,
      },
    });

    if (existingFavorite) {
      console.log("Este favorito ya existe");
      revalidatePath(pathName);
      return;
    }

    const data = await prisma.favorite.create({
      data: {
        id: randomUUID(),
        homeId: homeId,
        userId: userId,
      },
    });

    revalidatePath(pathName);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al guardar favorito";
    console.error("Error en AddToFavorite:", errorMessage);
    throw error;
  }
}

export async function RemoveFromFavorite(formData: FormData) {
  try {
    const favoriteId = formData.get("favoriteId") as string;
    const pathName = formData.get("pathName") as string;
    const userId = formData.get("userId") as string;

    // Validar datos requeridos
    if (!favoriteId || !userId) {
      throw new Error("Faltan datos requeridos para eliminar el favorito");
    }

    const data = await prisma.favorite.delete({
      where: {
        id: favoriteId,
        userId: userId,
      },
    });

    revalidatePath(pathName);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al eliminar favorito";
    console.error("Error en RemoveFromFavorite:", errorMessage);
    throw error;
  }
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
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    const firstName = (formData.get("firstName") as string)?.trim();
    const lastName = (formData.get("lastName") as string)?.trim();
    const phoneNumber = (formData.get("phoneNumber") as string)?.trim();
    const profileImageFile = formData.get("profileImage") as File | null;
    const document1File = formData.get("document1Image") as File | null;
    const document2File = formData.get("document2Image") as File | null;

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        isVerified: true,
        profileImage: true,
        document1Image: true,
        document2Image: true,
      },
    });

    let profileImageUrl =
      (formData.get("currentProfileImage") as string) || currentUser?.profileImage || "";
    let document1ImageUrl =
      (formData.get("currentDocument1Image") as string) || currentUser?.document1Image || null;
    let document2ImageUrl =
      (formData.get("currentDocument2Image") as string) || currentUser?.document2Image || null;

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
        return { success: false, error: "Error al subir la imagen de perfil" };
      }

      profileImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${storageData.path}`;
    }

    if (document1File && document1File.size > 0) {
      const fileName = `${user.id}-doc1-${Date.now()}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from("images")
        .upload(`verification-docs/${fileName}`, document1File, {
          upsert: true,
        });

      if (storageError) {
        console.error("Error subiendo documento 1:", storageError);
        return { success: false, error: "Error al subir el documento 1" };
      }

      document1ImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${storageData.path}`;
    }

    if (document2File && document2File.size > 0) {
      const fileName = `${user.id}-doc2-${Date.now()}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from("images")
        .upload(`verification-docs/${fileName}`, document2File, {
          upsert: true,
        });

      if (storageError) {
        console.error("Error subiendo documento 2:", storageError);
        return { success: false, error: "Error al subir el documento 2" };
      }

      document2ImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${storageData.path}`;
    }

    const hasVerificationDocs = !!document1ImageUrl || !!document2ImageUrl;

    const updateData: any = {
      firstName: firstName || "Usuario",
      lastName: lastName || "",
      phoneNumber: phoneNumber || null,
      profileImage: profileImageUrl || null,
      document1Image: document1ImageUrl,
      document2Image: document2ImageUrl,
    };

    if (currentUser?.role === "HOST") {
      updateData.verificationStatus = hasVerificationDocs
        ? "PENDING"
        : currentUser?.isVerified
          ? "APPROVED"
          : "NOT_SUBMITTED";
    }

    // Actualizar usuario en la base de datos
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    console.log("Usuario actualizado:", updatedUser);
    revalidatePath("/my-dashboard");
    revalidatePath("/", "layout");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error en updateProfile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el perfil",
    };
  }
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
        id: randomUUID(),
        userId,
        action,
        details: details || undefined,
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
        id: randomUUID(),
        userId,
        emailOnReservation: preferences.emailOnReservation ?? true,
        emailOnReview: preferences.emailOnReview ?? true,
        emailOnMessage: preferences.emailOnMessage ?? true,
        emailOnPayment: preferences.emailOnPayment ?? true,
        smsNotifications: preferences.smsNotifications ?? false,
        updatedAt: new Date(),
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
          id: randomUUID(),
          userId,
          emailOnReservation: true,
          emailOnReview: true,
          emailOnMessage: true,
          emailOnPayment: true,
          smsNotifications: false,
          updatedAt: new Date(),
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
        id: randomUUID(),
        senderId,
        recipientId,
        content: content.trim(),
      },
      include: {
        User_Message_senderIdToUser: {
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
        User_Message_senderIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        User_Message_recipientIdToUser: {
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

// ========== PUBLISH HOME / ALOJAMIENTOS ==========
export async function publishHome(homeId: string, userId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: "No autorizado" };
    }

    // Obtener el usuario para verificar su estado
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isVerified: true },
    });

    if (!userRecord || userRecord.role !== "HOST") {
      return { success: false, error: "Solo los hosts pueden publicar alojamientos" };
    }

    // Si el host está verificado, publicar directamente
    // Si no, enviar a aprobación
    const publishStatus = userRecord.isVerified ? "APPROVED" : "PENDING_APPROVAL";

    const home = await prisma.home.update({
      where: { id: homeId },
      data: {
        publishStatus: publishStatus as any,
      },
    });

    // Log the action
    await logAuditAction(userId, "HOME_PUBLISHED", {
      homeId,
      publishStatus,
      requiresApproval: !userRecord.isVerified,
    });

    return {
      success: true,
      message: userRecord.isVerified
        ? "Alojamiento publicado exitosamente"
        : "Alojamiento enviado a revisión. Un superadmin lo aprobará pronto.",
      publishStatus,
    };
  } catch (error) {
    console.error("Error publishing home:", error);
    return { success: false, error: "Error al publicar el alojamiento" };
  }
}

// ========== APPROVE / REJECT HOME ==========
export async function approveHome(homeId: string, superAdminId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== superAdminId) {
      return { success: false, error: "No autorizado" };
    }

    // Verificar que sea SUPERADMIN
    const superAdmin = await prisma.user.findUnique({
      where: { id: superAdminId },
      select: { role: true },
    });

    if (!superAdmin || superAdmin.role !== "SUPERADMIN") {
      return { success: false, error: "Solo superadmins pueden aprobar alojamientos" };
    }

    const home = await prisma.home.update({
      where: { id: homeId },
      data: {
        publishStatus: "APPROVED",
        approvedById: superAdminId,
        approvedAt: new Date(),
        approvalRejectionReason: null,
      },
    });

    // Log the action
    await logAuditAction(superAdminId, "HOME_APPROVED", { homeId });

    return { success: true, message: "Alojamiento aprobado" };
  } catch (error) {
    console.error("Error approving home:", error);
    return { success: false, error: "Error al aprobar el alojamiento" };
  }
}

export async function rejectHome(
  homeId: string,
  superAdminId: string,
  reason: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== superAdminId) {
      return { success: false, error: "No autorizado" };
    }

    // Verificar que sea SUPERADMIN
    const superAdmin = await prisma.user.findUnique({
      where: { id: superAdminId },
      select: { role: true },
    });

    if (!superAdmin || superAdmin.role !== "SUPERADMIN") {
      return { success: false, error: "Solo superadmins pueden rechazar alojamientos" };
    }

    const home = await prisma.home.update({
      where: { id: homeId },
      data: {
        publishStatus: "REJECTED",
        approvalRejectionReason: reason,
      },
    });

    // Log the action
    await logAuditAction(superAdminId, "HOME_REJECTED", {
      homeId,
      reason,
    });

    return { success: true, message: "Alojamiento rechazado" };
  } catch (error) {
    console.error("Error rejecting home:", error);
    return { success: false, error: "Error al rechazar el alojamiento" };
  }
}
