import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { z } from "zod";

async function session() {
  const password = process.env['SESSION_SECRET'];
  if (!password) throw new Error("Chưa cấu hình bảo vệ quản trị.");
  return useSession<{ admin?: boolean }>({ password, name: "trantrinh-admin", maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "strict", path: "/" } });
}
export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { authenticated: (await session()).data.admin === true };
});
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ password: z.string().min(1).max(256) }).parse(input))
  .handler(async ({ data }) => {
    const expected = process.env['SITE_PASSWORD'];
    const salt = process.env['SESSION_SECRET'];
    if (!expected || !salt) throw new Error("Chưa cấu hình bảo vệ quản trị.");
    const suppliedHash = pbkdf2Sync(data.password, salt, 100000, 32, "sha256");
    const expectedHash = pbkdf2Sync(expected, salt, 100000, 32, "sha256");
    if (!timingSafeEqual(suppliedHash, expectedHash)) return { ok: false };
    await (await session()).update({ admin: true });
    return { ok: true };
  });
export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  await (await session()).clear();
  return { ok: true };
});
export const requireAdmin = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await session()).data.admin) throw new Error("Unauthorized");
  return { ok: true };
});
