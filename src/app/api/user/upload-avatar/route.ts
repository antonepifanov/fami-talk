import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const ACCESS_KEY_ID = process.env.SELECTEL_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.SELECTEL_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.SELECTEL_BUCKET_NAME;
const BUCKET_ID = process.env.SELECTEL_BUCKET_ID;

const s3Client = new S3Client({
  region: 'ru-3',
  endpoint: 'https://s3.ru-3.storage.selcloud.ru',
  credentials: {
    accessKeyId: ACCESS_KEY_ID!,
    secretAccessKey: SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
      console.error('❌ Selectel S3 не настроен');
      return NextResponse.json(
        { error: 'Сервис загрузки изображений временно недоступен' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Можно загружать только изображения' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Файл не должен превышать 5 МБ' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = file.name.split('.').pop();
    const safePhone = session.user.phone.replace(/[^0-9]/g, '');
    const fileName = `avatars/${safePhone}-${Date.now()}.${fileExtension}`;

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read' as const,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const avatarUrl = `https://${BUCKET_ID}.selstorage.ru/${fileName}`;

    await prisma.user.update({
      where: { phone: session.user.phone },
      data: { avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки аватара. Попробуйте позже.' },
      { status: 500 }
    );
  }
}
