import '@tanstack/react-start/server-only';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { getRequest, useSession } from '@tanstack/react-start/server';
import { z } from 'zod';
import { assertAdminSession } from './admin-session.server';
import { defaultSettings, emptyProfile, MAX_REPLY, normalizeKeyword, normalizeName, validateProfile, type Profile, type Reply, type Settings } from './store';

const short = z.string().max(500);
export const profileSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), label: short,
  fullName: z.string().max(160), aliases: z.array(z.string().max(160)).max(30),
  keywordQuestion: short, keyword: z.string().max(256),
  status: z.enum(['draft', 'active', 'inactive']), greeting: short,
  question: short, answer: short, hint: short, correctReaction: short,
  skipThreshold: z.number().int().min(0).max(100), wishTitle: short,
  wish: z.string().max(20000), signature: short,
  musicTitle: short, musicArtist: short, musicUrl: z.string().max(4000),
  musicEnabled: z.boolean(), musicLoop: z.boolean(), musicVolume: z.number().min(0).max(1),
  memes: z.array(z.object({ enabled: z.boolean(), caption: short })).length(3),
  imageUrl: z.string().max(4000), imageAlt: short, imageFit: z.enum(['cover', 'contain']),
  photoId: z.string().regex(/^(?:cloud:[a-f0-9]{64}\.jpg)?$/), repliesEnabled: z.boolean(),
  openedCount: z.number().int().min(0), lastOpenedAt: z.string().datetime({ offset: true }).nullable(),
  createdAt: z.string().datetime({ offset: true }), updatedAt: z.string().datetime({ offset: true }),
});
export const settingsSchema = z.object({
  brandTitle: short, brandSubtitle: short, signature: short, confetti: z.boolean(),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i), accentColor: z.string().regex(/^#[0-9a-f]{6}$/i),
});
export const replySchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), profileId: z.string().max(100),
  profileLabel: short, nickname: z.string().trim().min(1).max(40),
  message: z.string().trim().min(1).max(MAX_REPLY), createdAt: z.string().datetime({ offset: true }), read: z.boolean(),
});

function config() {
  const url = process.env['SUPABASE_URL']?.replace(/\/$/, '');
  const key = process.env['SUPABASE_SECRET_KEY'];
  if (!url || !key) throw new Error('Chưa cấu hình kết nối dữ liệu.');
  return { url, key };
}
export async function request<T>(path: string, method = 'GET', body?: unknown, prefer?: string): Promise<T> {
  const { url, key } = config();
  const headers: Record<string, string> = { apikey: key };
  // Legacy service_role JWTs need Authorization; new sb_secret keys use apikey only.
  if (!key.startsWith('sb_secret_')) headers['Authorization'] = `Bearer ${key}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers['Prefer'] = prefer;
  let response: Response;
  try {
    response = await fetch(`${url}${path}`, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000), cache: 'no-store' });
  } catch { throw new Error('Không kết nối được kho dữ liệu. Bạn thử lại nhé.'); }
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { code?: string };
    if (error.code === '23505') throw new Error('Tên hoặc tên gọi khác trùng với hồ sơ đang bật.');
    if (error.code === '42P01' || error.code === 'PGRST205' || error.code === 'PGRST202') throw new Error('Cần chạy tệp supabase/setup.sql trong SQL Editor trước.');
    throw new Error('Không đọc hoặc lưu được dữ liệu. Kiểm tra cấu hình Supabase và thử lại.');
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
export const rpc = <T>(name: string, body: unknown) => request<T>(`/rest/v1/rpc/${name}`, 'POST', body);
const byId = (id: string) => `id=eq.${encodeURIComponent(id)}`;
export async function readProfile(id: string) {
  const rows = await request<{ data: Profile }[]>(`/rest/v1/gift_profiles?${byId(id)}&select=data&limit=1`);
  return rows[0]?.data ?? null;
}
export async function readSettings(): Promise<Settings> {
  const rows = await request<{ data: Settings }[]>('/rest/v1/gift_settings?select=data&limit=1');
  return { ...defaultSettings, ...rows[0]?.data, brandTitle: defaultSettings.brandTitle };
}
export async function signedPortrait(photoId: string) {
  if (!photoId) return '';
  const path = photoId.replace(/^cloud:/, '');
  if (!/^[a-f0-9]{64}\.jpg$/.test(path)) throw new Error('Ảnh cũ cần được chuyển lên kho dữ liệu.');
  const result = await request<{ signedURL: string }>(`/storage/v1/object/sign/gift-portraits/${path}`, 'POST', { expiresIn: 28800 });
  return new URL(`${config().url}/storage/v1${result.signedURL}`).href;
}
export async function displayProfile(p: Profile, recipient = false): Promise<Profile> {
  return { ...p, ...(recipient ? { keyword: '', answer: '', question: '', label: '', aliases: [], openedCount: 0, lastOpenedAt: null } : {}),
    photoUrl: await signedPortrait(p.photoId) };
}
export function challenge(p: Profile): Profile {
  // Explicit allowlist: the browser receives no letter, image, music or keyword yet.
  return { ...emptyProfile(), id: p.id, greeting: p.greeting, keywordQuestion: p.keywordQuestion,
    hint: p.hint && !normalizeKeyword(p.hint).includes(normalizeKeyword(p.keyword)) ? p.hint : 'Hãy nhớ lại từ khoá bạn được gửi nhé.' };
}
type GiftSession = { pendingId?: string; profileId?: string; revision?: string; sessionId?: string };
export async function giftSession() {
  const password = process.env['SESSION_SECRET'];
  if (!password) throw new Error('Chưa cấu hình phiên truy cập.');
  return useSession<GiftSession>({ password, name: 'trantrinh-gift', maxAge: 28800,
    cookie: { httpOnly: true, secure: true, sameSite: 'strict', path: '/' } });
}
function revision(p: Profile) {
  return createHash('sha256').update(`${p.updatedAt}:${p.keyword}:${p.status}`).digest('hex');
}
export async function limit(scope: string, max: number, seconds: number) {
  const headers = getRequest().headers;
  const ip = headers.get('x-vercel-forwarded-for') ?? headers.get('x-real-ip') ?? 'local';
  const secret = process.env['SESSION_SECRET'];
  if (!secret) throw new Error('Chưa cấu hình phiên truy cập.');
  const key = createHmac('sha256', secret).update(`${scope}:${ip}`).digest('hex');
  if (!await rpc<boolean>('gift_rate_limit', { p_key: key, p_max: max, p_seconds: seconds })) throw new Error('Bạn thao tác hơi nhanh. Vui lòng thử lại sau vài phút.');
}
export async function authorizedProfile(id: string) {
  const session = await giftSession();
  const p = await readProfile(id);
  if (!p || p.status !== 'active' || session.data.profileId !== id || session.data.revision !== revision(p)) throw new Error('Phiên nhận quà đã hết hạn. Bạn về trang đầu và nhập lại từ khoá nhé.');
  return { p, session };
}
export async function lookup(name: string) {
  await limit('lookup', 40, 300);
  const session = await giftSession();
  await session.clear();
  const rows = await request<{ profile_id: string }[]>(`/rest/v1/gift_names?name=eq.${encodeURIComponent(normalizeName(name))}&select=profile_id&limit=1`);
  const p = rows[0] ? await readProfile(rows[0].profile_id) : null;
  if (!p || p.status !== 'active') return null;
  await session.update({ pendingId: p.id });
  return challenge(p);
}
export async function unlock(id: string, answer: string) {
  await limit('keyword', 15, 300);
  const session = await giftSession();
  if (session.data.pendingId !== id) throw new Error('Bạn nhập lại họ tên trước nhé.');
  const p = await readProfile(id);
  const hash = (s: string) => createHash('sha256').update(normalizeKeyword(s)).digest();
  if (!p || p.status !== 'active' || !answer.trim() || !timingSafeEqual(hash(answer), hash(p.keyword))) return null;
  const result = await displayProfile(p, true);
  await session.clear();
  await session.update({ profileId: id, revision: revision(p), sessionId: randomUUID() });
  return result;
}
export async function saveProfile(raw: unknown, importing = false) {
  await assertAdminSession();
  const p = profileSchema.parse(raw);
  const all = (await request<{ data: Profile }[]>('/rest/v1/gift_profiles?select=data')).map(x => x.data);
  if (importing && all.some(x => x.id === p.id)) return false;
  const errors = validateProfile(p, p.status === 'active' ? 'active' : 'draft', all);
  if (Object.keys(errors).length) throw new Error(Object.values(errors).join(' '));
  const next = { ...p, keyword: p.keyword.trim(), fullName: p.fullName.trim().replace(/\s+/g, ' '), updatedAt: new Date().toISOString() };
  return rpc<boolean>('gift_save_profile', { p_data: next, p_names: [next.fullName, ...next.aliases].map(normalizeName).filter(Boolean), p_import: importing });
}
export async function uploadPortrait(base64: string) {
  await assertAdminSession();
  const blob = Buffer.from(base64, 'base64');
  if (blob.length > 2097152 || blob.length < 4 || blob[0] !== 255 || blob[1] !== 216 || blob[2] !== 255) throw new Error('Ảnh JPG sau nén tối đa 2 MB.');
  const path = `${createHash('sha256').update(blob).digest('hex')}.jpg`;
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1/object/gift-portraits/${path}`, { method: 'POST',
    headers: { apikey: key, ...(!key.startsWith('sb_secret_') ? { Authorization: `Bearer ${key}` } : {}), 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
    body: blob, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('Không tải được ảnh lên Supabase. Kiểm tra đã chạy setup.sql.');
  const photoId = `cloud:${path}`;
  return { photoId, photoUrl: await signedPortrait(photoId) };
}
export async function createReply(id: string, nickname: string, message: string, replyId: string) {
  const { p } = await authorizedProfile(id);
  if (!p.repliesEnabled) throw new Error('Hồ sơ này đã tắt nhận lời nhắn.');
  await limit('reply', 10, 300);
  const reply: Reply = { id: replyId, profileId: id, profileLabel: p.label, nickname, message, createdAt: new Date().toISOString(), read: false };
  // A retry uses the same id, so an interrupted response cannot duplicate the reply.
  await request('/rest/v1/gift_replies?on_conflict=id', 'POST', { id: reply.id, profile_id: id, data: reply }, 'resolution=ignore-duplicates');
  return reply;
}
