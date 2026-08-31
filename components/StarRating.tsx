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
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <span className="text-sm text-gray-500">
          {preview ? `${preview}/5` : "—"}
        </span>
      </div>
      <div className="flex" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((score) => {
          const lit = preview !== null && preview >= score;
          return (
            <button
              key={score}
              type="button"
              className={`star-btn ${lit ? "lit" : ""}`}
              onMouseEnter={() => setHover(score)}
              onClick={() => onChange(score)}
              aria-label={`${label}: ${score} estrelas`}
            >
              ★
            </button>
          );
        })}
      </div>
    </div>
  );
}
