import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function normalizePhone(phone: string): string | undefined {
  if (!phone) return undefined;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return undefined;
  if (cleaned.startsWith('8')) cleaned = '7' + cleaned.slice(1);
  if (cleaned.startsWith('7') && cleaned.length === 11) return '+' + cleaned;
  if (cleaned.length === 10) return '+7' + cleaned;
  return '+' + cleaned;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, password } = body;

    // Валидация
    if (!name || !password) {
      return NextResponse.json({ error: 'Имя и пароль обязательны' }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ error: 'Укажите номер телефона' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Неверный формат номера телефона' }, { status: 400 });
    }

    // Ищем существующего пользователя
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Этот номер телефона уже зарегистрирован' },
        { status: 400 }
      );
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаём нового пользователя
    const user = await prisma.user.create({
      data: {
        name,
        phone: normalizedPhone,
        passwordHash: hashedPassword,
        phoneVerified: new Date(),
      },
    });

    return NextResponse.json({ message: 'Пользователь создан', userId: user.id }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Ошибка при регистрации' }, { status: 500 });
  }
}
