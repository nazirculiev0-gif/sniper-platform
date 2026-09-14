"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Не удалось подтвердить код");
      return;
    }
    router.push("/login?verified=1");
  };

  const resendCode = async () => {
    setResending(true);
    await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResending(false);
    setResent(true);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <form onSubmit={submit} className="card card-p" style={{ width: "100%", maxWidth: 380 }}>
        <div className="sg" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          SNIPER<span style={{ color: "var(--red)" }}>.</span>
        </div>
        <div className="mini muted" style={{ marginBottom: 18 }}>
          Мы отправили код на <b>{email}</b> — введите его ниже, чтобы подтвердить аккаунт.
        </div>

        <label className="fld">
          <span>Код подтверждения</span>
          <input
            className="inp"
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            style={{ letterSpacing: 6, fontSize: 20, textAlign: "center" }}
            autoFocus
          />
        </label>

        {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 12 }}>{error}</div>}

        <button className="btn btn-red btn-block" disabled={loading || code.length !== 6} style={{ marginBottom: 12 }}>
          {loading ? "Проверяем…" : "Подтвердить"}
        </button>

        <div className="flex" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <button type="button" className="btn btn-ghost btn-sm" disabled={resending || resent} onClick={resendCode}>
            {resent ? "Код отправлен повторно" : resending ? "Отправляем…" : "Отправить код ещё раз"}
          </button>
          <Link href="/login" className="mini muted">Уже подтвердили? Войти</Link>
        </div>
      </form>
    </div>
  );
}
