import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { phone: session.user.phone },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const { messageId } = await params;

    if (!messageId) {
      return NextResponse.json({ error: 'ID сообщения не указан' }, { status: 400 });
    }

    // Проверяем, что сообщение существует
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Сообщение не найдено' }, { status: 404 });
    }

    // Получаем текущий массив readBy
    const currentReadBy = message.readBy || [];

    // Если уже прочитано, просто возвращаем успех
    if (currentReadBy.includes(currentUser.id)) {
      return NextResponse.json({ success: true, alreadyRead: true });
    }

    // Обновляем сообщение
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        readBy: [...currentReadBy, currentUser.id],
        readAt: new Date(),
        status: 'READ',
      },
    });

    return NextResponse.json({ success: true, message: updatedMessage });
  } catch (error) {
    console.error('❌ Mark read error:', error);
    return NextResponse.json({ error: 'Ошибка отметки прочтения' }, { status: 500 });
  }
}
