"use client";

import { useRouter } from "next/navigation";

function fmtSum(n?: number | null) {
  return (n ?? 0).toLocaleString("ru-RU") + " сум";
}

export default function RecruitersList({ recruiters }: { recruiters: any[] }) {
  const router = useRouter();

  const verify = async (id: string) => {
    const res = await fetch(`/api/admin/recruiters/${id}/verify`, { method: "POST" });
    if (res.ok) router.refresh();
    else alert("Не удалось верифицировать");
  };

  if (recruiters.length === 0) return <div className="card card-p mini muted">Рекрутеров нет.</div>;

  return (
    <div className="card" style={{ overflow: "auto" }}>
      <table className="tbl">
        <thead>
          <tr>
            <th>Имя</th><th>Тип</th><th>Email</th><th>Баланс</th><th>Заявок</th><th>Кандидатов</th><th>Статус</th><th></th>
          </tr>
        </thead>
        <tbody>
          {recruiters.map((r) => (
            <tr key={r.id}>
              <td><b>{r.name}</b></td>
              <td className="mini muted">{r.type === "AGENCY" ? "Агентство" : "Соло"}</td>
              <td className="mini muted">{r.user?.email}</td>
              <td className="mini"><b className="sg">{fmtSum(r.balance)}</b></td>
              <td className="mini">{r._count?.participations ?? 0}</td>
              <td className="mini">{r._count?.candidates ?? 0}</td>
              <td>
                {r.verified
                  ? <span className="pill pill-ok">Верифицирован</span>
                  : <span className="pill pill-warn">Не проверен</span>}
              </td>
              <td>
                {!r.verified && (
                  <button className="btn btn-red btn-sm" onClick={() => verify(r.id)}>Верифицировать</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
