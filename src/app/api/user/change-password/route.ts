import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Новый пароль должен содержать не менее 6 символов' },
        { status: 400 }
      );
    }

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Проверяем текущий пароль
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 400 });
    }

    // Хешируем новый пароль
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    await prisma.user.update({
      where: { phone: session.user.phone },
      data: { passwordHash: hashedNewPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Пароль успешно изменён',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Ошибка смены пароля' }, { status: 500 });
  }
}
