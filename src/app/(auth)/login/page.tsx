"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Неверный email или пароль");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={submit} className="card card-p" style={{ width: 360 }}>
        <div className="sg" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          SNIPER<span style={{ color: "var(--red)" }}>.</span>
        </div>
        <div className="mini muted" style={{ marginBottom: 18 }}>Вход в платформу</div>

        <label className="fld">
          <span>Email</span>
          <input className="inp" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="fld">
          <span>Пароль</span>
          <input className="inp" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </label>

        {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>}

        <button className="btn btn-red btn-block" disabled={loading} type="submit">
          {loading ? "Входим…" : "Войти"}
        </button>

        <div className="mini muted" style={{ marginTop: 14, textAlign: "center" }}>
          Нет аккаунта? <Link href="/register" style={{ color: "var(--red)" }}>Зарегистрироваться</Link>
        </div>
      </form>
    </div>
  );
}
