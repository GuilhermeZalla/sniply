import type { User } from "./types";
let accessToken: string | null = null;
let refreshing: Promise<{ accessToken: string; user: User }> | null = null;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function response<T>(r: Response): Promise<T> {
  const data = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) {
    const errors = data?.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";
    throw new ApiError(
      r.status,
      errors ||
        data?.detail ||
        data?.title ||
        (r.status === 429
          ? "Too many requests. Wait a minute and try again."
          : "Could not complete the request."),
    );
  }
  return data as T;
}
export async function refresh() {
  if (!refreshing)
    refreshing = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then(response<{ accessToken: string; user: User }>)
      .then((data) => {
        accessToken = data.accessToken;
        return data;
      })
      .finally(() => {
        refreshing = null;
      });
  return refreshing;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", "Bearer " + accessToken);
  let r: Response;
  try {
    r = await fetch("/api" + path, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      0,
      "Cannot reach the API. Check that the backend is running.",
    );
  }
  if (
    r.status === 401 &&
    retry &&
    ![
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/logout",
    ].includes(path)
  ) {
    try {
      await refresh();
    } catch {
      accessToken = null;
      window.dispatchEvent(new Event("sniply:session-ended"));
      throw new ApiError(401, "Your session has expired. Please sign in.");
    }
    return api<T>(path, options, false);
  }
  return response<T>(r);
}
export async function login(
  email: string,
  password: string,
  rememberMe: boolean,
) {
  const data = await api<{ accessToken: string; user: User }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password, rememberMe }) },
    false,
  );
  accessToken = data.accessToken;
  return data.user;
}
export async function logout() {
  try {
    await api("/auth/logout", { method: "POST" }, false);
  } finally {
    accessToken = null;
  }
}
export const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Could not complete the request.";
