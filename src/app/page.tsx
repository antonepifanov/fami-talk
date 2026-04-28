import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { HomeClient } from '@/components/HomeClient';

// Тип для сообщения после сериализации
type SerializedMessage = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  readBy?: string[];
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

// Тип для участника после сериализации
type SerializedParticipant = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  status: string;
  lastSeen?: string | null;
};

// Тип для чата после сериализации
type SerializedChat = {
  id: string;
  name?: string | null;
  isGroup: boolean;
  participants: SerializedParticipant[];
  messages: SerializedMessage[];
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
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      participants: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          status: true,
          lastSeen: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Сериализуем чаты для передачи клиенту
  const serializedChats: SerializedChat[] = chats.map((chat) => ({
    id: chat.id,
    name: chat.name,
    isGroup: chat.isGroup,
    participants: chat.participants.map((p) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatarUrl,
      status: p.status,
      lastSeen: p.lastSeen?.toISOString() || null,
    })),
    messages: chat.messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      createdAt: msg.createdAt.toISOString(),
      readBy: msg.readBy || [],
      sender: msg.sender
        ? {
            id: msg.sender.id,
            name: msg.sender.name,
            avatarUrl: msg.sender.avatarUrl,
          }
        : {
            id: '',
            name: 'Неизвестный',
            avatarUrl: null,
          },
    })),
  }));

  return <HomeClient initialChats={serializedChats} userId={user.id} />;
}
