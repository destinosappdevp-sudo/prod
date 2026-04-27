import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Send } from "lucide-react";
import { sendMessage } from "@/app/action";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { userId } = await params;

  try {
    // Get conversation partner info
    const partner = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
      },
    });

    if (!partner) {
      redirect("/messages");
    }

    // Get messages between users
    const messages = await (prisma as any).message.findMany({
      where: {
        OR: [
          { senderId: user.id, recipientId: userId },
          { senderId: userId, recipientId: user.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 sticky top-0 z-10 p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Link href="/messages" className="p-2 hover:bg-slate-200 rounded-lg transition">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              {partner.profileImage && (
                <Image
                  src={partner.profileImage}
                  alt={partner.firstName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <h1 className="text-xl font-bold">
                {partner.firstName} {partner.lastName}
              </h1>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-500">No hay mensajes aún. ¡Inicia la conversación!</p>
            </div>
          ) : (
            messages.map((msg: { id: string; senderId: string; content: string; createdAt: Date }) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-2xl ${
                    msg.senderId === user.id
                      ? "bg-orange-600 text-white rounded-br-none"
                      : "bg-slate-200 text-slate-900 rounded-bl-none"
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.createdAt.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        <div className="bg-white border-t border-slate-100 sticky bottom-0 p-4">
          <form
            action={async (formData) => {
              "use server";
              const content = formData.get("message") as string;
              await sendMessage(user.id, userId, content);
            }}
            className="max-w-4xl mx-auto flex gap-3"
          >
            <input
              type="text"
              name="message"
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
            <button
              type="submit"
              className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full transition"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading chat:", error);
    redirect("/messages");
  }
}
