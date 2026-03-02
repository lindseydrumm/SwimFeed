const AUTH_KEY = "swimlive_auth_v1";

export function isAuthed(): boolean {
  return Boolean(localStorage.getItem(AUTH_KEY));
}

export function login(email: string): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ email }));
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getUser(): { email: string } | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}