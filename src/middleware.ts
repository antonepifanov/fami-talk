// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Можно добавить логику для разных маршрутов
    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/login', // ← неавторизованных отправляем на логин
    },
  }
);

// Какие маршруты защищаем
export const config = {
  matcher: ['/', '/chats/:path*', '/profile'], // ← главная и подстраницы
};
