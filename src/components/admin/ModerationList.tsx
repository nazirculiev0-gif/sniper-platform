"use client";

import { useRouter } from "next/navigation";

const MOD_LABEL: Record<string, { t: string; c: string }> = {
  PENDING: { t: "На модерации", c: "pill-warn" },
  APPROVED: { t: "Одобрена", c: "pill-ok" },
  REJECTED: { t: "Отклонена", c: "pill-red" },
};

export default function ModerationList({ requests }: { requests: any[] }) {
  const router = useRouter();

  const decide = async (id: string, decision: "APPROVED" | "REJECTED") => {
    const res = await fetch(`/api/admin/requests/${id}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    if (res.ok) router.refresh();
    else alert("Не удалось обновить статус");
  };

  if (requests.length === 0) return <div className="card card-p mini muted">Заявок нет.</div>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {requests.map((r) => {
        const m = MOD_LABEL[r.moderation];
        return (
          <div key={r.id} className="card card-p" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b className="sg" style={{ fontSize: 14.5 }}>{r.title}</b>
              <div className="mini muted" style={{ marginTop: 2 }}>{r.company?.name}</div>
            </div>
            <span className={`pill ${m.c}`}>{m.t}</span>
            {r.moderation === "PENDING" && (
              <>
                <button className="btn btn-ok btn-sm" onClick={() => decide(r.id, "APPROVED")}>Одобрить</button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} onClick={() => decide(r.id, "REJECTED")}>Отклонить</button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
