export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function evaluationUrl(mesa?: number | null) {
  const base = getAppUrl();
  if (mesa && mesa > 0) {
    return `${base}/avaliar/${mesa}`;
  }
  return `${base}/avaliar`;
}
