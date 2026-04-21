import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: { id: user.id },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            status: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error('❌ Chats fetch error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки чатов' }, { status: 500 });
  }
}
