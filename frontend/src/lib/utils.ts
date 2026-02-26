/**
 * LLMがオブジェクトや配列を文字列フィールドに返すことがある。
 * Reactはオブジェクトをそのままレンダリングできないため、ここで安全に文字列化する。
 */
export function safeStr(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map((v) => safeStr(v)).join(", ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${safeStr(v)}`)
      .join(", ");
  }
  return String(value);
}
