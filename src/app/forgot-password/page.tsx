'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, KeyRound, Lock } from 'lucide-react';
import { normalizePhone } from '@/lib/phone';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code' | 'password'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
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

  // Шаг 1: отправка кода для сброса пароля
  const sendResetCode = async () => {
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
        body: JSON.stringify({
          phone: normalizedPhone,
          type: 'reset',
        }),
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

  // Шаг 2: подтверждение кода
  const verifyResetCode = async () => {
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
          type: 'reset',
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

  // Шаг 3: установка нового пароля
  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
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
          type: 'reset',
          password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сброса пароля');
      router.push('/login?reset=true');
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
            <CardTitle className="text-3xl">Сброс пароля</CardTitle>
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
            <Button onClick={sendResetCode} disabled={!phone || loading} className="w-full">
              {loading ? 'Отправка...' : 'Отправить код'}
            </Button>
            <div className="text-center text-sm text-gray-600 pt-2">
              <a href="/login" className="text-blue-600 hover:underline font-medium">
                Вернуться ко входу
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
            <Button
              onClick={verifyResetCode}
              disabled={code.length !== 6 || loading}
              className="w-full"
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </Button>
            <button
              onClick={sendResetCode}
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

  // Шаг 3: установка нового пароля
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-[450px] shadow-xl">
        <CardHeader className="text-center">
          <Lock className="mx-auto mb-4 h-12 w-12 text-blue-600" />
          <CardTitle>Новый пароль</CardTitle>
          <CardDescription>Придумайте новый пароль для {phone}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="password"
              placeholder="Новый пароль (мин. 6 символов)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10"
            />
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
          <Button onClick={resetPassword} disabled={!newPassword || loading} className="w-full">
            {loading ? 'Сохранение...' : 'Установить пароль'}
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
