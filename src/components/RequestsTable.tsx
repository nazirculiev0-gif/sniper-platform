"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TARIFFS } from "@/lib/tariffs";
import { exportToCsv } from "@/lib/exportCsv";
import Pagination from "@/components/Pagination";

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

const STATUS_LABEL: Record<string, { t: string; c: string }> = {
  DRAFT: { t: "Черновик", c: "pill-mut" },
  MODERATION: { t: "На модерации", c: "pill-warn" },
  OPEN: { t: "На бирже", c: "pill-ok" },
  IN_PROGRESS: { t: "В работе", c: "pill-info" },
  FILLED: { t: "Найм закрыт", c: "pill-ok" },
  CLOSED: { t: "Закрыто", c: "pill-mut" },
};

const TABS = [
  { key: "all", label: "Все" },
  { key: "open", label: "На бирже", statuses: ["OPEN", "MODERATION"] },
  { key: "progress", label: "В работе", statuses: ["IN_PROGRESS"] },
  { key: "closed", label: "Закрыто", statuses: ["FILLED", "CLOSED"] },
];

export default function RequestsTable({ requests, role }: { requests: any[]; role: string }) {
  const PAGE_SIZE = 20;
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const list = useMemo(() => {
    let l =
      tab === "all" ? requests : requests.filter((r) => TABS.find((t) => t.key === tab)?.statuses?.includes(r.status));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      l = l.filter((r) => r.title.toLowerCase().includes(q));
    }
    return l;
  }, [requests, tab, query]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [list, page]
  );

  const exportList = () => {
    exportToCsv(
      `заявки-${new Date().toISOString().slice(0, 10)}.csv`,
      list.map((r) => {
        const st = STATUS_LABEL[r.status];
        const tariff = TARIFFS[r.tariffCategory as keyof typeof TARIFFS];
        return {
          Вакансия: r.title,
          Грейд: tariff?.label ?? "",
          Статус: st.t,
          Депозит: r.depositPaid ? "Да" : "Нет",
          Рекрутеров: r.participants.length,
          Кандидатов: r._count?.candidates ?? 0,
          "Вознаграждение, сум": r.rewardGross,
        };
      })
    );
  };

  return (
    <div>
      <div className="flex gap8 wrapf" style={{ marginBottom: 14, alignItems: "center" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`btn btn-sm ${tab === t.key ? "btn-dark" : "btn-ghost"}`}
            onClick={() => { setTab(t.key); setPage(1); }}
          >
            {t.label}
          </button>
        ))}
        <input
          className="inp"
          style={{ flex: 1, minWidth: 180, marginLeft: 8 }}
          placeholder="Поиск по названию…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
        <button className="btn btn-ghost btn-sm" disabled={list.length === 0} onClick={exportList}>
          Экспорт в Excel
        </button>
      </div>

      {list.length === 0 && <div className="card card-p mini muted">Ничего не найдено.</div>}

      {list.length > 0 && (
        <div className="card" style={{ overflow: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Вакансия</th>
                <th>Метки</th>
                {role === "EMPLOYER" && <th>Рекрутер(ы)</th>}
                <th className="r">Кандидаты</th>
                <th className="r">Вознагр.</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => {
                const st = STATUS_LABEL[r.status];
                const tariff = TARIFFS[r.tariffCategory as keyof typeof TARIFFS];
                return (
                  <tr key={r.id} className="click" onClick={() => (window.location.href = `/dashboard/requests/${r.id}`)}>
                    <td>
                      <b className="mini">{r.title}</b>
                      <div className="mini muted">{tariff?.label} · Ташкент</div>
                    </td>
                    <td>
                      <div className="flex gap8 wrapf">
                        {r.depositPaid && <span className="tag" style={{ color: "var(--ok)" }}>Депозит</span>}
                        {r.participants.length > 0 && (
                          <span className="tag">Рекрутеров · {r.participants.length}</span>
                        )}
                      </div>
                    </td>
                    {role === "EMPLOYER" && (
                      <td>
                        <div className="flex gap8 wrapf">
                          {r.participants.length === 0 && <span className="mini muted">—</span>}
                          {r.participants.map((p: any) => (
                            <Link
                              key={p.recruiterId}
                              href={`/dashboard/recruiters/${p.recruiterId}`}
                              className="flex gap8"
                              style={{ textDecoration: "none", color: "inherit" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="av" style={{ width: 20, height: 20, fontSize: 9 }}>
                                {p.recruiter.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                              </span>
                              <span className="mini">{p.recruiter.name}</span>
                            </Link>
                          ))}
                        </div>
                      </td>
                    )}
                    <td className="r mini">{r._count?.candidates ?? 0}</td>
                    <td className="r mini"><b>{fmtSum(r.rewardGross)}</b></td>
                    <td><span className={`pill ${st.c}`}>{st.t}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} total={list.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  );
}
