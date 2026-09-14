"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Не удалось сбросить пароль");
      return;
    }
    router.push("/login?reset=1");
  };

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div className="card card-p" style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
          <div className="mini" style={{ marginBottom: 12 }}>Ссылка недействительна.</div>
          <Link href="/forgot-password" style={{ color: "var(--red)" }}>Запросить новую</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <form onSubmit={submit} className="card card-p" style={{ width: "100%", maxWidth: 360 }}>
        <div className="sg" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          SNIPER<span style={{ color: "var(--red)" }}>.</span>
        </div>
        <div className="mini muted" style={{ marginBottom: 18 }}>Новый пароль</div>

        <label className="fld">
          <span>Новый пароль</span>
          <input className="inp" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </label>
        <label className="fld">
          <span>Повторите пароль</span>
          <input className="inp" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>

        {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>}

        <button className="btn btn-red btn-block" disabled={loading} type="submit">
          {loading ? "Сохраняем…" : "Сохранить пароль"}
        </button>
      </form>
    </div>
  );
}
