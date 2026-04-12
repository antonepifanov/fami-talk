import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.phone) {
    redirect('/login');
  }

  // Получаем пользователя по телефону
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

  return (
    <div className="flex h-screen">
      <ChatSidebar chats={chats} userId={user.id} />
      <ChatWindow userId={user.id} />
    </div>
  );
}
