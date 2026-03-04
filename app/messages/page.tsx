import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    // Get all unique users this user has messaged
    const messages = await (prisma as any).message.findMany({
      where: {
        OR: [{ senderId: user.id }, { recipientId: user.id }],
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
    });

    // Group by conversation
    const conversations = new Map<
      string,
      {
        userId: string;
        firstName: string;
        lastName: string;
        profileImage: string | null;
        lastMessage: string;
        lastMessageTime: Date;
        unread: number;
      }
    >();

    messages.forEach((msg: any) => {
      const otherUser =
        msg.senderId === user.id ? msg.recipient : msg.sender;
      const key = otherUser.id;

      if (!conversations.has(key)) {
        conversations.set(key, {
          userId: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          profileImage: otherUser.profileImage,
          lastMessage: msg.content.slice(0, 100),
          lastMessageTime: msg.createdAt,
          unread: 0,
        });
      }

      // Count unread messages
      if (msg.recipientId === user.id && !msg.isRead) {
        const conv = conversations.get(key);
        if (conv) conv.unread++;
      }
    });

    const conversationsList = Array.from(conversations.values()).sort(
      (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/my-dashboard"
              className="p-2 hover:bg-slate-200 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold">Mensajes</h1>
          </div>

          {/* Conversations List */}
          {conversationsList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
              <MessageCircle className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 mb-4">No tienes mensajes aún</p>
              <p className="text-sm text-slate-400">
                Comienza a chatear con anfitriones o huéspedes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversationsList.map((conv) => (
                <Link
                  key={conv.userId}
                  href={`/messages/${conv.userId}`}
                  className="block p-4 bg-white rounded-2xl border border-slate-100 hover:border-orange-300 shadow-sm transition"
                >
                  <div className="flex items-center gap-4">
                    {conv.profileImage && (
                      <Image
                        src={conv.profileImage}
                        alt={conv.firstName}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {conv.firstName} {conv.lastName}
                      </h3>
                      <p className="text-sm text-slate-600 truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {conv.lastMessageTime.toLocaleDateString("es-ES")}
                      </p>
                      {conv.unread > 0 && (
                        <span className="inline-block bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full mt-1">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading messages:", error);
    redirect("/my-dashboard");
  }
}
