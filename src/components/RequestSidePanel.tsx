"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}

export default function RequestSidePanel({
  requestId,
  rewardGross,
  exclusiveDays,
  claimedAt,
  claimDeadline,
  createdAt,
  participants,
  status,
  canSimulate,
}: {
  requestId: string;
  rewardGross: number;
  exclusiveDays: number;
  claimedAt: string | null;
  claimDeadline: string | null;
  createdAt: string;
  participants: { recruiterId: string; recruiter: { name: string; rating: number } }[];
  status: string;
  canSimulate: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const totalMs = exclusiveDays * 24 * 60 * 60 * 1000;
  const leftMs = claimDeadline ? new Date(claimDeadline).getTime() - Date.now() : null;
  const leftDays = leftMs !== null ? Math.max(0, Math.ceil(leftMs / (24 * 60 * 60 * 1000))) : null;
  const progressPct = leftMs !== null ? Math.max(0, Math.min(100, (leftMs / totalMs) * 100)) : 0;

  const simulate = async () => {
    if (!confirm("Симулировать 14 дней простоя без активности? Заявка вернётся на биржу.")) return;
    setLoading(true);
    const res = await fetch(`/api/requests/${requestId}/simulate-idle`, { method: "POST" });
    setLoading(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      alert(data.error || "Не удалось симулировать");
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card card-p">
        <div className="mini muted" style={{ marginBottom: 6, textTransform: "uppercase", fontSize: 10.5, letterSpacing: ".04em" }}>Вознаграждение</div>
        <div className="mini muted">за подбор</div>
        <b className="sg" style={{ fontSize: 20 }}>{fmtSum(rewardGross)}</b>
      </div>

      <div className="card card-p">
        <div className="mini muted" style={{ marginBottom: 10, textTransform: "uppercase", fontSize: 10.5, letterSpacing: ".04em" }}>Сроки</div>
        <div className="flex" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <span className="mini muted">Дедлайн активности</span>
          <b className="mini">{exclusiveDays} дней</b>
        </div>
        <div className="flex" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <span className="mini muted">Заявка создана</span>
          <b className="mini">{fmtDate(createdAt)}</b>
        </div>
        {leftDays !== null && (
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <span className="mini muted">До дедлайна</span>
            <b className="mini">{leftDays} дней</b>
          </div>
        )}
      </div>

      {participants.length > 0 && (
        <div className="card card-p">
          <div className="mini muted" style={{ marginBottom: 10, textTransform: "uppercase", fontSize: 10.5, letterSpacing: ".04em" }}>Рекрутеры на заявке</div>
          {participants.length > 1 && (
            <div className="hint" style={{ marginBottom: 10 }}>
              Несколько рекрутеров работают параллельно. Смотрите на их кандидатов, рейтинг и профиль — найм подтверждается за тем рекрутером, чьего кандидата вы наняли.
            </div>
          )}
          {participants.map((p) => (
            <Link key={p.recruiterId} href={`/dashboard/recruiters/${p.recruiterId}`} className="flex gap8" style={{ textDecoration: "none", color: "inherit", marginBottom: 8 }}>
              <span className="av" style={{ width: 26, height: 26, fontSize: 11 }}>
                {p.recruiter.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <div>
                <b className="mini" style={{ display: "block" }}>{p.recruiter.name}</b>
                <span className="mini muted">★ {p.recruiter.rating.toFixed(1)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {status === "IN_PROGRESS" && leftDays !== null && (
        <div className="card card-p">
          <div className="mini muted" style={{ marginBottom: 6, textTransform: "uppercase", fontSize: 10.5, letterSpacing: ".04em" }}>
            Активность · {exclusiveDays} дн.
          </div>
          <b className="sg" style={{ fontSize: 15 }}>{leftDays <= 0 ? "Дедлайн сегодня" : `${leftDays} дн. осталось`}</b>
          <div style={{ height: 6, background: "var(--line2)", borderRadius: 99, marginTop: 10, marginBottom: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--warn)" }} />
          </div>
          <div className="mini muted" style={{ marginBottom: 10 }}>
            Нет активности {exclusiveDays} дней — заявка автоматически вернётся на биржу (для всех участников).
          </div>
          {canSimulate && (
            <button className="btn btn-ghost btn-sm btn-block" disabled={loading} onClick={simulate}>
              Симулировать простой {exclusiveDays} дней
            </button>
          )}
        </div>
      )}
    </div>
  );
}
