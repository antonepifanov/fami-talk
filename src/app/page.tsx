import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default async function HomePage() {
  // Получаем сессию на сервере
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Получаем пользователя из базы
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      chats: {
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Получаем список чатов пользователя
  const chats = await prisma.chat.findMany({
    where: {
      participants: {
        some: { id: user.id },
      },
    },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      participants: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          status: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="flex h-screen">
      {/* Сайдбар со списком чатов */}
      <ChatSidebar chats={chats} userId={user.id} />

      {/* Основное окно чата (пока пустое) */}
      <ChatWindow userId={user.id} />
    </div>
  );
}
