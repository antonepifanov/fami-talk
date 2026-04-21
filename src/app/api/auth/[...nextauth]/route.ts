import NextAuth, { Session, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { JWT } from 'next-auth/jwt';

function normalizePhone(phone: string): string | undefined {
  if (!phone) return undefined;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return undefined;
  if (cleaned.startsWith('8')) cleaned = '7' + cleaned.slice(1);
  if (cleaned.startsWith('7') && cleaned.length === 11) return '+' + cleaned;
  if (cleaned.length === 10) return '+7' + cleaned;
  return '+' + cleaned;
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'phone',
      credentials: {
        login: { label: 'Телефон', type: 'text' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null;

        const normalizedPhone = normalizePhone(credentials.login);
        if (!normalizedPhone) return null;

        const user = await prisma.user.findUnique({
          where: { phone: normalizedPhone },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          phone: user.phone,
          name: user.name,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
        token.name = user.name;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // Всегда получаем свежие данные из базы
      if (token.id) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        });

        if (freshUser) {
          session.user.id = freshUser.id;
          session.user.name = freshUser.name;
          session.user.phone = freshUser.phone;
          session.user.avatarUrl = freshUser.avatarUrl;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
