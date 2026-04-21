'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Phone, Loader2 } from 'lucide-react';

interface CreateChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated: (chatId: string) => void;
}

export function CreateChatModal({ open, onOpenChange, onChatCreated }: CreateChatModalProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Маска для телефона
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
    if (!phone.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chats/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrId: phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка создания чата');
      }

      onChatCreated(data.chatId);
      setPhone('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новый чат</DialogTitle>
          <DialogDescription>
            Введите номер телефона пользователя, чтобы начать диалог
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="+7 (XXX) XXX-XX-XX"
              value={phone}
              onChange={handlePhoneChange}
              className="pl-10"
              autoFocus
            />
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={!phone.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать чат'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
