// Отправка писем через Resend REST API — без SDK, обычный fetch,
// чтобы не тащить лишнюю npm-зависимость. Нужен RESEND_API_KEY в переменных окружения.
// Пока свой домен не подключён в Resend, письма уходят с onboarding@resend.dev —
// этого достаточно, чтобы код реально доходил на любую почту.

const FROM_ADDRESS = "SNIPER <onboarding@resend.dev>";

export async function sendVerificationEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY не задан — письмо с кодом не отправлено");
    return { ok: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject: `Код подтверждения: ${code}`,
        html: `
          <div style="font-family: -apple-system, Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 24px;">
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">
              SNIP<span style="color:#D4003B">E</span>R
            </div>
            <p style="font-size: 15px; color: #333;">Ваш код подтверждения регистрации:</p>
            <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; background: #f5f5f5; padding: 16px 20px; border-radius: 10px; text-align: center; margin: 16px 0;">
              ${code}
            </div>
            <p style="font-size: 13px; color: #888;">Код действителен 15 минут. Если вы не регистрировались на SNIPER — просто проигнорируйте это письмо.</p>
          </div>
        `,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Resend API error:", res.status, text);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("Не удалось отправить письмо через Resend:", err);
    return { ok: false };
  }
}

export function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 цифр
}
