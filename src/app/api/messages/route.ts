import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { chatId, content } = await request.json();

    if (!chatId || !content?.trim()) {
      return NextResponse.json({ error: 'Недостаточно данных' }, { status: 400 });
    }

    const sender = await prisma.user.findUnique({
      where: { phone: session.user.phone },
    });

    if (!sender) {
      return NextResponse.json({ error: 'Отправитель не найден' }, { status: 404 });
    }

    // Проверяем, что пользователь участник чата
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: {
          some: { id: sender.id },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Чат не найден' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: sender.id,
        chatId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Обновляем updatedAt чата
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('❌ Message send error:', error);
    return NextResponse.json({ error: 'Ошибка отправки сообщения' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'chatId обязателен' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Проверяем, что пользователь участник чата
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: {
          some: { id: user.id },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Чат не найден' }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // последние 100 сообщений
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('❌ Messages fetch error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки сообщений' }, { status: 500 });
  }
}
