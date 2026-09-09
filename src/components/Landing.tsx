import Link from "next/link";
import { TARIFFS } from "@/lib/tariffs";

function fmtSum(n: number) {
  return n.toLocaleString("ru-RU") + " сум";
}

const EMPLOYER_STEPS = [
  { t: "Опишите вакансию", d: "Название, требования, зарплатная вилка и тариф закрытия — публикация занимает пару минут." },
  { t: "Получайте кандидатов", d: "Рекрутеры откликаются и ведут кандидатов по воронке — вы видите весь процесс в канбане." },
  { t: "Платите только за результат", d: "Оплата — только когда кандидат выходит на работу. Ничего не нашли — деньги вернутся." },
];

const RECRUITER_STEPS = [
  { t: "Выбирайте заявки", d: "Открытая биржа вакансий с фильтрами по грейду, отрасли и вознаграждению." },
  { t: "Ведите кандидатов", d: "Личная база, канбан-доска, чат с работодателем — всё в одном месте." },
  { t: "Получайте выплаты", d: "После подтверждённого найма вознаграждение поступает на ваш баланс." },
];

const FAQ = [
  {
    q: "Сколько стоит разместить вакансию?",
    a: "Публикация вакансии бесплатна. Вы платите только вознаграждение рекрутеру после того, как кандидат выйдет на работу — вознаграждение зависит от выбранного тарифа (грейда позиции).",
  },
  {
    q: "Что если рекрутер не найдёт подходящего кандидата?",
    a: "Если за срок эксклюзива никто не откликнулся или рекрутер не показал прогресса, заявка автоматически возвращается на биржу — вы ничего не теряете.",
  },
  {
    q: "Как проверяются рекрутеры?",
    a: "Каждый рекрутер проходит верификацию администратора платформы перед тем, как получает доступ к бирже заявок.",
  },
  {
    q: "Могу ли я вести переговоры прямо на платформе?",
    a: "Да — у каждой заявки есть встроенный чат и видеозвонки, так что вся коммуникация с рекрутером или кандидатом остаётся в одном месте.",
  },
];

export default function Landing() {
  return (
    <div style={{ background: "var(--warm)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, zIndex: 10 }}>
        <div className="wrap flex gap8 wrapf" style={{ padding: "16px 26px" }}>
          <div className="sg" style={{ fontSize: 20, fontWeight: 700 }}>
            SNIPER<span style={{ color: "var(--red)" }}>.</span>
          </div>
          <nav className="flex gap8" style={{ marginLeft: 24 }}>
            <a href="#how" className="mini muted" style={{ textDecoration: "none" }}>Как это работает</a>
            <a href="#pricing" className="mini muted" style={{ textDecoration: "none", marginLeft: 20 }}>Тарифы</a>
            <a href="#faq" className="mini muted" style={{ textDecoration: "none", marginLeft: 20 }}>Вопросы</a>
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Link href="/login" className="btn btn-ghost btn-sm">Войти</Link>
            <Link href="/register" className="btn btn-red btn-sm">Начать бесплатно</Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="wrap" style={{ padding: "72px 26px 48px", textAlign: "center" }}>
        <span className="pill pill-red" style={{ marginBottom: 16 }}>Биржа рекрутинга в Узбекистане</span>
        <h1 className="sg landing-hero-title" style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.15, margin: "16px 0", letterSpacing: "-0.01em" }}>
          Нанимайте через проверенных<br />рекрутеров — платите за результат
        </h1>
        <p className="mini" style={{ fontSize: 15, color: "var(--mid)", maxWidth: 600, margin: "0 auto 28px", lineHeight: 1.6 }}>
          SNIPER соединяет компании с независимыми рекрутерами и агентствами на одной платформе.
          Публикуйте вакансию, получайте кандидатов от нескольких рекрутеров сразу и платите
          только тогда, когда человек выходит на работу.
        </p>
        <div className="flex gap8" style={{ justifyContent: "center" }}>
          <Link href="/register" className="btn btn-red btn-lg">Разместить вакансию</Link>
          <Link href="/register" className="btn btn-ghost btn-lg">Я рекрутер</Link>
        </div>
      </div>

      {/* Value props strip */}
      <div className="wrap" style={{ padding: "0 26px 56px" }}>
        <div className="grid-kpi">
          <div className="kpi">
            <div className="n" style={{ fontSize: 20 }}>Без предоплаты</div>
            <div className="l">Платите только за закрытую вакансию</div>
          </div>
          <div className="kpi">
            <div className="n" style={{ fontSize: 20 }}>14 дней</div>
            <div className="l">На эксклюзивную работу рекрутера над заявкой</div>
          </div>
          <div className="kpi">
            <div className="n" style={{ fontSize: 20 }}>Верифицированные</div>
            <div className="l">Все рекрутеры проходят проверку администратора</div>
          </div>
          <div className="kpi">
            <div className="n" style={{ fontSize: 20 }}>Всё в одном месте</div>
            <div className="l">Канбан кандидатов, чат и видеозвонки на платформе</div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div id="how" className="wrap" style={{ padding: "0 26px 56px" }}>
        <h2 className="sg" style={{ fontSize: 24, marginBottom: 28, textAlign: "center" }}>Как это работает</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
          <div>
            <div className="pill pill-ok" style={{ marginBottom: 14 }}>Для работодателя</div>
            <div style={{ display: "grid", gap: 16 }}>
              {EMPLOYER_STEPS.map((s, i) => (
                <div key={i} className="flex gap8" style={{ alignItems: "flex-start" }}>
                  <div className="av" style={{ width: 28, height: 28, fontSize: 12, background: "var(--dark)", flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <b className="mini" style={{ display: "block", marginBottom: 2 }}>{s.t}</b>
                    <span className="mini muted">{s.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="pill pill-info" style={{ marginBottom: 14 }}>Для рекрутера</div>
            <div style={{ display: "grid", gap: 16 }}>
              {RECRUITER_STEPS.map((s, i) => (
                <div key={i} className="flex gap8" style={{ alignItems: "flex-start" }}>
                  <div className="av" style={{ width: 28, height: 28, fontSize: 12, background: "var(--info)", flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <b className="mini" style={{ display: "block", marginBottom: 2 }}>{s.t}</b>
                    <span className="mini muted">{s.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="wrap" style={{ padding: "0 26px 56px" }}>
        <h2 className="sg" style={{ fontSize: 24, marginBottom: 8, textAlign: "center" }}>Тарифы закрытия вакансий</h2>
        <p className="mini muted" style={{ textAlign: "center", marginBottom: 28 }}>
          Фиксированная сумма зависит от грейда позиции. Депозит 15% вносится при публикации, остаток — после подтверждения найма.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {Object.entries(TARIFFS).map(([key, t]) => (
            <div key={key} className="card card-p" style={{ textAlign: "center" }}>
              <div className="mini muted" style={{ marginBottom: 8 }}>{t.hint}</div>
              <b className="sg" style={{ fontSize: 15, display: "block", marginBottom: 10 }}>{t.label}</b>
              <div className="sg" style={{ fontSize: 20, fontWeight: 700 }}>{fmtSum(t.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="wrap" style={{ padding: "0 26px 56px" }}>
        <h2 className="sg" style={{ fontSize: 24, marginBottom: 24, textAlign: "center" }}>Частые вопросы</h2>
        <div style={{ display: "grid", gap: 10, maxWidth: 720, margin: "0 auto" }}>
          {FAQ.map((f, i) => (
            <div key={i} className="card card-p">
              <b className="mini" style={{ display: "block", marginBottom: 6 }}>{f.q}</b>
              <p className="mini muted" style={{ lineHeight: 1.6 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="wrap" style={{ padding: "0 26px 70px" }}>
        <div className="card card-p" style={{ textAlign: "center", background: "var(--dark)", color: "#fff", border: "none" }}>
          <div className="sg" style={{ fontSize: 20, marginBottom: 10 }}>Готовы начать?</div>
          <p className="mini" style={{ color: "rgba(255,255,255,.7)", maxWidth: 440, margin: "0 auto 20px" }}>
            Регистрация бесплатна и занимает меньше минуты — выберите роль и приступайте к работе.
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
        SNIPER · recruit smarter
      </div>
    </div>
  );
}
