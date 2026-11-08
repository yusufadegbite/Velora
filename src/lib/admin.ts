import "server-only";
export const ADMIN_PAGE_SIZE = 15;
export function adminPaging(sp: Record<string, string | string[] | undefined>) {
  const page = Math.max(1, Math.min(1000, Number(typeof sp.page === "string" ? sp.page : 1) || 1));
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  return { page, q, skip: (page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE, str, pages: (total: number) => Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}
