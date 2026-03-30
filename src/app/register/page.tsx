'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock } from 'lucide-react';

interface ApiError {
  error: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Маска для российского номера: +7 (XXX) XXX-XX-XX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');

    if (value.length > 11) value = value.slice(0, 11);

    if (value.length === 0) {
      setPhone('');
    } else if (value.length === 1) {
      if (value === '7' || value === '8') {
        setPhone('+7 (');
      } else {
        setPhone(`+7 (${value}`);
      }
    } else if (value.length === 2) {
      setPhone(`+7 (${value.slice(1)}`);
    } else if (value.length <= 4) {
      setPhone(`+7 (${value.slice(1)}`);
    } else if (value.length <= 7) {
      const main = value.slice(1, 4);
      const second = value.slice(4, 7);
      setPhone(`+7 (${main}) ${second}`);
    } else if (value.length <= 9) {
      const main = value.slice(1, 4);
      const second = value.slice(4, 7);
      const third = value.slice(7, 9);
      setPhone(`+7 (${main}) ${second}-${third}`);
    } else {
      const main = value.slice(1, 4);
      const second = value.slice(4, 7);
      const third = value.slice(7, 9);
      const fourth = value.slice(9, 11);
      setPhone(`+7 (${main}) ${second}-${third}-${fourth}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Проверяем, что указан хотя бы email или телефон
    if (!email && !phone) {
      setError('Укажите email или номер телефона');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorData = data as ApiError;
        throw new Error(errorData.error || 'Ошибка регистрации');
      }

      router.push('/login?registered=true');
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
      <Card className="w-[500px] shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white font-bold">FT</span>
          </div>
          <CardTitle className="text-3xl">FamiTalk</CardTitle>
          <CardDescription>Создайте новый аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Имя *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="tel"
                placeholder="+7 (XXX) XXX-XX-XX"
                value={phone}
                onChange={handlePhoneChange}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                placeholder="Пароль *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Укажите email ИЛИ телефон (можно оба)</p>
              <p>• Пароль должен содержать не менее 6 символов</p>
              <p>• Телефон в формате: +7 (XXX) XXX-XX-XX</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Войти
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
