"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddCandidateForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) {
    return <button className="btn btn-soft btn-sm" onClick={() => setOpen(true)}>+ Добавить кандидата</button>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/requests/${requestId}/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, profession, skills: [] }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setName(""); setProfession("");
      router.refresh();
    } else {
      const data = await res.json();
      alert(JSON.stringify(data.error));
    }
  };

  return (
    <form onSubmit={submit} className="card card-p flex gap8" style={{ alignItems: "flex-end" }}>
      <label className="fld" style={{ marginBottom: 0, flex: 1 }}>
        <span>Имя <em>*</em></span>
        <input className="inp" required value={name} onChange={e => setName(e.target.value)} />
      </label>
      <label className="fld" style={{ marginBottom: 0, flex: 1 }}>
        <span>Профессия</span>
        <input className="inp" value={profession} onChange={e => setProfession(e.target.value)} />
      </label>
      <button className="btn btn-red btn-sm" disabled={loading} type="submit">Добавить</button>
      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(false)}>×</button>
    </form>
  );
}
