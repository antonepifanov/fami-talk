'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Phone, Lock } from 'lucide-react';
import { normalizePhone } from '@/lib/phone';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length === 0) setPhone('');
    else if (value.length === 1) setPhone(value === '7' || value === '8' ? '+7 (' : `+7 (${value}`);
    else if (value.length <= 4) setPhone(`+7 (${value.slice(1)}`);
    else if (value.length <= 7) setPhone(`+7 (${value.slice(1, 4)}) ${value.slice(4)}`);
    else if (value.length <= 9)
      setPhone(`+7 (${value.slice(1, 4)}) ${value.slice(4, 7)}-${value.slice(7)}`);
    else
      setPhone(
        `+7 (${value.slice(1, 4)}) ${value.slice(4, 7)}-${value.slice(7, 9)}-${value.slice(9, 11)}`
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      setError('Введите корректный номер телефона');
      setLoading(false);
      return;
    }

    const result = await signIn('credentials', {
      login: normalizedPhone,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Неверный номер или пароль');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-[450px] shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Phone className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl">Вход в FamiTalk</CardTitle>
          <CardDescription>Введите номер телефона и пароль</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Поле телефона с иконкой */}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="+7 (XXX) XXX-XX-XX"
                value={phone}
                onChange={handlePhoneChange}
                className="pl-10"
                required
              />
            </div>

            {/* Поле пароля с иконкой */}
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

            {/* Ошибка */}
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

            {/* Кнопка входа */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>

            {/* Ссылки */}
            <div className="space-y-3 text-center">
              <div>
                <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Забыли пароль?
                </a>
              </div>
              <div className="text-sm text-gray-600">
                Нет аккаунта?{' '}
                <a href="/register" className="text-blue-600 hover:underline font-medium">
                  Зарегистрироваться
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
