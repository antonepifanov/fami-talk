import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/phone';
import { sendVerificationSMS } from '@/lib/sms'; // Создадим ниже

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { phone, type } = await req.json();

    if (!phone || !type) {
      return NextResponse.json({ error: 'Не указан номер телефона' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Неверный формат номера' }, { status: 400 });
    }

    // 1. Проверка существования пользователя в зависимости от типа операции
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (type === 'register' && existingUser) {
      return NextResponse.json({ error: 'Этот номер уже зарегистрирован' }, { status: 400 });
    }
    if (type === 'reset' && !existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким номером не найден' },
        { status: 400 }
      );
    }

    // 2. Генерируем и сохраняем код
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.verificationCode.upsert({
      where: { phone_type: { phone: normalizedPhone, type } },
      update: { code, expiresAt, used: false },
      create: {
        phone: normalizedPhone,
        type,
        code,
        expiresAt,
      },
    });

    await sendVerificationSMS(normalizedPhone, code);

    return NextResponse.json({ success: true, message: 'Код отправлен' });
  } catch (error) {
    console.error('SMS send error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
