import Link from "next/link";

const REVENUE = [
  { source: "Комиссия платформы", value: "20% от тарифа закрытия", who: "Рекрутер", priority: "Обязательно" },
  { source: "Подписка работодателя", value: "$35/мес — безлимитные заявки", who: "Работодатель", priority: "Обязательно" },
  { source: "Депозит при заявке", value: "15% тарифа (возврат при отказе)", who: "Работодатель", priority: "Обязательно" },
  { source: "Верификация рекрутера", value: "$5 единоразово", who: "Рекрутер", priority: "Обязательно" },
  { source: "Буст заявки", value: "$15–30 за приоритет в ленте", who: "Работодатель", priority: "Желательно" },
  { source: "API-доступ для агентств", value: "$150/мес", who: "Агентство", priority: "Опционально" },
];

const STEPS = [
  {
    role: "Работодатель",
    color: "var(--red)",
    items: ["Публикует вакансию и выбирает тариф", "Вносит депозит 15% — заявка выходит на биржу", "Получает кандидатов от рекрутеров в канбане", "Подтверждает найм — запускается выплата"],
  },
  {
    role: "Рекрутер",
    color: "var(--info)",
    items: ["Смотрит открытые заявки на бирже", "Закрепляет заявку на 14 дней", "Ведёт кандидатов по воронке, общается в чате", "Получает выплату после гарантийного периода"],
  },
  {
    role: "Платформа",
    color: "var(--ok)",
    items: ["Модерирует заявки и верифицирует рекрутеров", "Держит депозит и вознаграждение в эскроу", "Удерживает комиссию 20% при выплате", "Считает рейтинг и разбирает споры"],
  },
];

function fmtUsd(n: number) {
  return "$" + n.toLocaleString("en-US");
}

export default function Landing() {
  const tariffExample = 700; // условный тариф закрытия, $
  const commission = Math.round(tariffExample * 0.2);
  const deposit = Math.round(tariffExample * 0.15);

  return (
    <div style={{ background: "var(--warm)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap" style={{ display: "flex", alignItems: "center", padding: "16px 26px" }}>
          <div className="sg" style={{ fontSize: 20, fontWeight: 700 }}>
            SNIPER<span style={{ color: "var(--red)" }}>.</span>
          </div>
          <div className="mini muted" style={{ marginLeft: 10 }}>recruit smarter</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Link href="/login" className="btn btn-ghost btn-sm">Войти</Link>
            <Link href="/register" className="btn btn-red btn-sm">Начать бесплатно</Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="wrap" style={{ padding: "64px 26px 40px", textAlign: "center" }}>
        <span className="pill pill-red" style={{ marginBottom: 16 }}>Маркетплейс рекрутеров Узбекистана</span>
        <h1 className="sg" style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.15, margin: "16px 0", letterSpacing: "-0.01em" }}>
          Работодатель платит только<br />за закрытую вакансию
        </h1>
        <p className="mini" style={{ fontSize: 15, color: "var(--mid)", maxWidth: 620, margin: "0 auto 28px", lineHeight: 1.6 }}>
          SNIPER соединяет компании с независимыми рекрутерами и агентствами на единой бирже
          вакансий по модели success fee. Никаких абонентских рисков для работодателя, прозрачный
          эскроу для рекрутера, комиссия платформы — только с результата.
        </p>
        <div className="flex gap8" style={{ justifyContent: "center" }}>
          <Link href="/register" className="btn btn-red btn-lg">Разместить вакансию</Link>
          <Link href="/register" className="btn btn-ghost btn-lg">Я рекрутер</Link>
        </div>
        <div className="mini muted" style={{ marginTop: 14 }}>
          Работающий MVP — можно зарегистрироваться и пройти весь цикл прямо сейчас.
        </div>
      </div>

      {/* KPI strip */}
      <div className="wrap" style={{ padding: "0 26px 50px" }}>
        <div className="grid-kpi">
          <div className="kpi"><div className="n" style={{ fontSize: 22 }}>20%</div><div className="l">Комиссия платформы с рекрутера</div></div>
          <div className="kpi"><div className="n" style={{ fontSize: 22 }}>15%</div><div className="l">Депозит работодателя при публикации</div></div>
          <div className="kpi"><div className="n" style={{ fontSize: 22 }}>$35</div><div className="l">Подписка работодателя / мес</div></div>
          <div className="kpi"><div className="n" style={{ fontSize: 22 }}>14 дн.</div><div className="l">Эксклюзив рекрутера на заявку</div></div>
        </div>
      </div>

      {/* How it works */}
      <div className="wrap" style={{ padding: "0 26px 50px" }}>
        <h2 className="sg" style={{ fontSize: 22, marginBottom: 20, textAlign: "center" }}>Как это работает</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {STEPS.map((s) => (
            <div key={s.role} className="card card-p">
              <div className="flex gap8" style={{ marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color }} />
                <b className="sg" style={{ fontSize: 15 }}>{s.role}</b>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {s.items.map((it, i) => (
                  <div key={i} className="mini" style={{ display: "flex", gap: 8 }}>
                    <span className="muted">{i + 1}.</span>
                    <span>{it}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Business model */}
      <div className="wrap" style={{ padding: "0 26px 50px" }}>
        <h2 className="sg" style={{ fontSize: 22, marginBottom: 20, textAlign: "center" }}>Бизнес-модель</h2>
        <div className="card" style={{ overflow: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Источник выручки</th>
                <th>Ставка</th>
                <th>С кого</th>
                <th>Приоритет</th>
              </tr>
            </thead>
            <tbody>
              {REVENUE.map((r) => (
                <tr key={r.source}>
                  <td><b className="mini">{r.source}</b></td>
                  <td className="mini">{r.value}</td>
                  <td className="mini muted">{r.who}</td>
                  <td>
                    <span
                      className={`pill ${r.priority === "Обязательно" ? "pill-ok" : r.priority === "Желательно" ? "pill-warn" : "pill-mut"}`}
                    >
                      {r.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unit economics example */}
      <div className="wrap" style={{ padding: "0 26px 50px" }}>
        <h2 className="sg" style={{ fontSize: 22, marginBottom: 20, textAlign: "center" }}>Юнит-экономика на примере одной вакансии</h2>
        <div className="card card-p" style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "grid", gap: 10 }}>
            <div className="flex" style={{ justifyContent: "space-between" }}>
              <span className="mini muted">Тариф закрытия (Senior-специалист)</span>
              <b className="sg">{fmtUsd(tariffExample)}</b>
            </div>
            <div className="flex" style={{ justifyContent: "space-between" }}>
              <span className="mini muted">Депозит при публикации (15%)</span>
              <span className="mini">{fmtUsd(deposit)}</span>
            </div>
            <div className="flex" style={{ justifyContent: "space-between" }}>
              <span className="mini muted">Комиссия платформы при найме (20%)</span>
              <b className="mini" style={{ color: "var(--red)" }}>{fmtUsd(commission)}</b>
            </div>
            <div className="flex" style={{ justifyContent: "space-between" }}>
              <span className="mini muted">Чистый доход рекрутера</span>
              <span className="mini">{fmtUsd(tariffExample - commission)}</span>
            </div>
            <div style={{ borderTop: "1px solid var(--line)", margin: "6px 0" }} />
            <div className="flex" style={{ justifyContent: "space-between" }}>
              <span className="mini muted">GMV с одной закрытой вакансии</span>
              <b className="sg">{fmtUsd(tariffExample)}</b>
            </div>
            <div className="flex" style={{ justifyContent: "space-between" }}>
              <span className="mini muted">Выручка платформы (без подписки/буста)</span>
              <b className="sg" style={{ color: "var(--ok)" }}>{fmtUsd(commission)}</b>
            </div>
          </div>
          <div className="hint" style={{ marginTop: 14 }}>
            При 50 закрытых вакансиях в месяц среднего тарифа — это ≈{fmtUsd(commission * 50)}/мес
            только от комиссии, без учёта подписок работодателей и буста заявок.
          </div>
        </div>
      </div>

      {/* Market */}
      <div className="wrap" style={{ padding: "0 26px 50px" }}>
        <div className="card card-p" style={{ borderLeft: "3px solid var(--info)" }}>
          <div className="sg" style={{ fontSize: 15, marginBottom: 8 }}>География запуска</div>
          <p className="mini" style={{ lineHeight: 1.7 }}>
            MVP — Ташкент (90%+ вакансий страны). Год 2 — все регионы Узбекистана. Год 3 — пилот в Казахстане.
            Требование локализации данных (Закон № ЗРУ-547): серверы и база данных — на территории Узбекистана.
          </p>
        </div>
      </div>

      {/* CTA / demo access */}
      <div className="wrap" style={{ padding: "0 26px 70px" }}>
        <div className="card card-p" style={{ textAlign: "center", background: "var(--dark)", color: "#fff", border: "none" }}>
          <div className="sg" style={{ fontSize: 20, marginBottom: 10 }}>Попробуйте прямо сейчас</div>
          <p className="mini" style={{ color: "rgba(255,255,255,.7)", maxWidth: 480, margin: "0 auto 20px" }}>
            Это рабочий MVP, а не кликабельный макет — можно зарегистрироваться, создать вакансию,
            внести депозит, закрепить заявку рекрутером и пройти весь цикл найма.
          </p>
          <div className="flex gap8" style={{ justifyContent: "center" }}>
            <Link href="/register" className="btn btn-red">Зарегистрироваться</Link>
            <Link href="/login" className="btn btn-soft" style={{ background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.2)" }}>
              Войти
            </Link>
          </div>
        </div>
      </div>

      <div className="mini muted" style={{ textAlign: "center", padding: "0 26px 40px" }}>
        SNIPER · recruit smarter — конфиденциально, для внутреннего использования
      </div>
    </div>
  );
}
