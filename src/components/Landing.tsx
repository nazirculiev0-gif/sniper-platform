import Link from "next/link";
import { Wallet, Clock3, ShieldCheck, LayoutGrid } from "lucide-react";
import { TARIFFS, fmtSuggestedRange } from "@/lib/tariffs";

const EMPLOYER_STEPS = [
  { t: "Опишите вакансию", d: "Название, требования, зарплатная вилка и сумма вознаграждения рекрутеру — вы указываете её сами, публикация занимает пару минут." },
  { t: "Получайте кандидатов", d: "Рекрутеры откликаются и ведут кандидатов по воронке — вы видите весь процесс в канбане." },
  { t: "Платите только за результат", d: "Оплата — только когда кандидат выходит на работу. Ничего не нашли — деньги вернутся." },
];

const RECRUITER_STEPS = [
  { t: "Выбирайте заявки", d: "Открытая биржа вакансий с фильтрами по грейду, отрасли и вознаграждению." },
  { t: "Ведите кандидатов", d: "Личная база, канбан-доска, чат с работодателем — всё в одном месте." },
  { t: "Получайте выплаты", d: "После подтверждённого найма вознаграждение поступает на ваш баланс." },
];

const VALUE_PROPS = [
  { icon: Wallet, t: "Без предоплаты", d: "Платите только за закрытую вакансию" },
  { icon: Clock3, t: "14 дней на активность", d: "Нет отклика — заявка автоматически возвращается на биржу" },
  { icon: ShieldCheck, t: "Рекрутеры верифицированы", d: "Каждый проходит проверку администратора платформы" },
  { icon: LayoutGrid, t: "Всё в одном месте", d: "Канбан кандидатов, чат и видеозвонки на платформе" },
];

const FAQ = [
  {
    q: "Сколько стоит разместить вакансию?",
    a: "Публикация вакансии бесплатна. Сумму вознаграждения рекрутеру вы указываете сами при создании заявки — грейд позиции лишь подсказывает ориентировочный рыночный уровень.",
  },
  {
    q: "Что если рекрутер не найдёт подходящего кандидата?",
    a: "Если за отведённый срок никто не откликнулся или нет активности, заявка автоматически возвращается на биржу — вы ничего не теряете.",
  },
  {
    q: "Можно ли, чтобы вакансию вели сразу несколько рекрутеров?",
    a: "Да, и это единственный режим работы платформы: на заявку может откликнуться сразу несколько рекрутеров. Вы видите кандидатов от каждого, их рейтинг и профиль, и сами решаете, чьего кандидата нанять.",
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

function HeroPreview() {
  return (
    <div className="card card-p" style={{ maxWidth: 380, marginLeft: "auto" }}>
      <div className="flex gap8" style={{ alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <b className="sg" style={{ fontSize: 15, display: "block" }}>Backend Developer</b>
          <span className="mini muted">ТехноКом · Ташкент</span>
        </div>
        <span className="pill pill-info" style={{ marginLeft: "auto" }}>В работе</span>
      </div>
      <div className="flex gap8 wrapf" style={{ marginBottom: 14 }}>
        <span className="tag">Новые · 3</span>
        <span className="tag">Интервью · 2</span>
        <span className="tag">Оффер · 1</span>
      </div>
      <div style={{ borderTop: "1px solid var(--line2)", paddingTop: 12, display: "grid", gap: 10 }}>
        <div className="flex gap8" style={{ alignItems: "center" }}>
          <span className="av" style={{ width: 30, height: 30, fontSize: 12, background: "var(--red)" }}>АР</span>
          <div style={{ flex: 1 }}>
            <b className="mini" style={{ display: "block" }}>Азиза Рахимова</b>
            <span className="mini muted">от Алмаз Рустамов</span>
          </div>
          <span className="pill" style={{ background: "var(--okbg)", color: "var(--ok)" }}>96% · Backend</span>
        </div>
        <div className="flex gap8" style={{ alignItems: "center" }}>
          <span className="av" style={{ width: 30, height: 30, fontSize: 12, background: "var(--info)" }}>ДС</span>
          <div style={{ flex: 1 }}>
            <b className="mini" style={{ display: "block" }}>Дмитрий Сон</b>
            <span className="mini muted">от Гульнара Ким</span>
          </div>
          <span className="pill" style={{ background: "var(--warnbg)", color: "var(--warn)" }}>78% · Backend</span>
        </div>
      </div>
      <div className="flex" style={{ justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line2)" }}>
        <span className="mini muted">Вознаграждение</span>
        <b className="sg" style={{ fontSize: 15 }}>4 200 000 сум</b>
      </div>
    </div>
  );
}

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
      <div className="wrap landing-hero-grid" style={{ padding: "72px 26px 56px" }}>
        <div>
          <h1 className="sg landing-hero-title" style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.15, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
            Нанимайте через проверенных рекрутеров — платите за результат
          </h1>
          <p className="mini" style={{ fontSize: 15, color: "var(--mid)", maxWidth: 480, margin: "0 0 28px", lineHeight: 1.6 }}>
            SNIPER соединяет компании с независимыми рекрутерами и агентствами Узбекистана.
            Публикуйте вакансию, получайте кандидатов от нескольких рекрутеров сразу и платите
            только тогда, когда человек выходит на работу.
          </p>
          <div className="flex gap8">
            <Link href="/register" className="btn btn-red btn-lg">Разместить вакансию</Link>
            <Link href="/register" className="btn btn-ghost btn-lg">Я рекрутер</Link>
          </div>
        </div>
        <HeroPreview />
      </div>

      {/* Value props */}
      <div className="wrap" style={{ padding: "0 26px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {VALUE_PROPS.map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--redbg)", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Icon size={18} />
                </div>
                <b className="mini" style={{ display: "block", marginBottom: 3 }}>{v.t}</b>
                <span className="mini muted">{v.d}</span>
              </div>
            );
          })}
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
        <h2 className="sg" style={{ fontSize: 24, marginBottom: 8, textAlign: "center" }}>Вы сами устанавливаете вознаграждение</h2>
        <p className="mini muted" style={{ textAlign: "center", marginBottom: 28 }}>
          Сумму за подбор указывает работодатель — грейд ниже лишь ориентир по рынку. Депозит 50% — опционален:
          с депозитом рекрутеры увереннее берутся за заявку, без депозита оплата происходит только после найма.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {Object.entries(TARIFFS).map(([key, t]) => (
            <div key={key} className="card card-p" style={{ textAlign: "center" }}>
              <div className="mini muted" style={{ marginBottom: 8 }}>{t.hint}</div>
              <b className="sg" style={{ fontSize: 15, display: "block", marginBottom: 10 }}>{t.label}</b>
              <div className="sg" style={{ fontSize: 18, fontWeight: 700 }}>{fmtSuggestedRange(t.suggestedRange)}</div>
              <div className="mini muted" style={{ marginTop: 4 }}>ориентировочно</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="wrap" style={{ padding: "0 26px 56px" }}>
        <h2 className="sg" style={{ fontSize: 24, marginBottom: 24, textAlign: "center" }}>Частые вопросы</h2>
        <div className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
          {FAQ.map((f, i) => (
            <div key={i} style={{ padding: "16px 20px", borderBottom: i < FAQ.length - 1 ? "1px solid var(--line2)" : "none" }}>
              <b className="mini" style={{ display: "block", marginBottom: 6 }}>{f.q}</b>
              <p className="mini muted" style={{ lineHeight: 1.6, margin: 0 }}>{f.a}</p>
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
