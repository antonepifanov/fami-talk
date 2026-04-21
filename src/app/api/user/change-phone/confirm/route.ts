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

    const { newPhone, code } = await request.json();
    const normalizedNewPhone = normalizePhone(newPhone);

    if (!normalizedNewPhone || !code) {
      return NextResponse.json({ error: 'Недостаточно данных' }, { status: 400 });
    }

    // Проверяем код
    const record = await prisma.verificationCode.findUnique({
      where: { phone_type: { phone: normalizedNewPhone, type: 'change_phone' } },
    });

    if (!record || record.used || record.code !== code || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Неверный или просроченный код' }, { status: 400 });
    }

    // Обновляем телефон пользователя
    await prisma.user.update({
      where: { phone: session.user.phone },
      data: { phone: normalizedNewPhone, phoneVerified: new Date() },
    });

    // Помечаем код как использованный
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    });

    return NextResponse.json({ success: true, message: 'Телефон успешно изменён' });
  } catch (error) {
    console.error('Change phone confirm error:', error);
    return NextResponse.json({ error: 'Ошибка смены телефона' }, { status: 500 });
  }
}
