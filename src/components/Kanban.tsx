"use client";

import { useRouter } from "next/navigation";

const STAGES: { k: string; t: string }[] = [
  { k: "NEW", t: "Новые" },
  { k: "SCREENING", t: "Скрининг" },
  { k: "INTERVIEW", t: "Интервью" },
  { k: "OFFER", t: "Оффер" },
  { k: "OFFER_ACCEPTED", t: "Оффер принят" },
  { k: "HIRED", t: "Нанят" },
  { k: "REJECTED", t: "Отказ" },
];

export default function Kanban({
  requestId,
  candidates,
  role,
  canEdit,
  canConfirmHire,
  payoutExists,
}: {
  requestId: string;
  candidates: any[];
  role: string;
  canEdit: boolean;
  canConfirmHire: boolean;
  payoutExists: boolean;
}) {
  const router = useRouter();

  const moveStage = async (candidateId: string, stage: string) => {
    const res = await fetch(`/api/candidates/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (res.ok) router.refresh();
    else alert("Не удалось переместить кандидата");
  };

  const confirmHire = async (candidateId: string) => {
    if (!confirm("Подтвердить найм этого кандидата? Будет создан эскроу-платёж.")) return;
    const res = await fetch(`/api/requests/${requestId}/confirm-hire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
    });
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      alert(data.error || "Не удалось подтвердить найм");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 10, overflowX: "auto" }}>
      {STAGES.map((s) => {
        const inStage = candidates.filter((c) => c.stage === s.k);
        const stageIdx = STAGES.findIndex((x) => x.k === s.k);
        return (
          <div key={s.k} className="card" style={{ minWidth: 160 }}>
            <div className="card-h" style={{ padding: "10px 12px" }}>
              <h3 style={{ fontSize: 12.5 }}>{s.t}</h3>
              <span className="mini muted" style={{ marginLeft: "auto" }}>{inStage.length}</span>
            </div>
            <div style={{ padding: 8, display: "grid", gap: 6, minHeight: 40 }}>
              {inStage.map((c) => (
                <div key={c.id} className="card card-p" style={{ padding: 10 }}>
                  <b className="mini">{c.name}</b>
                  <div className="mini muted">{c.profession || "—"}</div>
                  {canEdit && stageIdx < STAGES.length - 1 && s.k !== "REJECTED" && (
                    <div className="flex gap8" style={{ marginTop: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "3px 8px" }}
                        onClick={() => moveStage(c.id, STAGES[stageIdx + 1].k)}
                      >
                        Дальше →
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "3px 8px", color: "var(--red)" }}
                        onClick={() => moveStage(c.id, "REJECTED")}
                      >
                        Отказ
                      </button>
                    </div>
                  )}
                  {canConfirmHire && s.k === "OFFER_ACCEPTED" && !payoutExists && (
                    <button
                      className="btn btn-ok btn-sm btn-block"
                      style={{ marginTop: 6 }}
                      onClick={() => confirmHire(c.id)}
                    >
                      Подтвердить найм
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
