import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { messageId } = await params;

    if (!messageId) {
      return NextResponse.json({ error: 'ID сообщения не указан' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { phone: session.user.phone },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: currentUser.id,
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Сообщение не найдено' }, { status: 404 });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Delete message error:', error);
    return NextResponse.json({ error: 'Ошибка удаления сообщения' }, { status: 500 });
  }
}
