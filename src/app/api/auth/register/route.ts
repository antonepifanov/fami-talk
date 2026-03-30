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
    const { name, email, phone, password } = body;

    // Валидация
    if (!name || !password) {
      return NextResponse.json({ error: 'Имя и пароль обязательны' }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json({ error: 'Укажите email или номер телефона' }, { status: 400 });
    }

    const normalizedEmail = email || undefined;
    const normalizedPhone = phone ? normalizePhone(phone) : undefined;

    // Ищем существующего пользователя
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      },
    });

    // Если пользователь уже существует
    if (existingUser) {
      // Если это тот же пользователь (совпадает email или телефон)
      // и он пытается добавить второй способ входа
      const emailMatches = normalizedEmail && existingUser.email === normalizedEmail;
      const phoneMatches = normalizedPhone && existingUser.phone === normalizedPhone;

      if (emailMatches || phoneMatches) {
        return NextResponse.json(
          { error: 'Пользователь с таким email или телефоном уже существует' },
          { status: 400 }
        );
      }

      // Если пользователь пытается добавить новый способ входа к существующему аккаунту
      // (например, регистрируется с email, а потом с телефоном)
      // TODO: это требует отдельной логики с верификацией
      return NextResponse.json(
        { error: 'Этот email или телефон уже используется другим аккаунтом' },
        { status: 400 }
      );
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаём нового пользователя
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash: hashedPassword,
      },
    });

    return NextResponse.json({ message: 'Пользователь создан', userId: user.id }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Ошибка при регистрации' }, { status: 500 });
  }
}
