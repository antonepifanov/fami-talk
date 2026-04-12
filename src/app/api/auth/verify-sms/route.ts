import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { normalizePhone } from '@/lib/phone';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { phone, code, type, name, password } = body;

    if (!phone || !code || !type) {
      return NextResponse.json({ error: 'Недостаточно данных' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Неверный формат номера' }, { status: 400 });
    }

    // 1. Ищем код в БД
    const record = await prisma.verificationCode.findUnique({
      where: { phone_type: { phone: normalizedPhone, type } },
    });

    if (!record) {
      return NextResponse.json({ error: 'Код не найден' }, { status: 400 });
    }

    // Проверка валидности кода
    if (record.used) {
      return NextResponse.json({ error: 'Код уже использован' }, { status: 400 });
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Код истек' }, { status: 400 });
    }
    if (record.code !== code) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
    }

    // 2. Для регистрации: только проверка кода (без name/password)
    if (type === 'register' && !name && !password) {
      return NextResponse.json({
        success: true,
        message: 'Код подтверждён',
        phone: normalizedPhone,
      });
    }

    // 3. Для регистрации: завершение создания пользователя
    if (type === 'register' && name && password) {
      if (!name || !password) {
        return NextResponse.json({ error: 'Имя и пароль обязательны' }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Пароль должен содержать не менее 6 символов' },
          { status: 400 }
        );
      }

      // Проверяем, не зарегистрирован ли уже пользователь
      const existingUser = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Этот номер уже зарегистрирован' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          phone: normalizedPhone,
          name,
          passwordHash: hashedPassword,
          phoneVerified: new Date(),
        },
      });

      // Помечаем код как использованный ТОЛЬКО здесь
      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true },
      });

      return NextResponse.json({
        success: true,
        message: 'Регистрация завершена',
      });
    }

    // 4. Сброс пароля
    if (type === 'reset') {
      if (!password) {
        return NextResponse.json({
          success: true,
          message: 'Код подтверждён',
          phone: normalizedPhone,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { phone: normalizedPhone },
        data: { passwordHash: hashedPassword },
      });

      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true },
      });

      return NextResponse.json({
        success: true,
        message: 'Пароль изменён',
      });
    }

    return NextResponse.json({ error: 'Неизвестный тип операции' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
