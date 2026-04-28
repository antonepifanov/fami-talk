import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { chatId } = await params;

    if (!chatId) {
      return NextResponse.json({ error: 'ID чата не указан' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { phone: session.user.phone },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Проверяем, что пользователь участник чата
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: { some: { id: currentUser.id } },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Чат не найден' }, { status: 404 });
    }

    // Удаляем сообщения чата
    await prisma.message.deleteMany({
      where: { chatId },
    });

    // Удаляем чат
    await prisma.chat.delete({
      where: { id: chatId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Delete chat error:', error);
    return NextResponse.json({ error: 'Ошибка удаления чата' }, { status: 500 });
  }
}
