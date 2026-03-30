'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        login,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Неверный email/телефон или пароль');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Произошла неизвестная ошибка');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-[450px] shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white font-bold">FT</span>
          </div>
          <CardTitle className="text-3xl">FamiTalk</CardTitle>
          <CardDescription>Войдите в свой аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Email или номер телефона"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 ml-1">
                Введите email или телефон в формате +7 (XXX) XXX-XX-XX
              </p>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Нет аккаунта?{' '}
            <a href="/register" className="text-blue-600 hover:underline font-medium">
              Зарегистрироваться
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
