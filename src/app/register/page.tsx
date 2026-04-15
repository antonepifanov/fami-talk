'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, KeyRound, User, Lock } from 'lucide-react';
import { normalizePhone } from '@/lib/phone';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [step, setStep] = useState<'phone' | 'code' | 'password'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Маска ввода телефона
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

  const normalizedPhone = normalizePhone(phone);

  // Шаг 1: отправка кода
  const sendCode = async () => {
    setLoading(true);
    setError('');
    if (!normalizedPhone) {
      setError('Неверный формат номера');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, type: 'register' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка отправки кода');
      setStep('code');
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Шаг 2: подтверждение кода (только проверка, без создания пользователя)
  const verifyCode = async () => {
    setLoading(true);
    setError('');
    if (!normalizedPhone) {
      setError('Неверный формат номера');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          code,
          type: 'register',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка подтверждения');
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Шаг 3: завершение регистрации (создание пользователя с name/password)
  const completeRegistration = async () => {
    if (!name) {
      setError('Введите имя');
      return;
    }
    if (!password || password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }

    setLoading(true);
    setError('');
    if (!normalizedPhone) {
      setError('Неверный формат номера');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          code,
          type: 'register',
          name,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка создания аккаунта');
      router.push('/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Шаг 1: ввод телефона
  if (step === 'phone') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-[450px] shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Phone className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl">Регистрация</CardTitle>
            <CardDescription>Введите номер телефона</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="+7 (XXX) XXX-XX-XX"
                value={phone}
                onChange={handlePhoneChange}
                className="pl-10"
              />
            </div>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
            <Button onClick={sendCode} disabled={!phone || loading} className="w-full">
              {loading ? 'Отправка...' : 'Продолжить'}
            </Button>
            <div className="text-center text-sm text-gray-600 pt-2">
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

  // Шаг 2: ввод кода
  if (step === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-[450px] shadow-xl">
          <CardHeader className="text-center">
            <KeyRound className="mx-auto mb-4 h-12 w-12 text-blue-600" />
            <CardTitle>Подтверждение</CardTitle>
            <CardDescription>Код отправлен на {phone}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Input
                placeholder="6-значный код"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl"
              />
            </div>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
            <Button onClick={verifyCode} disabled={code.length !== 6 || loading} className="w-full">
              {loading ? 'Проверка...' : 'Подтвердить'}
            </Button>
            <button
              onClick={sendCode}
              disabled={resendTimer > 0}
              className="w-full text-sm text-blue-600 hover:underline disabled:text-gray-400"
            >
              {resendTimer > 0
                ? `Отправить повторно через ${resendTimer} сек`
                : 'Отправить код повторно'}
            </button>
            <div className="text-center pt-2">
              <button
                onClick={() => setStep('phone')}
                className="text-sm text-gray-500 hover:underline"
              >
                ← Изменить номер телефона
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Шаг 3: имя и пароль
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-[450px] shadow-xl">
        <CardHeader className="text-center">
          <User className="mx-auto mb-4 h-12 w-12 text-blue-600" />
          <CardTitle>Завершение регистрации</CardTitle>
          <CardDescription>Придумайте имя и пароль</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="password"
              placeholder="Пароль (мин. 6 символов)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
            />
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
          <Button
            onClick={completeRegistration}
            disabled={!name || !password || loading}
            className="w-full"
          >
            {loading ? 'Создание...' : 'Завершить'}
          </Button>
          <div className="text-center pt-2">
            <button
              onClick={() => setStep('phone')}
              className="text-sm text-gray-500 hover:underline"
            >
              ← Назад
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
