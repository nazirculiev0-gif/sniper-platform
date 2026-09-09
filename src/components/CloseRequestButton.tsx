"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CloseRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const close = async () => {
    if (!confirm("Закрыть заявку? Если её ещё не закрепил рекрутер — депозит вернётся полностью.")) return;
    setLoading(true);
    const res = await fetch(`/api/requests/${requestId}/close`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      alert(data.refunded ? "Заявка закрыта, депозит возвращён." : "Заявка закрыта.");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Не удалось закрыть заявку");
    }
  };

  return (
    <button className="btn btn-ghost btn-sm" disabled={loading} onClick={close}>
      Закрыть заявку
    </button>
  );
}
