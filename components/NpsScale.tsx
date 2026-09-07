"use client";

type NpsScaleProps = {
  value: number | null;
  onChange: (value: number) => void;
};

export function NpsScale({ value, onChange }: NpsScaleProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-snug text-orly-ink">
          Você recomendaria a Orly a um amigo?
        </p>
        <span className="shrink-0 text-xs tabular-nums text-orly-muted">
          {value !== null ? `${value}/10` : "0–10"}
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
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
      <div className="flex justify-between text-xs text-orly-muted">
        <span>Pouco provável</span>
        <span>Muito provável</span>
      </div>
    </div>
  );
}
