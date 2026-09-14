"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function formatCardInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export default function PaymentCardSection({
  cardLast4,
  cardBrand,
  cardHolder,
  isSelfEmployed,
  taxId,
}: {
  cardLast4: string | null;
  cardBrand: string | null;
  cardHolder: string | null;
  isSelfEmployed: boolean;
  taxId: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!cardLast4);
  const [cardNumber, setCardNumber] = useState("");
  const [holder, setHolder] = useState(cardHolder ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [selfEmployed, setSelfEmployed] = useState(isSelfEmployed);
  const [taxIdValue, setTaxIdValue] = useState(taxId ?? "");
  const [taxSaving, setTaxSaving] = useState(false);
  const [taxSaved, setTaxSaved] = useState(false);

  const saveCard = async () => {
    setError("");
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 16) {
      setError("Введите полный номер карты — 16 цифр");
      return;
    }
    if (!holder.trim()) {
      setError("Укажите держателя карты — как на карте, латиницей");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/recruiter-profile/card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardNumber: digits, cardHolder: holder }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      setCardNumber("");
      router.refresh();
    } else {
      setError("Не удалось привязать карту");
    }
  };

  const removeCard = async () => {
    if (!confirm("Открепить карту? Вывод средств будет недоступен, пока не привяжете новую.")) return;
    const res = await fetch("/api/recruiter-profile/card", { method: "DELETE" });
    if (res.ok) {
      setEditing(true);
      router.refresh();
    }
  };

  const saveTax = async () => {
    setTaxSaving(true);
    setTaxSaved(false);
    const res = await fetch("/api/recruiter-profile/tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSelfEmployed: selfEmployed, taxId: taxIdValue || undefined }),
    });
    setTaxSaving(false);
    if (res.ok) {
      setTaxSaved(true);
      router.refresh();
    }
  };

  return (
    <div style={{ display: "grid", gap: 14, marginBottom: 18 }}>
      <div className="card card-p" style={{ maxWidth: 480 }}>
        <div className="sectit" style={{ fontSize: 14, marginBottom: 4 }}>Карта для выплат</div>
        <div className="hint" style={{ marginBottom: 14 }}>
          Средства выводятся на привязанную карту. Полный номер карты нигде не хранится — только последние 4 цифры и платёжная система.
        </div>

        {!editing && cardLast4 && (
          <div className="flex gap8" style={{ alignItems: "center" }}>
            <div className="av" style={{ width: 36, height: 36, fontSize: 11, background: "var(--dark)" }}>{cardBrand?.slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <b className="mini" style={{ display: "block" }}>{cardBrand} •••• {cardLast4}</b>
              <span className="mini muted">{cardHolder}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Изменить</button>
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} onClick={removeCard}>Открепить</button>
          </div>
        )}

        {editing && (
          <div>
            <label className="fld">
              <span>Номер карты</span>
              <input
                className="inp"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
              />
            </label>
            <label className="fld">
              <span>Держатель карты</span>
              <input className="inp" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="IVAN IVANOV" />
            </label>
            {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>}
            <div className="flex gap8">
              <button className="btn btn-red btn-sm" disabled={saving} onClick={saveCard}>
                {saving ? "Сохраняем…" : "Привязать карту"}
              </button>
              {cardLast4 && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setError(""); }}>Отмена</button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card card-p" style={{ maxWidth: 480 }}>
        <div className="sectit" style={{ fontSize: 14, marginBottom: 4 }}>Налоговый статус</div>
        <div className="hint" style={{ marginBottom: 14 }}>
          Если вы работаете как самозанятый, укажите это и ваш ИНН/ПИНФЛ — пригодится для отчётности по выплатам.
        </div>
        <label className="fld" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <input type="checkbox" checked={selfEmployed} onChange={(e) => setSelfEmployed(e.target.checked)} />
          <span>Я самозанятый</span>
        </label>
        {selfEmployed && (
          <label className="fld">
            <span>ИНН / ПИНФЛ</span>
            <input className="inp" value={taxIdValue} onChange={(e) => setTaxIdValue(e.target.value)} placeholder="14 цифр" />
          </label>
        )}
        <div className="flex gap8" style={{ alignItems: "center" }}>
          <button className="btn btn-ghost btn-sm" disabled={taxSaving} onClick={saveTax}>
            {taxSaving ? "Сохраняем…" : "Сохранить"}
          </button>
          {taxSaved && <span className="mini" style={{ color: "var(--ok)" }}>Сохранено</span>}
        </div>
      </div>
    </div>
  );
}
