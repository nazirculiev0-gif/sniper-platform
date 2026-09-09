"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"EMPLOYER" | "RECRUITER">("EMPLOYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role, name }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] || data.error || "Ошибка регистрации");
      setLoading(false);
      return;
    }
    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <form onSubmit={submit} className="card card-p" style={{ width: "100%", maxWidth: 380 }}>
        <div className="sg" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          SNIPER<span style={{ color: "var(--red)" }}>.</span>
        </div>
        <div className="mini muted" style={{ marginBottom: 18 }}>Регистрация</div>

        <div className="flex gap8" style={{ marginBottom: 14 }}>
          <button type="button" className={`btn btn-sm ${role === "EMPLOYER" ? "btn-red" : "btn-ghost"}`} onClick={() => setRole("EMPLOYER")}>
            Я работодатель
          </button>
          <button type="button" className={`btn btn-sm ${role === "RECRUITER" ? "btn-red" : "btn-ghost"}`} onClick={() => setRole("RECRUITER")}>
            Я рекрутер
          </button>
        </div>

        <label className="fld">
          <span>{role === "EMPLOYER" ? "Название компании" : "Ваше имя"}</span>
          <input className="inp" required value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label className="fld">
          <span>Email</span>
          <input className="inp" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="fld">
          <span>Пароль</span>
          <input className="inp" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
        </label>

        {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>}

        <button className="btn btn-red btn-block" disabled={loading} type="submit">
          {loading ? "Создаём…" : "Создать аккаунт"}
        </button>

        <div className="mini muted" style={{ marginTop: 14, textAlign: "center" }}>
          Уже есть аккаунт? <Link href="/login" style={{ color: "var(--red)" }}>Войти</Link>
        </div>
      </form>
    </div>
  );
}
