const ORIGIN = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

/** Ảnh lưu dạng "/uploads/x.png" -> ghép origin backend thành URL đầy đủ. */
export function resolveImageUrl(
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${ORIGIN}${path}`;
}