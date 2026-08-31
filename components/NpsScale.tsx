"use client";

type NpsScaleProps = {
  value: number | null;
  onChange: (value: number) => void;
};

export function NpsScale({ value, onChange }: NpsScaleProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Recomendaria a Orly? (0–10)</p>
        <span className="text-sm text-gray-500">
          {value !== null ? `${value}/10` : "—"}
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1 sm:grid-cols-11">
        {Array.from({ length: 11 }, (_, index) => index).map((score) => (
          <button
            key={score}
            type="button"
            className={`nps-btn ${value === score ? "active" : ""}`}
            onClick={() => onChange(score)}
            aria-label={`NPS ${score}`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}
