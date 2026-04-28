import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ chats: [], messages: [] });
    }

    const currentUser = await prisma.user.findUnique({
      where: { phone: session.user.phone },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Поиск чатов по имени участника
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: { id: currentUser.id },
        },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          {
            participants: {
              some: {
                name: { contains: query, mode: 'insensitive' },
                id: { not: currentUser.id },
              },
            },
          },
        ],
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
    });

    // Поиск сообщений
    const messages = await prisma.message.findMany({
      where: {
        chat: {
          participants: {
            some: { id: currentUser.id },
          },
        },
        content: { contains: query, mode: 'insensitive' },
      },
      include: {
        chat: {
          include: {
            participants: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ chats, messages });
  } catch (error) {
    console.error('❌ Search error:', error);
    return NextResponse.json({ error: 'Ошибка поиска' }, { status: 500 });
  }
}
