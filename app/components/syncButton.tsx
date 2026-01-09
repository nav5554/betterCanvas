"use client";

import { useState } from "react";

type Status = "idle" | "running" | "success" | "error";

export default function SyncButton({ accentColor = "#111827" }: { accentColor?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isRunning = status === "running";

  async function handleClick() {
    setStatus("running");
    setMessage("Syncing the latest Canvas data…");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        cache: "no-store",
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error ?? "Sync failed");
      }
      setStatus("success");
      setMessage(payload?.message ?? "Sync complete.");
    } catch (error: unknown) {
      setStatus("error");
      const message = error instanceof Error ? error.message : "Sync failed.";
      setMessage(message);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isRunning}
        style={{
          padding: "7px 18px",
          borderRadius: 999,
          border: `1px solid ${accentColor}`,
          fontWeight: 600,
          background: isRunning ? "#e5e7eb" : accentColor,
          color: isRunning ? accentColor : "#fff",
          cursor: isRunning ? "not-allowed" : "pointer",
          alignSelf: "flex-start",
        }}
        aria-busy={isRunning}
      >
        {isRunning ? "Syncing…" : "Refresh from Canvas"}
      </button>
      {message && (
        <span
          style={{
            fontSize: 13,
            color: status === "error" ? "#b42318" : "rgba(17, 24, 39, 0.7)",
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
}
