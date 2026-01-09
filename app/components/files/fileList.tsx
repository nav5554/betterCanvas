// app/components/files/FilesList.tsx
"use client";

import { useState } from "react";

type FileView = { name: string; url: string; created_at: string | null };

export default function FilesList({
  files,
  initiallyCollapsed = true,
  maxVisible = 5,
  rowHeight = 40,
}: {
  files: FileView[];
  initiallyCollapsed?: boolean;
  maxVisible?: number;
  rowHeight?: number;
}) {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const maxHeight = maxVisible * rowHeight + 4;
  const accentColor = "#111827";
  const mutedColor = "rgba(17, 24, 39, 0.65)";

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            color: mutedColor,
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span>Course Materials</span>
          <span>{files.length}</span>
        </div>

        {/* Caret Button */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Show course materials" : "Hide course materials"}
          style={{
            background: collapsed ? "#fff" : accentColor,
            color: collapsed ? accentColor : "#fff",
            border: `1px solid ${accentColor}`,
            borderRadius: 999,
            padding: "2px 12px",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            cursor: "pointer",
          }}
        >
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>

      {/* File List */}
      {!collapsed && (
        <div style={{ position: "relative" }}>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              maxHeight,
              overflowY: "auto",
              paddingRight: 8,
              scrollBehavior: "smooth",
              scrollSnapType: "y proximity",
            }}
          >
            {files.length === 0 && (
              <li
                style={{
                  fontSize: 12,
                  color: mutedColor,
                  height: rowHeight,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                None
              </li>
            )}

            {files.map((f, i) => (
              <li
                key={`${f.url}-${i}`}
                style={{
                  padding: "6px 0",
                  minHeight: rowHeight - 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  scrollSnapAlign: "start",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: accentColor,
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "inline-block",
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={f.name}
                  >
                    {f.name}
                  </a>
                  {f.created_at && (
                    <div style={{ fontSize: 10, color: mutedColor }}>
                      {new Date(f.created_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
