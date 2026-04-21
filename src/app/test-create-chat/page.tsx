'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TestCreateChat() {
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createChat = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chats/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrId: phone }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Ошибка запроса' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Тестовое создание чата</h1>
      <div className="space-y-4">
        <Input
          placeholder="Телефон: +79101234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button onClick={createChat} disabled={loading}>
          {loading ? 'Создание...' : 'Создать чат'}
        </Button>
        {result && (
          <pre className="bg-gray-100 p-4 rounded-lg mt-4 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
