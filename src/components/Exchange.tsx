"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TARIFFS } from "@/lib/tariffs";

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

export default function Exchange({ requests, verified }: { requests: any[]; verified: boolean }) {
  const router = useRouter();
  const [grade, setGrade] = useState("Все");
  const [industry, setIndustry] = useState("Все");
  const [sort, setSort] = useState("reward");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const industries = useMemo(
    () => Array.from(new Set(requests.map((r) => r.company?.industry).filter(Boolean))),
    [requests]
  );

  const filtered = useMemo(() => {
    let list = requests.slice();
    if (grade !== "Все") list = list.filter((r) => r.tariffCategory === grade);
    if (industry !== "Все") list = list.filter((r) => r.company?.industry === industry);
    if (sort === "reward") list.sort((a, b) => b.rewardGross - a.rewardGross);
    if (sort === "new") list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [requests, grade, industry, sort]);

  const take = async (id: string) => {
    setLoadingId(id);
    const res = await fetch(`/api/requests/${id}/take`, { method: "POST" });
    setLoadingId(null);
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      alert(data.error || "Не удалось взять заявку");
    }
  };

  return (
    <div>
      {!verified && (
        <div className="card card-p" style={{ marginBottom: 18, borderLeft: "4px solid var(--warn)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--warnbg)", color: "var(--warn)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>⏳</div>
          <div style={{ flex: 1 }}>
            <b className="sg">Требуется верификация</b>
            <div className="mini muted">Администратор проверит ваш аккаунт — после этого откроется возможность брать заявки.</div>
          </div>
        </div>
      )}

      <div className="flex gap8 wrapf" style={{ marginBottom: 18 }}>
        <div style={{ minWidth: 160 }}>
          <label className="mini muted" style={{ display: "block", marginBottom: 4 }}>Грейд</label>
          <select className="inp" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option>Все</option>
            {Object.entries(TARIFFS).map(([key, t]) => <option key={key} value={key}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 160 }}>
          <label className="mini muted" style={{ display: "block", marginBottom: 4 }}>Отрасль</label>
          <select className="inp" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option>Все</option>
            {industries.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <label className="mini muted" style={{ display: "block", marginBottom: 4 }}>Сортировка</label>
          <select className="inp" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="reward">По вознаграждению</option>
            <option value="new">Сначала новые</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 && <div className="card card-p mini muted">Нет заявок по выбранным фильтрам.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {filtered.map((r) => {
          const tariff = TARIFFS[r.tariffCategory as keyof typeof TARIFFS];
          return (
            <div key={r.id} className="card card-p card-hover">
              <div className="flex gap8" style={{ marginBottom: 10 }}>
                <div className="av" style={{ width: 34, height: 34, fontSize: 13, background: "var(--info)" }}>
                  {r.company?.name?.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b className="mini" style={{ display: "block" }}>{r.title}</b>
                  <div className="mini muted">{r.company?.name} · Ташкент</div>
                </div>
              </div>
              <div className="flex gap8 wrapf" style={{ marginBottom: 10 }}>
                <span className="tag">{tariff?.label}</span>
                {r.company?.industry && <span className="tag">{r.company.industry}</span>}
                <span className="tag">{r.mode === "EXCLUSIVE" ? "Эксклюзив" : "Открытая"}</span>
              </div>
              {r.depositPaid && (
                <div className="mini" style={{ color: "var(--ok)", marginBottom: 8 }}>📄 Депозит внесён · без задержек</div>
              )}
              <p className="mini muted" style={{ marginBottom: 12, lineHeight: 1.5 }}>
                {r.description.length > 100 ? r.description.slice(0, 100) + "…" : r.description}
              </p>
              <div className="card-p" style={{ padding: 0, marginBottom: 12 }}>
                <div className="mini muted">Вознаграждение за эксклюзив</div>
                <b className="sg" style={{ fontSize: 17 }}>{fmtSum(r.rewardGross)}</b>
              </div>
              <div className="flex gap8">
                <Link href={`/dashboard/requests/${r.id}`} className="btn btn-ghost btn-sm">Вопрос</Link>
                <button
                  className="btn btn-red btn-sm"
                  style={{ marginLeft: "auto" }}
                  disabled={!verified || loadingId === r.id}
                  onClick={() => take(r.id)}
                >
                  {loadingId === r.id ? "…" : "Взять заявку"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
