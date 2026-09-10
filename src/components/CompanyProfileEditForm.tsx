"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CompanyProfileEditForm({ company }: { company: any }) {
  const router = useRouter();
  const [name, setName] = useState(company.name ?? "");
  const [industry, setIndustry] = useState(company.industry ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const res = await fetch("/api/company-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry: industry || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  };

  return (
    <form onSubmit={submit} className="card card-p" style={{ maxWidth: 560 }}>
      <label className="fld">
        <span>Название компании <em>*</em></span>
        <input className="inp" required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="fld">
        <span>Отрасль</span>
        <input className="inp" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="IT и разработка" />
        <span className="hint">Используется как фильтр на бирже заявок для рекрутеров.</span>
      </label>
      <div className="flex gap8">
        <button className="btn btn-red" disabled={loading} type="submit">
          {loading ? "Сохраняем…" : "Сохранить"}
        </button>
        <Link href={`/dashboard/companies/${company.id}`} className="btn btn-ghost">Посмотреть как рекрутер</Link>
      </div>
      {saved && <div className="mini" style={{ color: "var(--ok)", marginTop: 10 }}>Сохранено</div>}
    </form>
  );
}
