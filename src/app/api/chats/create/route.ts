import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { normalizePhone } from '@/lib/phone';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { phoneOrId } = await request.json();

    if (!phoneOrId) {
      return NextResponse.json({ error: 'Укажите телефон или ID пользователя' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { phone: session.user.phone },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Ищем другого пользователя
    let otherUser = null;
    const normalizedPhone = normalizePhone(phoneOrId);

    if (normalizedPhone) {
      otherUser = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });
    } else {
      otherUser = await prisma.user.findUnique({
        where: { id: phoneOrId },
      });
    }

    if (!otherUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (otherUser.id === currentUser.id) {
      return NextResponse.json({ error: 'Нельзя создать чат с самим собой' }, { status: 400 });
    }

    // Проверяем, существует ли уже чат между этими пользователями
    const existingChat = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            id: { in: [currentUser.id, otherUser.id] },
          },
        },
      },
    });

    if (existingChat) {
      return NextResponse.json({ chatId: existingChat.id, isNew: false });
    }

    // Создаём новый чат
    const newChat = await prisma.chat.create({
      data: {
        isGroup: false,
        participants: {
          connect: [{ id: currentUser.id }, { id: otherUser.id }],
        },
      },
    });

    return NextResponse.json({ chatId: newChat.id, isNew: true }, { status: 201 });
  } catch (error) {
    console.error('❌ Create chat error:', error);
    return NextResponse.json({ error: 'Ошибка создания чата' }, { status: 500 });
  }
}
