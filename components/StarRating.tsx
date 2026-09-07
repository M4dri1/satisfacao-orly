"use client";

import { useState } from "react";

type StarRatingProps = {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
};

export function StarRating({ label, value, onChange }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const preview = hover ?? value;

  return (
    <div className="space-y-1.5 border-b border-orly-line/70 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-orly-ink">{label}</p>
        <span className="tabular-nums text-sm text-orly-muted">
          {preview ? `${preview}/5` : "—"}
        </span>
      </div>
      <div className="-ml-1 flex" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((score) => {
          const lit = preview !== null && preview >= score;
          const selected = value !== null && value >= score;
          return (
            <button
              key={score}
              type="button"
              className={`star-btn ${lit ? "lit" : ""} ${selected ? "active" : ""}`}
              onMouseEnter={() => setHover(score)}
              onFocus={() => setHover(score)}
              onBlur={() => setHover(null)}
              onClick={() => onChange(score)}
              aria-label={`${label}: ${score} estrelas`}
              aria-pressed={value === score}
            >
              ★
            </button>
          );
        })}
      </div>
    </div>
  );
}
