'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search } from 'lucide-react';

interface SearchResultChat {
  id: string;
  name?: string | null;
  isGroup: boolean;
  participants: { id: string; name: string | null; avatarUrl: string | null }[];
  messages: { content: string }[];
}

interface SearchResultMessage {
  id: string;
  content: string;
  createdAt: string;
  chat: {
    id: string;
    name?: string | null;
    participants: { id: string; name: string | null; avatarUrl: string | null }[];
  };
  sender: { id: string; name: string | null; avatarUrl: string | null };
}

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectChat: (chatId: string) => void;
  userId: string;
}

export function SearchModal({ open, onOpenChange, onSelectChat, userId }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [chats, setChats] = useState<SearchResultChat[]>([]);
  const [messages, setMessages] = useState<SearchResultMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setChats([]);
      setMessages([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setChats(data.chats || []);
        setMessages(data.messages || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const getChatName = (chat: SearchResultChat) => {
    if (chat.name) return chat.name;
    if (chat.isGroup) return 'Групповой чат';
    const otherUser = chat.participants.find((p) => p.id !== userId);
    return otherUser?.name || 'Неизвестный';
  };

  const getChatAvatar = (chat: SearchResultChat) => {
    if (chat.isGroup) return null;
    const otherUser = chat.participants.find((p) => p.id !== userId);
    return otherUser?.avatarUrl;
  };

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    onOpenChange(false);
    setQuery('');
  };

  const getMessageChatName = (msg: SearchResultMessage) => {
    if (msg.chat.name) return msg.chat.name;
    const otherUser = msg.chat.participants.find((p) => p.id !== userId);
    return otherUser?.name || 'Чат';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Поиск</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск чатов и сообщений..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {loading && <div className="text-center text-gray-500 py-4">Поиск...</div>}

          {!loading && chats.length === 0 && messages.length === 0 && query.length >= 2 && (
            <div className="text-center text-gray-500 py-4">Ничего не найдено</div>
          )}

          {/* Чаты */}
          {chats.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Чаты</h3>
              <div className="space-y-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <Avatar>
                      <AvatarImage src={getChatAvatar(chat) ?? undefined} />
                      <AvatarFallback>{getChatName(chat)[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{getChatName(chat)}</div>
                      {chat.messages[0] && (
                        <div className="text-sm text-gray-500 truncate">
                          {chat.messages[0].content}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Сообщения */}
          {messages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Сообщения</h3>
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectChat(msg.chat.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={msg.sender.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {msg.sender.name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{msg.sender.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 ml-8">
                      в чате «{getMessageChatName(msg)}»
                    </div>
                    <div className="text-sm ml-8 mt-1 p-2 bg-gray-50 rounded">{msg.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
