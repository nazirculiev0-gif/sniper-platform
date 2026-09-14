"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <form onSubmit={submit} className="card card-p" style={{ width: "100%", maxWidth: 360 }}>
        <div className="sg" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          SNIPER<span style={{ color: "var(--red)" }}>.</span>
        </div>
        <div className="mini muted" style={{ marginBottom: 18 }}>Восстановление пароля</div>

        {sent ? (
          <div className="mini" style={{ color: "var(--ok)", marginBottom: 14 }}>
            Если такой email зарегистрирован, на него отправлена ссылка для сброса пароля. Проверьте почту (и папку «Спам»).
          </div>
        ) : (
          <>
            <label className="fld">
              <span>Email</span>
              <input className="inp" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </label>
            <button className="btn btn-red btn-block" disabled={loading} type="submit">
              {loading ? "Отправляем…" : "Отправить ссылку"}
            </button>
          </>
        )}

        <div className="mini muted" style={{ marginTop: 14, textAlign: "center" }}>
          <Link href="/login" style={{ color: "var(--red)" }}>Вернуться ко входу</Link>
        </div>
      </form>
    </div>
  );
}
