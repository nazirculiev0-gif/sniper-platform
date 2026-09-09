"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewForm({ requestId, existing }: { requestId: string; existing?: { rating: number; text: string | null } | null }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [text, setText] = useState(existing?.text ?? "");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!!existing);

  const submit = async () => {
    setLoading(true);
    const res = await fetch(`/api/requests/${requestId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, text }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  };

  return (
    <div className="card card-p">
      <div className="sectit" style={{ fontSize: 14, marginBottom: 10 }}>
        {done ? "Ваш отзыв о рекрутере" : "Оставить отзыв рекрутеру"}
      </div>
      <div className="flex gap8" style={{ marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            onClick={() => !done && setRating(n)}
            style={{ fontSize: 22, cursor: done ? "default" : "pointer", color: n <= rating ? "#E5A100" : "var(--line)" }}
          >
            ★
          </span>
        ))}
      </div>
      <textarea
        className="inp"
        placeholder="Как прошла работа с рекрутером?"
        value={text}
        disabled={done}
        onChange={(e) => setText(e.target.value)}
        style={{ marginBottom: 10 }}
      />
      {!done && (
        <button className="btn btn-red btn-sm" disabled={loading} onClick={submit}>
          {loading ? "Сохраняем…" : "Оставить отзыв"}
        </button>
      )}
    </div>
  );
}
