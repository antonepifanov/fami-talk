import HttpSms from 'httpsms';

let client: HttpSms | null = null;

export async function sendVerificationSMS(phone: string, code: string): Promise<boolean> {
  const apiKey = process.env.HTTPSMS_API_KEY;

  if (!apiKey) {
    return true;
  }

  if (!client) {
    client = new HttpSms(apiKey);
  }

  const normalizedPhone = phone.replace(/\D/g, '');
  const finalPhone = normalizedPhone.startsWith('7')
    ? '+' + normalizedPhone
    : '+7' + normalizedPhone;

  try {
    await client.messages.postSend({
      content: `Код подтверждения FamiTalk: ${code}`,
      from: process.env.HTTPSMS_FROM || finalPhone,
      to: finalPhone,
      encrypted: false,
    });
    return true;
  } catch (error) {
    console.error('❌ httpSMS error:', error);
    return false;
  }
}
