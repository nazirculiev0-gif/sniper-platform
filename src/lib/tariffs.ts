// Грейд — это только фильтр/подсказка для биржи, он НЕ определяет сумму.
// Сумму вознаграждения работодатель указывает сам при создании заявки.
// Депозит (если работодатель его включил) = 50% от указанной суммы.
// Комиссия платформы = 20% от суммы вознаграждения при подтверждении найма.

export const TARIFFS: Record
  string,
  { label: string; hint: string; suggestedRange: [number, number] }
> = {
  JUNIOR: {
    label: "Junior-специалист",
    hint: "До 1 года опыта",
    suggestedRange: [2_000_000, 4_000_000],
  },
  MIDDLE: {
    label: "Middle-специалист",
    hint: "1–3 года опыта",
    suggestedRange: [4_000_000, 8_000_000],
  },
  SENIOR: {
    label: "Senior-специалист",
    hint: "3–6 лет опыта",
    suggestedRange: [8_000_000, 12_000_000],
  },
  LEAD: {
    label: "Lead / Head of",
    hint: "Руководитель направления",
    suggestedRange: [12_000_000, 20_000_000],
  },
  TOP_MANAGEMENT: {
    label: "Топ-менеджмент",
    hint: "C-level, директора",
    suggestedRange: [20_000_000, 35_000_000],
  },
};

export const DEPOSIT_RATE = 0.5; // 50% суммы вознаграждения — вносится при публикации, если депозит включён
export const COMMISSION_RATE = 0.2; // 20% от суммы вознаграждения — комиссия платформы при найме
export const EXCLUSIVE_DAYS = 14; // дней без активности до автовозврата заявки на биржу
export const GUARANTEE_DAYS = 90; // гарантийный период после найма
export const HOLD_DAYS = 30; // период удержания второй половины выплаты рекрутеру

export function depositFor(rewardAmount: number) {
  return Math.round(rewardAmount * DEPOSIT_RATE);
}

export function commissionFor(rewardAmount: number) {
  return Math.round(rewardAmount * COMMISSION_RATE);
}

export function fmtSuggestedRange([from, to]: [number, number]) {
  const f = (n: number) => {
    const m = n / 1_000_000;
    return Number.isInteger(m) ? String(m) : m.toFixed(1);
  };
  return `~ ${f(from)}–${f(to)} млн сум`;
}
