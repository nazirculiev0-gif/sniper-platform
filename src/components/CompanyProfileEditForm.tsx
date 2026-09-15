"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MAX_LOGO_BYTES = 1024 * 1024; // 1 МБ

export default function CompanyProfileEditForm({ company }: { company: any }) {
  const router = useRouter();
  const [name, setName] = useState(company.name ?? "");
  const [industry, setIndustry] = useState(company.industry ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(
    company.logoData ? `data:${company.logoType || "image/png"};base64,${company.logoData}` : null
  );
  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoType, setLogoType] = useState<string | null>(null);
  const [removingLogo, setRemovingLogo] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const pickLogo = (file?: File) => {
    if (!file) return;
    setLogoError("");
    if (!file.type.startsWith("image/")) {
      setLogoError("Нужен файл изображения (PNG, JPG, SVG)");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Файл слишком большой — максимум 1 МБ");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      setLogoData(base64);
      setLogoType(file.type);
      setLogoPreview(result);
    };
    reader.onerror = () => setLogoError("Не удалось прочитать файл");
    reader.readAsDataURL(file);
  };

  const removeLogo = async () => {
    if (!confirm("Удалить логотип компании?")) return;
    setRemovingLogo(true);
    const res = await fetch("/api/company-profile", { method: "DELETE" });
    setRemovingLogo(false);
    if (res.ok) {
      setLogoPreview(null);
      setLogoData(null);
      setLogoType(null);
      router.refresh();
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const res = await fetch("/api/company-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        industry: industry || undefined,
        ...(logoData ? { logoData, logoType } : {}),
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
        <span>Логотип компании</span>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => pickLogo(e.target.files?.[0])}
        />
        <div className="flex gap8" style={{ alignItems: "center" }}>
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Логотип"
              style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", border: "1px solid var(--line)" }}
            />
          ) : (
            <div
              className="av"
              style={{ width: 56, height: 56, fontSize: 20, background: "var(--dark)", borderRadius: 12 }}
            >
              {(name || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>
            {logoPreview ? "Заменить" : "Загрузить логотип"}
          </button>
          {logoPreview && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} disabled={removingLogo} onClick={removeLogo}>
              {removingLogo ? "Удаляем…" : "Удалить"}
            </button>
          )}
        </div>
        {logoError && <span className="hint" style={{ color: "var(--red)" }}>{logoError}</span>}
        <span className="hint">PNG, JPG или SVG, до 1 МБ. Отображается на публичной странице компании.</span>
      </label>

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
