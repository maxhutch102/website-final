import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { authSessions, employees, leads } from "@/db/schema";

export type ChatGPTUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

export const AUTH_COOKIE = "ph_session";
export const SESSION_DAYS = 14;

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return bytesToBase64Url(value);
}

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const now = new Date().toISOString();
  const [session] = await db.select().from(authSessions).where(and(
    eq(authSessions.tokenHash, await sha256(token)),
    gt(authSessions.expiresAt, now),
  )).limit(1);
  if (!session) return null;

  const email = session.email.toLowerCase();
  const [employee] = await db.select().from(employees)
    .where(eq(employees.email, email)).limit(1);
  if (employee) {
    const fullName = `${employee.preferredName || employee.firstName} ${employee.lastName}`.trim();
    return { email, fullName, displayName: fullName || email };
  }

  const [lead] = await db.select().from(leads).where(eq(leads.email, email)).limit(1);
  const fullName = lead?.name?.trim() || null;
  return { email, fullName, displayName: fullName || email };
}

export async function requireChatGPTUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(`/login?returnTo=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`);
}

export function chatGPTSignInPath(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function chatGPTSignOutPath(returnTo = "/"): string {
  return `/api/auth/logout?returnTo=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export async function createSession(email: string) {
  const db = await getDb();
  const token = randomToken();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86400000);
  await db.insert(authSessions).values({
    email: email.toLowerCase(),
    tokenHash: await sha256(token),
    expiresAt: expires.toISOString(),
    lastSeenAt: now.toISOString(),
    createdAt: now.toISOString(),
  });
  return { token, expires };
}

export function sessionCookie(token: string, expires: Date) {
  return `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expires.toUTCString()}`;
}

export function clearSessionCookie() {
  return `${AUTH_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
