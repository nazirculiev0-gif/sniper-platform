// Тарифная сетка "закрытия" вакансии — фиксированная сумма (сум) по категории.
// Депозит при публикации = 15% тарифа. Комиссия платформы = 20% от тарифа при найме.

export const TARIFFS: Record
  string,
  { label: string; amount: number; hint: string }
> = {
  JUNIOR: {
    label: "Junior-специалист",
    amount: 3_000_000,
    hint: "До 1 года опыта",
  },
  MIDDLE: {
    label: "Middle-специалист",
    amount: 6_000_000,
    hint: "1–3 года опыта",
  },
  SENIOR: {
    label: "Senior-специалист",
    amount: 10_000_000,
    hint: "3–6 лет опыта",
  },
  LEAD: {
    label: "Lead / Head of",
    amount: 16_000_000,
    hint: "Руководитель направления",
  },
  TOP_MANAGEMENT: {
    label: "Топ-менеджмент",
    amount: 25_000_000,
    hint: "C-level, директора",
  },
};

export const DEPOSIT_RATE = 0.15; // 15% тарифа — вносится при публикации заявки
export const COMMISSION_RATE = 0.2; // 20% от тарифа — комиссия платформы при найме
export const EXCLUSIVE_DAYS = 14; // дней на закрепление до автовозврата на биржу
export const GUARANTEE_DAYS = 90; // гарантийный период после найма
export const HOLD_DAYS = 30; // период удержания выплаты рекрутеру

export function depositFor(tariffAmount: number) {
  return Math.round(tariffAmount * DEPOSIT_RATE);
}

export function commissionFor(tariffAmount: number) {
  return Math.round(tariffAmount * COMMISSION_RATE);
}
