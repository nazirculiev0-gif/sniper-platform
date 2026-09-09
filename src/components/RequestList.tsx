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
    <div style={{ display:
