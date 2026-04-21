export function normalizePhone(phone: string): string | null {
  // Убираем все не-цифры
  const cleaned = phone.replace(/\D/g, '');

  if (!cleaned) return null;

  // Российские номера: 10 цифр (без кода) или 11 цифр (с 7 или 8)
  if (cleaned.length === 10) {
    return '+7' + cleaned;
  }
  if (cleaned.length === 11) {
    if (cleaned.startsWith('7')) {
      return '+' + cleaned;
    }
    if (cleaned.startsWith('8')) {
      return '+7' + cleaned.slice(1);
    }
  }
  // Если уже ввели с '+' и 12 символов
  if (phone.startsWith('+') && cleaned.length === 11 && cleaned.startsWith('7')) {
    return '+' + cleaned;
  }

  return null;
}
