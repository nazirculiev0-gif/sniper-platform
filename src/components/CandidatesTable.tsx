"use client";

import { useMemo, useState } from "react";
import { Users, Target, Zap, Briefcase } from "lucide-react";
import AddCandidateModal from "@/components/AddCandidateModal";
import CandidateDetailModal from "@/components/CandidateDetailModal";
import { exportToCsv } from "@/lib/exportCsv";

const SEARCH_STATUS_LABEL: Record<string, { t: string; c: string }> = {
  active: { t: "Активно ищет", c: "pill-ok" },
  passive: { t: "Пассивно", c: "pill-info" },
  employed: { t: "Трудоустроен", c: "pill-mut" },
};

const GENDER_LABEL: Record<string, string> = { M: "М", F: "Ж" };

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

export default function CandidatesTable({ candidates, interviewsCount }: { candidates: any[]; interviewsCount: number }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const activeCount = candidates.filter((c) => c.searchStatus === "active").length;
  const matchedCount = candidates.filter((c) => c.match).length;

  const filtered = useMemo(() => {
    let list = candidates;
    if (status !== "all") list = list.filter((c) => c.searchStatus === status);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.profession || "").toLowerCase().includes(q) ||
        (c.skills || []).some((s: string) => s.toLowerCase().includes(q)) ||
        (c.desiredPositions || []).some((s: string) => s.toLowerCase().includes(q))
      );
    }
    return list;
  }, [candidates, query, status]);

  const exportList = () => {
    exportToCsv(
      `база-кандидатов-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((c) => ({
        ФИО: c.name,
        Пол: c.gender ? GENDER_LABEL[c.gender] : "",
        Возраст: c.age ?? "",
        Телефон: c.phone ?? "",
        Профессия: c.profession ?? "",
        "Желательные должности": (c.desiredPositions ?? []).join(", "),
        Отрасль: c.industry ?? "",
        "Статус поиска": c.searchStatus ? SEARCH_STATUS_LABEL[c.searchStatus].t : "",
        "Текущее место": c.currentEmployer ?? "",
        "Ожид. ЗП, сум": c.expSalary ?? "",
        Навыки: (c.skills ?? []).join(", "),
        Рекомендация: c.match ? `${c.match.score}% · ${c.match.title}` : "",
      }))
    );
  };

  return (
    <div>
      <div className="flex" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 className="sg" style={{ fontSize: 20, fontWeight: 700 }}>Моя база кандидатов</h1>
          <div className="mini muted" style={{ marginTop: 2 }}>{candidates.length} человек — ваша личная CRM</div>
        </div>
        <button className="btn btn-red" onClick={() => setAddOpen(true)}>+ Добавить кандидата</button>
      </div>

      <div className="grid-kpi" style={{ marginBottom: 18 }}>
        <div className="kpi">
          <div className="ic" style={{ background: "#7C3AED18", color: "#7C3AED" }}><Users size={19} /></div>
          <div className="n" style={{ fontSize: 26 }}>{candidates.length}</div>
          <div className="l">Всего в базе</div>
        </div>
        <div className="kpi">
          <div className="ic" style={{ background: "#00A38C18", color: "#00A38C" }}><Zap size={19} /></div>
          <div className="n" style={{ fontSize: 26 }}>{activeCount}</div>
          <div className="l">Активно ищут</div>
        </div>
        <div className="kpi">
          <div className="ic" style={{ background: "#D4003B18", color: "#D4003B" }}><Target size={19} /></div>
          <div className="n" style={{ fontSize: 26 }}>{matchedCount}</div>
          <div className="l">Подходят под заявки</div>
        </div>
        <div className="kpi">
          <div className="ic" style={{ background: "#0091AE18", color: "#0091AE" }}><Briefcase size={19} /></div>
          <div className="n" style={{ fontSize: 26 }}>{interviewsCount}</div>
          <div className="l">Собеседований</div>
        </div>
      </div>

      <div className="flex gap8 wrapf" style={{ marginBottom: 14 }}>
        <input
          className="inp"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Поиск по имени, профессии, навыку…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="inp" style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Все статусы</option>
          <option value="active">Активно ищет</option>
          <option value="passive">Пассивно</option>
          <option value="employed">Трудоустроен</option>
        </select>
        <button className="btn btn-ghost btn-sm" disabled={filtered.length === 0} onClick={exportList}>
          Экспорт в Excel
        </button>
      </div>

      {candidates.length === 0 && (
        <div className="card card-p mini muted">Пока нет кандидатов — добавьте первого кнопкой выше.</div>
      )}
      {candidates.length > 0 && filtered.length === 0 && (
        <div className="card card-p mini muted">Ничего не найдено по этому запросу.</div>
      )}

      {filtered.length > 0 && (
        <div className="card" style={{ overflow: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Кандидат</th>
                <th>Пол</th>
                <th>Возраст</th>
                <th>Телефон</th>
                <th>Профессия</th>
                <th>Желательные должности</th>
                <th>Отрасль</th>
                <th>Статус поиска</th>
                <th>Текущее место</th>
                <th className="r">Ожид. ЗП</th>
                <th>Рекомендация</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const st = c.searchStatus ? SEARCH_STATUS_LABEL[c.searchStatus] : null;
                return (
                  <tr key={c.id} className="click" onClick={() => setSelected(c)}>
                    <td>
                      <div className="flex gap8" style={{ alignItems: "center" }}>
                        <div className="av" style={{ width: 28, height: 28, fontSize: 11 }}>
                          {c.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <b className="mini" style={{ display: "block" }}>{c.name}</b>
                          {c.skills?.length > 0 && <span className="mini muted">{c.skills.slice(0, 2).join(", ")}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="mini">{c.gender ? GENDER_LABEL[c.gender] : "—"}</td>
                    <td className="mini">{c.age ?? "—"}</td>
                    <td className="mini">{c.phone || "—"}</td>
                    <td className="mini">{c.profession || "—"}</td>
                    <td className="mini">{c.desiredPositions?.length > 0 ? c.desiredPositions.join(", ") : "—"}</td>
                    <td className="mini">{c.industry || "—"}</td>
                    <td>{st ? <span className={`pill ${st.c}`}>{st.t}</span> : <span className="mini muted">—</span>}</td>
                    <td className="mini">{c.currentEmployer || "—"}</td>
                    <td className="r mini">{fmtSum(c.expSalary)}</td>
                    <td>
                      {c.match ? (
                        <span
                          className="pill pill-ok"
                          style={{ background: c.match.score >= 70 ? "var(--okbg)" : "var(--warnbg)", color: c.match.score >= 70 ? "var(--ok)" : "var(--warn)" }}
                          title={c.match.reasons.join("; ")}
                        >
                          {c.match.score}% · {c.match.title}
                        </span>
                      ) : (
                        <span className="mini muted">Нет подходящих заявок</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && <AddCandidateModal onClose={() => setAddOpen(false)} />}
      {selected && (
        <CandidateDetailModal
          candidate={selected}
          canEdit
          onClose={() => setSelected(null)}
          onUpdated={(updated) => setSelected((prev: any) => (prev ? { ...prev, ...updated } : prev))}
        />
      )}
    </div>
  );
}
