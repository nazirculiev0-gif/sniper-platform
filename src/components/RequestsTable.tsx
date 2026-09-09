"use client";

import { useState } from "react";
import Link from "next/link";
import { TARIFFS } from "@/lib/tariffs";

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
  const [tab, setTab] = useState("all");

  const list =
    tab === "all" ? requests : requests.filter((r) => TABS.find((t) => t.key === tab)?.statuses?.includes(r.status));

  return (
    <div>
      <div className="flex gap8" style={{ marginBottom: 14 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`btn btn-sm ${tab === t.key ? "btn-dark" : "btn-ghost"}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 && <div className="card card-p mini muted">Ничего не найдено.</div>}

      {list.length > 0 && (
        <div className="card" style={{ overflow: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Вакансия</th>
                <th>Режим</th>
                {role === "EMPLOYER" && <th>Рекрутер(ы)</th>}
                <th className="r">Кандидаты</th>
                <th className="r">Вознагр.</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
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
                        {r.mode === "EXCLUSIVE" && <span className="tag" style={{ color: "var(--red)" }}>Эксклюзив</span>}
                        {r.depositPaid && <span className="tag" style={{ color: "var(--ok)" }}>Депозит</span>}
                        {r.mode === "OPEN" && r.participants.length > 0 && (
                          <span className="tag">Открытый · {r.participants.length}</span>
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
    </div>
  );
}
