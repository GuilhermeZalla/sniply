export type ThemeId = "a" | "b" | "c" | "d" | "e";

export const themes: { id: ThemeId; name: string; colors: [string, string, string] }[] = [
  { id: "a", name: "Editorial clay", colors: ["#F5F1EA", "#27343A", "#C96447"] },
  { id: "b", name: "Workshop blue", colors: ["#EDF2F4", "#263843", "#4D7898"] },
  { id: "c", name: "Amber night", colors: ["#161C22", "#E8E9E5", "#D48651"] },
  { id: "d", name: "Soft terminal", colors: ["#1B2224", "#F0F1E8", "#A7C96A"] },
  { id: "e", name: "Sand and wine", colors: ["#F3EDE5", "#423331", "#A35E70"] },
];

const storageKey = "sniply-theme";

export function getTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(storageKey);
    return themes.find((theme) => theme.id === saved)?.id ?? "a";
  } catch {
    return "a";
  }
}

export function setTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
  updateFavicon(id);
  try {
    localStorage.setItem(storageKey, id);
  } catch {
    // Keep the theme for this page even when storage is unavailable.
  }
}

export function initializeTheme(): void {
  const id = getTheme();
  document.documentElement.dataset.theme = id;
  updateFavicon(id);
}

function updateFavicon(id: ThemeId): void {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) return;
  const accent = themes.find((theme) => theme.id === id)?.colors[2] ?? themes[0].colors[2];
  const iconColor = id === "c" || id === "d" ? "#171C21" : "#FFFFFF";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="7" fill="${accent}"/><path d="m15 12-8 8 8 8m10-16 8 8-8 8" stroke="${iconColor}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
