type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
  subtitle?: string;
  align?: "left" | "center";
};

export function BrandMark({
  size = "md",
  subtitle,
  align = "left",
}: BrandMarkProps) {
  const titleClass =
    size === "lg"
      ? "text-4xl sm:text-5xl"
      : size === "sm"
        ? "text-2xl"
        : "text-3xl";

  return (
    <div className={align === "center" ? "text-center" : ""}>
      <div
        className={`inline-flex flex-col ${align === "center" ? "items-center" : "items-start"}`}
      >
        <span
          className="mb-1 block h-px w-10"
          style={{ background: "var(--accent)" }}
          aria-hidden
        />
        <p className={`brand-mark ${titleClass}`}>Orly</p>
        <p className="brand-sub mt-1">Bagueteria</p>
      </div>
      {subtitle ? (
        <p
          className={`mt-2 text-sm text-orly-muted ${align === "center" ? "text-center" : ""}`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
