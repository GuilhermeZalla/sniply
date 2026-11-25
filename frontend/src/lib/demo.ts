import type { Group, Language, Overview, Page, Snippet, User } from "./types";

export const isPublicDemo = import.meta.env?.VITE_PUBLIC_DEMO === "true";
const storageKey = "sniply.public-demo.v1";
const now = "2026-11-18T12:00:00Z";
const user: User = { id: "demo", name: "Alex Morgan", email: "alex@example.test", defaultLanguage: "typescript", fontSize: 14, wordWrap: true };
const baseLanguages: Language[] = [
  { id: "typescript", name: "TypeScript", monacoId: "typescript", custom: false },
  { id: "javascript", name: "JavaScript", monacoId: "javascript", custom: false },
  { id: "css", name: "CSS", monacoId: "css", custom: false },
  { id: "sql", name: "SQL", monacoId: "sql", custom: false },
];
const baseGroups: Group[] = [
  { id: "collection-1", name: "Everyday utilities", kind: "collection", description: "Small helpers used across projects.", count: 2, updatedAt: now },
  { id: "collection-2", name: "Interface patterns", kind: "collection", description: "Reusable details for the web.", count: 1, updatedAt: now },
  { id: "category-1", name: "Frontend", kind: "category", description: "Interface code and patterns.", count: 3, updatedAt: now },
  { id: "tag-1", name: "forms", kind: "tag", description: "", count: 1, updatedAt: now },
];
const sample = (id: string, title: string, description: string, languageId: string, code: string, days: number, groupIds: string[]): Snippet => ({
  id, title, description, code, languageId,
  language: baseLanguages.find((item) => item.id === languageId)?.name || languageId,
  monacoId: languageId, categoryId: "category-1", category: "Frontend", isFavorite: days < 2,
  isPublic: false, publicSlug: null,
  createdAt: new Date(Date.parse(now) - days * 86400000).toISOString(),
  updatedAt: new Date(Date.parse(now) - days * 86400000).toISOString(),
  groups: baseGroups.filter((group) => groupIds.includes(group.id)).map(({ id, name, kind }) => ({ id, name, kind })),
});
type DemoData = { user: User; snippets: Snippet[]; groups: Group[]; languages: Language[] };
const initial: DemoData = {
  user,
  snippets: [
    sample("s1", "Debounce a search input", "Wait until typing pauses before starting a search.", "typescript", "export function debounce(fn, delay) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}", 0, ["collection-1", "tag-1"]),
    sample("s2", "Fetch with timeout", "Cancel a request that takes too long.", "javascript", "const controller = new AbortController();\nsetTimeout(() => controller.abort(), 5000);", 1, ["collection-1"]),
    sample("s3", "A compact responsive grid", "Let content decide how many columns fit.", "css", ".grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));\n}", 2, ["collection-2"]),
    sample("s4", "Find duplicate email addresses", "Inspect imported records before merging.", "sql", "SELECT email, COUNT(*)\nFROM users\nGROUP BY email\nHAVING COUNT(*) > 1;", 3, []),
    sample("s5", "Group records by field", "Build an index without changing the original list.", "typescript", "const grouped = Object.groupBy(records, record => record.type);", 4, []),
  ],
  groups: baseGroups, languages: baseLanguages,
};
const read = (): DemoData => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as DemoData;
      if (Array.isArray(parsed.snippets) && Array.isArray(parsed.groups) && Array.isArray(parsed.languages)) return parsed;
    }
  } catch { /* A blocked or invalid local store falls back to sample data. */ }
  return structuredClone(initial);
};
const save = (data: DemoData) => { try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* The demo remains usable for this session. */ } };
const notFound = () => { throw new Error("This item is no longer available in the demo."); };
export function demoUser(): User { return read().user; }
export function resetDemo(): void { try { localStorage.removeItem(storageKey); } catch { /* No stored changes to clear. */ } }
export async function demoRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const data = read();
  const method = options.method?.toUpperCase() || "GET";
  const body = options.body ? JSON.parse(String(options.body)) as Record<string, unknown> : {};
  const url = new URL(path, "https://demo.invalid");
  const parts = url.pathname.split("/").filter(Boolean);
  let result: unknown;
  if (path === "/overview") {
    const recent = [...data.snippets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    result = { total: data.snippets.length, favorites: data.snippets.filter((item) => item.isFavorite).length,
      collections: data.groups.filter((group) => group.kind === "collection").length,
      languages: data.languages.map((language) => ({ id: language.id, name: language.name, count: data.snippets.filter((item) => item.languageId === language.id).length })).filter((item) => item.count > 0),
      recent: recent.slice(0, 5), added: [...data.snippets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3) } satisfies Overview;
  } else if (parts[0] === "snippets" && parts.length === 1) {
    if (method === "POST") {
      const language = data.languages.find((item) => item.id === body.languageId);
      if (!language || !String(body.title || "").trim() || !String(body.code || "").trim()) throw new Error("Add a title, language, and code before saving.");
      const category = data.groups.find((item) => item.id === body.categoryId);
      const item: Snippet = { id: crypto.randomUUID(), title: String(body.title).trim(), description: String(body.description || ""), code: String(body.code), languageId: language.id, language: language.name, monacoId: language.monacoId, categoryId: category?.id || null, category: category?.name || null, isFavorite: false, isPublic: false, publicSlug: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), groups: data.groups.filter((group) => Array.isArray(body.groupIds) && body.groupIds.includes(group.id)).map(({ id, name, kind }) => ({ id, name, kind })) };
      data.snippets.unshift(item); save(data); result = item;
    } else {
      let items = [...data.snippets];
      const term = url.searchParams.get("search")?.trim().toLowerCase();
      if (term) items = items.filter((item) => [item.title, item.description, item.code, item.language, ...item.groups.map((group) => group.name)].some((value) => value?.toLowerCase().includes(term)));
      if (url.searchParams.get("favorite") === "true") items = items.filter((item) => item.isFavorite);
      if (url.searchParams.get("language")) items = items.filter((item) => item.languageId === url.searchParams.get("language"));
      if (url.searchParams.get("category")) items = items.filter((item) => item.categoryId === url.searchParams.get("category"));
      if (url.searchParams.get("group")) items = items.filter((item) => item.groups.some((group) => group.id === url.searchParams.get("group")));
      const sort = url.searchParams.get("sort");
      items.sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : sort === "created" ? b.createdAt.localeCompare(a.createdAt) : b.updatedAt.localeCompare(a.updatedAt));
      const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
      result = { items: items.slice((page - 1) * 20, page * 20), total: items.length, page, pages: Math.max(1, Math.ceil(items.length / 20)), pageSize: 20 } satisfies Page<Snippet>;
    }
  } else if (parts[0] === "snippets" && parts[1]) {
    const item = data.snippets.find((snippet) => snippet.id === parts[1]);
    if (!item) return notFound();
    if (parts[2] === "favorite" && method === "PUT") item.isFavorite = Boolean(body.isFavorite);
    else if (parts[2] === "share" && method === "PUT") { item.isPublic = Boolean(body.isPublic); item.publicSlug = item.isPublic ? item.publicSlug || crypto.randomUUID() : null; }
    else if (method === "DELETE") { data.snippets = data.snippets.filter((snippet) => snippet.id !== item.id); result = null; }
    else if (method === "PUT") { Object.assign(item, { title: String(body.title || item.title), description: String(body.description || ""), code: String(body.code || item.code), languageId: String(body.languageId || item.languageId), categoryId: body.categoryId || null, updatedAt: new Date().toISOString() }); const language = data.languages.find((entry) => entry.id === item.languageId); const category = data.groups.find((entry) => entry.id === item.categoryId); item.language = language?.name || item.language; item.monacoId = language?.monacoId || item.monacoId; item.category = category?.name || null; item.groups = data.groups.filter((group) => Array.isArray(body.groupIds) && body.groupIds.includes(group.id)).map(({ id, name, kind }) => ({ id, name, kind })); }
    if (method !== "GET") save(data);
    if (method !== "DELETE") result = item;
  } else if (parts[0] === "groups" && parts[1]) {
    if (parts[2] && method === "DELETE") { data.groups = data.groups.filter((group) => group.id !== parts[2]); data.snippets.forEach((item) => { item.groups = item.groups.filter((group) => group.id !== parts[2]); if (item.categoryId === parts[2]) { item.categoryId = null; item.category = null; } }); save(data); result = null; }
    else if (method === "POST" || method === "PUT") { const group = data.groups.find((item) => item.id === parts[2]) || { id: crypto.randomUUID(), kind: parts[1], count: 0, updatedAt: new Date().toISOString(), name: "", description: "" }; group.name = String(body.name || "").trim(); group.description = String(body.description || ""); if (!group.name) throw new Error("Enter a name."); if (!parts[2]) data.groups.push(group); save(data); result = group; }
    else result = data.groups.filter((group) => group.kind === parts[1]).map((group) => ({ ...group, count: data.snippets.filter((item) => group.kind === "category" ? item.categoryId === group.id : item.groups.some((entry) => entry.id === group.id)).length }));
  } else if (path === "/languages") {
    if (method === "POST") { const item: Language = { id: crypto.randomUUID(), name: String(body.name || ""), monacoId: String(body.monacoId || "plaintext"), custom: true }; data.languages.push(item); save(data); result = item; }
    else result = data.languages;
  } else if (parts[0] === "languages" && parts[1] && method === "DELETE") { if (data.snippets.some((item) => item.languageId === parts[1])) throw new Error("Move snippets to another language first."); data.languages = data.languages.filter((item) => item.id !== parts[1]); save(data); result = null; }
  else if (path === "/auth/profile" && method === "PUT") { data.user = { ...data.user, name: String(body.name || data.user.name), defaultLanguage: String(body.defaultLanguage || data.user.defaultLanguage), fontSize: Number(body.fontSize || 14), wordWrap: Boolean(body.wordWrap) }; save(data); result = data.user; }
  else if (parts[0] === "public" && parts[1]) { const item = data.snippets.find((snippet) => snippet.isPublic && snippet.publicSlug === parts[1]); if (!item) return notFound(); result = { title: item.title, description: item.description, code: item.code, language: item.language, monacoId: item.monacoId }; }
  else if (parts[0] === "auth") throw new Error("Account and password actions are unavailable in the public demo.");
  else return notFound();
  return result as T;
}
