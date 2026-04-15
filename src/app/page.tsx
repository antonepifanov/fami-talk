import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { HomeClient } from '@/components/HomeClient';

// Тип для чата после сериализации (даты становятся строками)
type SerializedChat = {
  id: string;
  name: string | null;
  isGroup: boolean;
  participants: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    status: string;
  }[];
  messages: {
    id: string;
    content: string;
    createdAt: string; // ← строка вместо Date
  }[];
  createdAt: Date;
  updatedAt: Date;
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.phone) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { phone: session.user.phone },
    include: {
      chats: {
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  const chats = await prisma.chat.findMany({
    where: {
      participants: {
        some: { id: user.id },
      },
    },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
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
      updatedAt: 'desc',
    },
  });

  // Сериализуем даты в строки для передачи клиенту
  const serializedChats: SerializedChat[] = chats.map((chat) => ({
    ...chat,
    messages: chat.messages.map((msg) => ({
      ...msg,
      createdAt: msg.createdAt.toISOString(),
    })),
  }));

  return <HomeClient initialChats={serializedChats} userId={user.id} />;
}
