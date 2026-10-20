import '@tanstack/react-start/server-only';
import { useSession } from '@tanstack/react-start/server';

export async function adminSession() {
  const password = process.env['SESSION_SECRET'];
  if (!password) throw new Error('Chưa cấu hình bảo vệ quản trị.');
  return useSession<{ admin?: boolean }>({ password, name: 'trantrinh-admin', maxAge: 28800,
    cookie: { httpOnly: true, secure: true, sameSite: 'strict', path: '/' } });
}
export async function assertAdminSession() {
  if (!(await adminSession()).data.admin) throw new Error('Bạn cần đăng nhập quản trị.');
}
