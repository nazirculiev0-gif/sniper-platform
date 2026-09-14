"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";
  const justReset = searchParams.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setBlocked(false);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error === "EMAIL_NOT_VERIFIED") {
      setNeedsVerification(true);
      return;
    }
    if (res?.error === "ACCOUNT_BLOCKED") {
      setBlocked(true);
      return;
    }
    if (res?.error) {
      setError("Неверный email или пароль");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <form onSubmit={submit} className="card card-p" style={{ width: "100%", maxWidth: 360 }}>
        <div className="sg" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          SNIPER<span style={{ color: "var(--red)" }}>.</span>
        </div>
        <div className="mini muted" style={{ marginBottom: 18 }}>Вход в платформу</div>

        {justVerified && (
          <div className="mini" style={{ color: "var(--ok)", marginBottom: 14 }}>Email подтверждён — теперь можно войти.</div>
        )}
        {justReset && (
          <div className="mini" style={{ color: "var(--ok)", marginBottom: 14 }}>Пароль изменён — войдите с новым паролем.</div>
        )}

        <label className="fld">
          <span>Email</span>
          <input className="inp" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="fld">
          <span>Пароль</span>
          <input className="inp" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <div style={{ textAlign: "right", marginTop: -10, marginBottom: 14 }}>
          <Link href="/forgot-password" className="mini muted">Забыли пароль?</Link>
        </div>

        {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>}
        {blocked && (
          <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>
            Аккаунт заблокирован администратором. Обратитесь в поддержку, если считаете это ошибкой.
          </div>
        )}
        {needsVerification && (
          <div className="mini" style={{ color: "var(--warn)", marginBottom: 10 }}>
            Email ещё не подтверждён.{" "}
            <Link href={`/verify-email?email=${encodeURIComponent(email)}`} style={{ color: "var(--red)" }}>
              Ввести код подтверждения
            </Link>
          </div>
        )}

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
