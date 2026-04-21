import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { normalizePhone } from '@/lib/phone';
import { sendVerificationSMS } from '@/lib/sms';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { newPhone } = await request.json();
    const normalizedNewPhone = normalizePhone(newPhone);

    if (!normalizedNewPhone) {
      return NextResponse.json({ error: 'Неверный формат телефона' }, { status: 400 });
    }

    // Проверяем, не занят ли новый номер
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedNewPhone },
    });

    if (existingUser && existingUser.phone !== session.user.phone) {
      return NextResponse.json({ error: 'Этот номер уже используется' }, { status: 400 });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.verificationCode.upsert({
      where: { phone_type: { phone: normalizedNewPhone, type: 'change_phone' } },
      update: { code, expiresAt, used: false, metadata: session.user.phone },
      create: {
        phone: normalizedNewPhone,
        type: 'change_phone',
        code,
        expiresAt,
        metadata: session.user.phone,
      },
    });

    await sendVerificationSMS(normalizedNewPhone, code);

    return NextResponse.json({ success: true, message: 'Код отправлен' });
  } catch (error) {
    console.error('Send change phone code error:', error);
    return NextResponse.json({ error: 'Ошибка отправки кода' }, { status: 500 });
  }
}
