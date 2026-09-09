"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TARIFFS } from "@/lib/tariffs";

const STATUS_LABEL: Record<string, { t: string; c: string }> = {
  DRAFT: { t: "Черновик", c: "pill-mut" },
  MODERATION: { t: "На модерации", c: "pill-warn" },
  OPEN: { t: "Открыта", c: "pill-ok" },
  IN_PROGRESS: { t: "В работе", c: "pill-info" },
  FILLED: { t: "Закрыта наймом", c: "pill-red" },
  CLOSED: { t: "Закрыта", c: "pill-mut" },
};

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

function daysLeft(deadline?: string | null) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function RequestList({ requests, role }: { requests: any[]; role: string }) {
  const router = useRouter();

  const take = async (id: string) => {
    const res = await fetch(`/api/requests/${id}/take`, { method: "POST" });
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      alert(data.error || "Не удалось взять заявку");
    }
  };

  if (requests.length === 0) {
    return <div className="card card-p mini muted">Пока нет заявок.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {requests.map((r) => {
        const st = STATUS_LABEL[r.status] || STATUS_LABEL.DRAFT;
        const tariff = TARIFFS[r.tariffCategory as keyof typeof TARIFFS];
        const left = r.status === "IN_PROGRESS" ? daysLeft(r.claimDeadline) : null;
        return (
          <div key={r.id} className="card card-p" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/dashboard/requests/${r.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                <b className="sg" style={{ fontSize: 14.5 }}>{r.title}</b>
              </Link>
              <div className="mini muted" style={{ marginTop: 2 }}>
                {r.company?.name} · {tariff?.label ?? r.tariffCategory} · {fmtSum(r.rewardGross)} ·{" "}
                {r.mode === "EXCLUSIVE" ? "Эксклюзив" : "Открытая"}
                {r.depositPaid && <> · депозит {fmtSum(r.depositAmount)} внесён</>}
              </div>
            </div>
            {left !== null && left >= 0 && (
              <span className="pill pill-warn" title="До автовозврата на биржу, если не появится кандидат">
                {left <= 0 ? "Дедлайн сегодня" : `${left} дн. до автовозврата`}
              </span>
            )}
            {r.autoReleasedCount > 0 && (
              <span className="pill pill-mut" title="Сколько раз заявка автоматически вернулась на биржу">
                ↺ {r.autoReleasedCount}
              </span>
            )}
            <span className={`pill ${st.c}`}>{st.t}</span>
            {role === "RECRUITER" && r.status === "OPEN" && (
              <button className="btn btn-red btn-sm" onClick={() => take(r.id)}>Взять в работу</button>
            )}
            <Link href={`/dashboard/requests/${r.id}`} className="btn btn-ghost btn-sm">Открыть</Link>
          </div>
        );
      })}
    </div>
  );
}
