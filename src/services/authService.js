import { api, setAccessToken } from "@/api/client";
import { endpoints } from "@/api/endpoints";

/** Email + password sign-in. */
export async function signIn({ email, password }) {
  const session = await api.post(endpoints.auth.signIn, { email, password });
  setAccessToken(session.token);
  return session;
}

/** Demo helper: sign in as the seeded account for a role. */
export async function signInAsRole(role) {
  const session = await api.post(endpoints.auth.signIn, { role });
  setAccessToken(session.token);
  return session;
}

/** Re-hydrate a session on page load. Resolves null when there is none. */
export async function restore(userId) {
  try {
    const session = await api.get(endpoints.auth.session, { userId });
    setAccessToken(session.token);
    return session;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function signOut() {
  try {
    await api.post(endpoints.auth.signOut);
  } finally {
    setAccessToken(null);
  }
}
