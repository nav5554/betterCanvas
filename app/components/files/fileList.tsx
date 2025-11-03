// app/components/files/FilesList.tsx
"use client";

import { useState, useMemo } from "react";

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

  const title = useMemo(
    () => `Course Materials${files.length ? ` (${files.length})` : ""}`,
    [files.length]
  );

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
            fontSize: 15,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}
        >
          {title}
        </div>

        {/* Caret Button */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Show course materials" : "Hide course materials"}
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.25)",
            borderRadius: 6,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 0 0 rgba(0,0,0,0)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.05)";
            e.currentTarget.style.boxShadow = "0 0 4px rgba(0,0,0,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: collapsed ? "rotate(0deg)" : "rotate(90deg)",
              transition: "transform 0.25s ease",
            }}
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
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
                  opacity: 0.6,
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
                  marginBottom: 6,
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
                      color: "inherit",
                      textDecoration: "underline",
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
                    <div style={{ fontSize: 11, opacity: 0.7 }}>
                      {new Date(f.created_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {files.length > maxVisible && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 22,
                pointerEvents: "none",
                background:
                  "linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0))",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}