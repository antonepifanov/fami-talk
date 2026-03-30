import NextAuth, { Session, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { JWT } from 'next-auth/jwt';

// Функция нормализации телефона (возвращает undefined, а не null)
function normalizePhone(phone: string): string | undefined {
  if (!phone) return undefined;

  // Удаляем всё, кроме цифр
  let cleaned = phone.replace(/\D/g, '');

  // Если номер пустой — возвращаем undefined
  if (cleaned.length === 0) return undefined;

  // Если начинается с 8 — заменяем на 7
  if (cleaned.startsWith('8')) {
    cleaned = '7' + cleaned.slice(1);
  }

  // Если начинается с 7 и длина 11 — добавляем +
  if (cleaned.startsWith('7') && cleaned.length === 11) {
    return '+' + cleaned;
  }

  // Если короче 11 цифр — возможно, ввели не полностью
  if (cleaned.length === 10) {
    return '+7' + cleaned;
  }

  return '+' + cleaned;
}

// Функция проверки, является ли строка email'ом
const isEmail = (text: string | null | undefined): boolean => {
  if (!text) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(text);
};

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login: { label: 'Email или телефон', type: 'text' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          return null;
        }

        // Определяем, что ввел пользователь: email или телефон
        const isLoginEmail = isEmail(credentials.login);

        let user = null;

        if (isLoginEmail) {
          // Поиск по email
          user = await prisma.user.findUnique({
            where: { email: credentials.login },
          });
        } else {
          // Поиск по телефону (нормализуем)
          const normalizedPhone = normalizePhone(credentials.login);
          if (normalizedPhone) {
            user = await prisma.user.findUnique({
              where: { phone: normalizedPhone },
            });
          }
        }

        // Проверяем, найден ли пользователь и есть ли пароль
        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
