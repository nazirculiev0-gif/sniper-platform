function fmtSum(n?: number | null) {
  if (!n) return "0 сум";
  return n.toLocaleString("ru-RU") + " сум";
}

const PAYOUT_STATUS: Record<string, { t: string; c: string }> = {
  PENDING_INVOICE: { t: "Ожидает оплаты", c: "pill-mut" },
  IN_ESCROW: { t: "В эскроу (удержание)", c: "pill-warn" },
  RELEASED: { t: "Выплачено рекрутеру", c: "pill-ok" },
  REFUNDED: { t: "Возврат", c: "pill-red" },
};

export default function EmployerPaymentsView({ requests }: { requests: any[] }) {
  const depositsPaid = requests
    .filter((r) => r.depositPaid)
    .reduce((a, r) => a + r.depositAmount, 0);
  const withPayout = requests.filter((r) => r.payout);
  const inEscrow = withPayout
    .filter((r) => r.payout.status === "IN_ESCROW")
    .reduce((a, r) => a + r.payout.gross, 0);
  const released = withPayout
    .filter((r) => r.payout.status === "RELEASED")
    .reduce((a, r) => a + r.payout.gross, 0);
  const totalCommitted = withPayout.reduce((a, r) => a + r.payout.gross, 0);

  return (
    <div>
      <div className="grid-kpi" style={{ marginBottom: 18 }}>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{fmtSum(totalCommitted)}</div>
          <div className="l">Всего по успешным наймам</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{fmtSum(depositsPaid)}</div>
          <div className="l">Внесено депозитов</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{fmtSum(inEscrow)}</div>
          <div className="l">В эскроу (удержание)</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{fmtSum(released)}</div>
          <div className="l">Выплачено рекрутерам</div>
        </div>
      </div>

      <div className="sectit" style={{ fontSize: 15, margin: "0 0 10px" }}>История по успешным наймам</div>
      {withPayout.length === 0 && (
        <div className="card card-p mini muted">Пока нет закрытых наймов — здесь появится история, как только вы подтвердите первый найм.</div>
      )}
      {withPayout.length > 0 && (
        <div className="card" style={{ overflow: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Вакансия</th>
                <th className="r">Вознаграждение</th>
                <th className="r">Комиссия платформы</th>
                <th className="r">Рекрутеру</th>
                <th>Статус</th>
                <th>Дата найма</th>
              </tr>
            </thead>
            <tbody>
              {withPayout.map((r) => {
                const st = PAYOUT_STATUS[r.payout.status];
                return (
                  <tr key={r.id}>
                    <td><b className="mini">{r.title}</b></td>
                    <td className="r mini">{fmtSum(r.payout.gross)}</td>
                    <td className="r mini" style={{ color: "var(--red)" }}>{fmtSum(r.payout.commission)}</td>
                    <td className="r mini"><b>{fmtSum(r.payout.gross - (r.payout.commission ?? 0))}</b></td>
                    <td><span className={`pill ${st.c}`}>{st.t}</span></td>
                    <td className="mini">{new Date(r.payout.hireDate).toLocaleDateString("ru-RU")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="sectit" style={{ fontSize: 15, margin: "24px 0 10px" }}>Депозиты по вакансиям</div>
      {requests.length === 0 && <div className="card card-p mini muted">Вы ещё не публиковали заявок.</div>}
      {requests.length > 0 && (
        <div className="card" style={{ overflow: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Вакансия</th>
                <th className="r">Депозит</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td><b className="mini">{r.title}</b></td>
                  <td className="r mini">{r.depositAmount > 0 ? fmtSum(r.depositAmount) : "—"}</td>
                  <td>
                    {r.depositAmount === 0 ? (
                      <span className="mini muted">Без депозита</span>
                    ) : r.depositPaid ? (
                      <span className="pill pill-ok">Внесён</span>
                    ) : (
                      <span className="pill pill-mut">Не внесён</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
