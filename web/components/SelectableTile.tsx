// web/src/components/SelectableTile.tsx
import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
};

export function SelectableTile({ title, subtitle, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 14,
        borderRadius: 12,
        border: selected ? "2px solid #111" : "1px solid #ddd",
        background: selected ? "#f3f3f3" : "#fff",
        cursor: "pointer",
      }}
      aria-pressed={selected}
    >
      <div style={{ fontWeight: 700 }}>{title}</div>
      {subtitle ? (
        <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
          {subtitle}
        </div>
      ) : null}
    </button>
  );
}