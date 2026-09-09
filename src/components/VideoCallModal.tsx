"use client";

import { useEffect, useState } from "react";

export default function VideoCallModal({
  name,
  onClose,
  onEnd,
}: {
  name: string;
  onClose: () => void;
  onEnd?: (seconds: number) => void;
}) {
  const [secs, setSecs] = useState(0);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  const end = () => {
    onEnd?.(secs);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(20,24,30,.92)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      }}
    >
      <div style={{ width: "min(560px,92vw)", borderRadius: 16, overflow: "hidden", background: "#1b212b", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, color: "#fff", background: "rgba(255,255,255,.04)" }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: "#FF3B57", display: "inline-block" }} />
          <b className="sg" style={{ fontSize: 13 }}>Видеозвонок в SNIPER</b>
          <span className="mini" style={{ marginLeft: "auto", color: "#9aa6b5" }}>{mm}:{ss}</span>
        </div>
        <div style={{ position: "relative", height: 320, background: "linear-gradient(135deg,#232b38,#161b23)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {cam ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div className="av" style={{ width: 92, height: 92, fontSize: 32, background: "var(--red)" }}>
                {name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div style={{ color: "#fff" }} className="sg">{name}</div>
              <div className="mini" style={{ color: "#8b96a6" }}>На линии</div>
            </div>
          ) : (
            <div className="mini" style={{ color: "#8b96a6" }}>Камера выключена</div>
          )}
          <div style={{ position: "absolute", bottom: 14, right: 14, width: 88, height: 64, borderRadius: 10, background: "#2a3241", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.1)" }}>
            <div className="av" style={{ width: 30, height: 30, fontSize: 11, background: "var(--info)" }}>Вы</div>
          </div>
          {!mic && (
            <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 11, padding: "4px 9px", borderRadius: 99 }}>
              Микрофон выключен
            </div>
          )}
        </div>
        <div style={{ padding: 16, display: "flex", justifyContent: "center", gap: 12, background: "#1b212b" }}>
          <button
            onClick={() => setMic(!mic)}
            style={{ width: 46, height: 46, borderRadius: 99, border: "none", cursor: "pointer", background: mic ? "rgba(255,255,255,.1)" : "#fff", color: mic ? "#fff" : "#1b212b" }}
          >
            {mic ? "🎙" : "🔇"}
          </button>
          <button
            onClick={() => setCam(!cam)}
            style={{ width: 46, height: 46, borderRadius: 99, border: "none", cursor: "pointer", background: cam ? "rgba(255,255,255,.1)" : "#fff", color: cam ? "#fff" : "#1b212b" }}
          >
            {cam ? "📹" : "🚫"}
          </button>
          <button
            onClick={end}
            style={{ width: 46, height: 46, borderRadius: 99, border: "none", cursor: "pointer", background: "var(--red)", color: "#fff", fontSize: 18 }}
          >
            ✕
          </button>
        </div>
        <div className="mini" style={{ textAlign: "center", padding: "0 16px 14px", color: "#6b7686" }}>
          Звонок проходит внутри платформы — контакты сторон не раскрываются, во избежание обхода SNIPER.
        </div>
      </div>
    </div>
  );
}
