import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Время в миллисекундах, после которого статус пользователя считается OFFLINE
const OFFLINE_THRESHOLD_MS = 60 * 1000; // 60 секунд

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const currentTime = new Date();

    // 1. Обновляем статус текущего пользователя на ONLINE и запоминаем время активности
    await prisma.user.update({
      where: { phone: session.user.phone },
      data: { status: 'ONLINE', lastSeen: currentTime },
    });

    // 2. Получаем пользователя со всеми чатами
    const userWithChats = await prisma.user.findUnique({
      where: { phone: session.user.phone },
      include: {
        chats: {
          include: {
            participants: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                phone: true,
                status: true,
                lastSeen: true,
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!userWithChats) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // 3. Актуализируем статусы участников каждого чата прямо сейчас
    const updatedChats = userWithChats.chats.map((chat) => {
      const updatedParticipants = chat.participants.map((participant) => {
        let isOnline = participant.status === 'ONLINE';
        if (participant.lastSeen && participant.status === 'ONLINE') {
          const lastSeenTime = new Date(participant.lastSeen).getTime();
          const timeDiff = currentTime.getTime() - lastSeenTime;
          if (timeDiff > OFFLINE_THRESHOLD_MS) {
            isOnline = false;
            // Асинхронно обновляем статус в БД в фоне, не замедляя ответ
            prisma.user
              .update({
                where: { id: participant.id },
                data: { status: 'OFFLINE' },
              })
              .catch((err) =>
                console.error(`Не удалось обновить статус для ${participant.id}:`, err)
              );
          }
        }
        return {
          ...participant,
          status: isOnline ? 'ONLINE' : 'OFFLINE',
        };
      });

      return { ...chat, participants: updatedParticipants };
    });

    // 4. Отправляем обработанные чаты на клиент
    return NextResponse.json(updatedChats);
  } catch (error) {
    console.error('❌ Error in /api/chats:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
