import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { name, avatarUrl } = body;

    const updatedUser = await prisma.user.update({
      where: { phone: session.user.phone },
      data: {
        ...(name && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        image: updatedUser.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Ошибка обновления профиля' }, { status: 500 });
  }
}
