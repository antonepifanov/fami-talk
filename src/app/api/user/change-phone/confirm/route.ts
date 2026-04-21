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

    const body = await request.json();
    const { newPhone, code } = body;

    if (!newPhone || !code) {
      return NextResponse.json({ error: 'Недостаточно данных' }, { status: 400 });
    }

    const normalizedNewPhone = normalizePhone(newPhone);
    if (!normalizedNewPhone) {
      return NextResponse.json({ error: 'Неверный формат телефона' }, { status: 400 });
    }

    // Проверяем код
    const record = await prisma.verificationCode.findUnique({
      where: { phone_type: { phone: normalizedNewPhone, type: 'change_phone' } },
    });

    if (!record) {
      return NextResponse.json({ error: 'Код не найден' }, { status: 400 });
    }

    if (record.used) {
      return NextResponse.json({ error: 'Код уже использован' }, { status: 400 });
    }

    if (record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Код истёк' }, { status: 400 });
    }

    if (record.code !== code) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
    }

    // Проверяем, что новый номер всё ещё свободен
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedNewPhone },
    });

    if (existingUser && existingUser.phone !== session.user.phone) {
      return NextResponse.json({ error: 'Этот номер уже используется' }, { status: 400 });
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
    console.error('❌ [change-phone-confirm] Ошибка:', error);
    return NextResponse.json(
      { error: 'Ошибка смены телефона' },
      { status: 500 }
    );
  }
}
