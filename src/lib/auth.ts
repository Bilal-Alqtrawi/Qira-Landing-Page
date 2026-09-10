import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { companies, sessions } from "@/db/schema";

const scryptAsync = promisify(scrypt);
const cookieName = "sufra_session";
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}
export async function verifyPassword(password: string, saved: string) {
  const [salt, key] = saved.split(":");
  if (!salt || !key) return false;
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  const original = Buffer.from(key, "hex");
  return hash.length === original.length && timingSafeEqual(hash, original);
}
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function createSession(companyId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await db
    .insert(sessions)
    .values({ tokenHash: tokenHash(token), companyId, expiresAt });
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}
export async function getCompany() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const [result] = await db
    .select({ company: companies })
    .from(sessions)
    .innerJoin(companies, eq(sessions.companyId, companies.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!result) return null;
  const { passwordHash: _passwordHash, ...company } = result.company;
  return company;
}
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token)
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash(token)));
  jar.delete(cookieName);
}
export async function getGuestToken(create = false) {
  const jar = await cookies();
  const existing = jar.get("sufra_guest")?.value;
  if (existing && /^[a-f0-9]{48}$/.test(existing)) return existing;
  if (!create) return null;
  const token = randomBytes(24).toString("hex");
  jar.set("sufra_guest", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 86400 * 7,
  });
  return token;
}

const buckets = new Map<string, { count: number; expires: number }>();
export function rateLimit(request: Request, prefix: string, limit = 12) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${prefix}:${ip}`;
  const current = buckets.get(key);
  if (!current || current.expires < Date.now()) {
    if (buckets.size > 10000) buckets.clear();
    buckets.set(key, { count: 1, expires: Date.now() + 60000 });
    return true;
  }
  current.count++;
  return current.count <= limit;
}
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = new URL(origin).host;
    return (
      host === request.headers.get("host") ||
      host === request.headers.get("x-forwarded-host") ||
      host === new URL(request.url).host
    );
  } catch {
    return false;
  }
}
