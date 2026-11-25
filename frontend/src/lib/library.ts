export const validKinds = ["tag", "collection", "category"] as const;
export function pageQuery(params: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(params);
  if (value) next.set(key, value);
  else next.delete(key);
  if (key !== "page") next.delete("page");
  return next;
}
export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((v) => v[0])
      .join("")
      .toUpperCase() || "S"
  );
}
export function localDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}
export function editorPayload(
  title: string,
  description: string,
  code: string,
  languageId: string,
  categoryId: string,
  groupIds: string[],
) {
  if (!title.trim()) throw new Error("Give your snippet a title.");
  if (!code.trim()) throw new Error("Add some code before saving.");
  if (title.trim().length > 160 || code.length > 200000)
    throw new Error(
      "Use a title under 161 characters and code under 200,001 characters.",
    );
  return {
    title: title.trim(),
    description,
    code,
    languageId,
    categoryId: categoryId || null,
    groupIds: [...new Set(groupIds)],
  };
}
