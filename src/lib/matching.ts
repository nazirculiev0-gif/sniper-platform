// Скоринг соответствия кандидата вакансии.
// Логика перенесена из прототипа (matchScore/bestMatch) и переведена на данные из БД.

type CandidateLike = {
  profession?: string | null;
  skills: string[];
  expSalary?: number | null;
};

type RequestLike = {
  title: string;
  skills: string[];
  salaryFrom?: number | null;
  salaryTo?: number | null;
};

export function matchScore(candidate: CandidateLike, request: RequestLike): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Совпадение навыков — основной вес
  const candSkills = (candidate.skills || []).map((s) => s.toLowerCase().trim());
  const reqSkills = (request.skills || []).map((s) => s.toLowerCase().trim());
  if (reqSkills.length > 0) {
    const overlap = reqSkills.filter((s) => candSkills.includes(s));
    const skillScore = Math.round((overlap.length / reqSkills.length) * 60);
    score += skillScore;
    if (overlap.length > 0) reasons.push(`Совпадение навыков: ${overlap.join(", ")}`);
  } else {
    score += 20; // нет явных требований к навыкам — не штрафуем
  }

  // Совпадение профессии/должности с заголовком вакансии — грубое текстовое совпадение
  if (candidate.profession && request.title) {
    const prof = candidate.profession.toLowerCase();
    const title = request.title.toLowerCase();
    const profWords = prof.split(/\s+/).filter((w) => w.length > 2);
    const hit = profWords.some((w) => title.includes(w));
    if (hit) {
      score += 25;
      reasons.push("Профессия соответствует названию вакансии");
    }
  }

  // Зарплатные ожидания в вилке вакансии
  if (candidate.expSalary && (request.salaryFrom || request.salaryTo)) {
    const from = request.salaryFrom ?? 0;
    const to = request.salaryTo ?? Infinity;
    if (candidate.expSalary >= from && candidate.expSalary <= to) {
      score += 15;
      reasons.push("Ожидания по ЗП укладываются в вилку вакансии");
    } else if (candidate.expSalary <= to * 1.15) {
      score += 7; // немного выше вилки — тоже засчитываем частично
    }
  }

  return { score: Math.min(100, score), reasons };
}

export function bestMatch<T extends RequestLike & { id: string }>(
  candidate: CandidateLike,
  requests: T[]
): { request: T; score: number; reasons: string[] } | null {
  let best: { request: T; score: number; reasons: string[] } | null = null;
  for (const r of requests) {
    const m = matchScore(candidate, r);
    if (!best || m.score > best.score) best = { request: r, score: m.score, reasons: m.reasons };
  }
  return best && best.score >= 45 ? best : null;
}
