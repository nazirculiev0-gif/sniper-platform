"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfileEditForm({ profile }: { profile: any }) {
  const router = useRouter();
  const [bio, setBio] = useState(profile.bio ?? "");
  const [specializations, setSpecializations] = useState((profile.specializations ?? []).join(", "));
  const [regions, setRegions] = useState((profile.regions ?? []).join(", "));
  const [yearsExperience, setYearsExperience] = useState(profile.yearsExperience ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const res = await fetch("/api/recruiter-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio,
        specializations: specializations.split(",").map((s) => s.trim()).filter(Boolean),
        regions: regions.split(",").map((s) => s.trim()).filter(Boolean),
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
      }),
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
        <span>О себе</span>
        <textarea className="inp" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Опыт, подход к поиску, кейсы…" />
      </label>
      <label className="fld">
        <span>Специализации (через запятую)</span>
        <input className="inp" value={specializations} onChange={(e) => setSpecializations(e.target.value)} placeholder="IT, Продажи, Маркетинг" />
      </label>
      <label className="fld">
        <span>Регионы работы (через запятую)</span>
        <input className="inp" value={regions} onChange={(e) => setRegions(e.target.value)} placeholder="Ташкент, Самарканд" />
      </label>
      <label className="fld">
        <span>Лет в рекрутинге</span>
        <input className="inp" type="number" min={0} max={60} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} />
      </label>
      <div className="flex gap8">
        <button className="btn btn-red" disabled={loading} type="submit">
          {loading ? "Сохраняем…" : "Сохранить"}
        </button>
        <Link href={`/dashboard/recruiters/${profile.id}`} className="btn btn-ghost">Посмотреть как работодатель</Link>
      </div>
      {saved && <div className="mini" style={{ color: "var(--ok)", marginTop: 10 }}>Сохранено</div>}
    </form>
  );
}
