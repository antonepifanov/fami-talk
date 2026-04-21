'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Phone, Camera, Lock, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(session?.user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.avatarUrl || '');
  const [newPhone, setNewPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'code'>('input');

  // Состояния для смены пароля
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Редирект на логин, если не авторизован
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleUpdateName = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await update();
      setMessage({ type: 'success', text: 'Имя обновлено' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Можно загружать только изображения' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Файл не должен превышать 5 МБ' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // ✅ Принудительно обновляем сессию, чтобы подтянуть новый avatarUrl
      await update();

      // ✅ Также обновляем локальное состояние, если avatarUrl вернулся в ответе
      if (data.avatarUrl) {
        setAvatarUrl(data.avatarUrl);
      }

      setMessage({ type: 'success', text: 'Аватар обновлён' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка загрузки' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Заполните все поля' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Новые пароли не совпадают' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Новый пароль должен содержать не менее 6 символов' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Пароль успешно изменён' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneCode = async () => {
    if (!newPhone) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/change-phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhoneStep('code');
      setMessage({ type: 'success', text: 'Код отправлен на новый номер' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      setLoading(false);
    }
  };

  const confirmPhoneChange = async () => {
    if (!phoneCode) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/change-phone/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPhone, code: phoneCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await update();
      setPhoneStep('input');
      setNewPhone('');
      setPhoneCode('');
      setMessage({ type: 'success', text: 'Телефон успешно изменён' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      setLoading(false);
    }
  };

  // Маска для телефона
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length === 0) setNewPhone('');
    else if (value.length === 1)
      setNewPhone(value === '7' || value === '8' ? '+7 (' : `+7 (${value}`);
    else if (value.length <= 4) setNewPhone(`+7 (${value.slice(1)}`);
    else if (value.length <= 7) setNewPhone(`+7 (${value.slice(1, 4)}) ${value.slice(4)}`);
    else if (value.length <= 9)
      setNewPhone(`+7 (${value.slice(1, 4)}) ${value.slice(4, 7)}-${value.slice(7)}`);
    else
      setNewPhone(
        `+7 (${value.slice(1, 4)}) ${value.slice(4, 7)}-${value.slice(7, 9)}-${value.slice(9, 11)}`
      );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Кнопка "На главную" */}
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Button>

        {/* Карточка профиля */}
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
            <CardDescription>Управление личными данными</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Аватар */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarUrl || session?.user?.avatarUrl || ''} />
                  <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                    {session.user?.name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                />
              </div>
              <p className="text-sm text-gray-500">Нажмите на камеру, чтобы загрузить аватар</p>
            </div>

            {/* Имя */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Имя</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
                </div>
                <Button
                  onClick={handleUpdateName}
                  disabled={loading || name === session.user?.name}
                >
                  Сохранить
                </Button>
              </div>
            </div>

            {/* Текущий телефон */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Текущий телефон</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={session.user?.phone || ''} disabled className="pl-10 bg-gray-50" />
              </div>
            </div>

            {/* Смена телефона */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Сменить телефон</h3>
              {phoneStep === 'input' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="+7 (XXX) XXX-XX-XX"
                      value={newPhone}
                      onChange={handlePhoneChange}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={sendPhoneCode}
                    disabled={!newPhone || loading}
                    className="w-full"
                  >
                    Отправить код подтверждения
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Введите код из SMS"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="pl-10 text-center text-2xl"
                    />
                  </div>
                  <Button
                    onClick={confirmPhoneChange}
                    disabled={phoneCode.length !== 6 || loading}
                    className="w-full"
                  >
                    Подтвердить смену телефона
                  </Button>
                  <button
                    onClick={() => setPhoneStep('input')}
                    className="w-full text-sm text-gray-500 hover:underline"
                  >
                    ← Назад
                  </button>
                </div>
              )}
            </div>

            {/* Смена пароля */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Сменить пароль</h3>
              <div className="space-y-3">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Текущий пароль"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Подтвердите новый пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={loading} className="w-full">
                  Сменить пароль
                </Button>
              </div>
            </div>

            {/* Сообщения */}
            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {message.text}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
