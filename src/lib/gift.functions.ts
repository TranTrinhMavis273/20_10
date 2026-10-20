import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { Profile, Reply, Settings } from './store';

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
export const siteSettings = createServerFn({ method: 'GET' }).handler(async () => {
  return (await import('./cloud.server')).readSettings();
});
export const findGift = createServerFn({ method: 'POST' })
  .validator((input) => z.object({ name: z.string().trim().min(1).max(160) }).parse(input))
  .handler(async ({ data }) => (await import('./cloud.server')).lookup(data.name));
export const unlockGift = createServerFn({ method: 'POST' })
  .validator((input) => z.object({ id, answer: z.string().min(1).max(256) }).parse(input))
  .handler(async ({ data }) => (await import('./cloud.server')).unlock(data.id, data.answer));
export const exitGift = createServerFn({ method: 'POST' }).handler(async () => {
  await (await (await import('./cloud.server')).giftSession()).clear();
  return { ok: true };
});
export const openGift = createServerFn({ method: 'POST' })
  .validator((input) => z.object({ id }).parse(input))
  .handler(async ({ data }) => {
    const cloud = await import('./cloud.server');
    const { session } = await cloud.authorizedProfile(data.id);
    await cloud.rpc('gift_record_open', { p_id: data.id, p_session: session.data.sessionId });
    return { ok: true };
  });
export const sendGiftReply = createServerFn({ method: 'POST' })
  .validator((input) => z.object({ id, replyId: z.string().uuid(), nickname: z.string().trim().min(1).max(40), message: z.string().trim().min(1).max(2000) }).parse(input))
  .handler(async ({ data }) => (await import('./cloud.server')).createReply(data.id, data.nickname, data.message, data.replyId));
export const previewGift = createServerFn({ method: 'POST' })
  .validator((input) => z.object({ id }).parse(input))
  .handler(async ({ data }) => {
    await (await import('./admin-session.server')).assertAdminSession();
    const cloud = await import('./cloud.server');
    const p = await cloud.readProfile(data.id);
    return p ? cloud.displayProfile(p, true) : null;
  });
export const adminData = createServerFn({ method: 'POST' }).handler(async () => {
  await (await import('./admin-session.server')).assertAdminSession();
  const cloud = await import('./cloud.server');
  const [profiles, replies, settings] = await Promise.all([
    cloud.request<{ data: Profile }[]>('/rest/v1/gift_profiles?select=data&order=id'),
    cloud.request<{ data: Reply }[]>('/rest/v1/gift_replies?select=data&order=data->>createdAt.desc'),
    cloud.readSettings(),
  ]);
  // Sign images only when opening the editor or recipient view, not for every card.
  return { profiles: profiles.map(x => x.data), replies: replies.map(x => x.data), settings };
});
export const adminSaveProfile = createServerFn({ method: 'POST' })
  .validator((input: Profile) => input)
  .handler(async ({ data }) => {
    await (await import('./cloud.server')).saveProfile(data);
    return { ok: true };
  });
export const adminPortrait = createServerFn({ method: 'POST' })
  .validator((input) => z.object({ photoId: z.string().regex(/^cloud:[a-f0-9]{64}\.jpg$/) }).parse(input))
  .handler(async ({ data }) => {
    await (await import('./admin-session.server')).assertAdminSession();
    return (await import('./cloud.server')).signedPortrait(data.photoId);
  });
export const adminUploadPortrait = createServerFn({ method: 'POST' })
  .validator((input) => z.object({ base64: z.string().max(2800000) }).parse(input))
  .handler(async ({ data }) => (await import('./cloud.server')).uploadPortrait(data.base64));
export const adminSaveSettings = createServerFn({ method: 'POST' })
  .validator((input: Settings) => input)
  .handler(async ({ data }) => {
    await (await import('./admin-session.server')).assertAdminSession();
    const cloud = await import('./cloud.server');
    const settings = cloud.settingsSchema.parse(data);
    await cloud.request('/rest/v1/gift_settings?on_conflict=id', 'POST', { id: true, data: settings }, 'resolution=merge-duplicates');
    return { ok: true };
  });
export const adminChangeReply = createServerFn({ method: 'POST' })
  .validator((input) => z.object({ id, read: z.boolean().optional(), remove: z.boolean().optional() }).parse(input))
  .handler(async ({ data }) => {
    await (await import('./admin-session.server')).assertAdminSession();
    const cloud = await import('./cloud.server');
    const query = `/rest/v1/gift_replies?id=eq.${encodeURIComponent(data.id)}`;
    if (data.remove) await cloud.request(query, 'DELETE');
    else {
      const rows = await cloud.request<{ data: Reply }[]>(`${query}&select=data&limit=1`);
      if (rows[0]) await cloud.request(query, 'PATCH', { data: { ...rows[0].data, read: data.read ?? false } });
    }
    return { ok: true };
  });
export const adminImportLegacy = createServerFn({ method: 'POST' })
  .validator((input) => z.object({ profiles: z.array(z.unknown()).max(500), replies: z.array(z.unknown()).max(1000), settings: z.unknown() }).parse(input))
  .handler(async ({ data }) => {
    await (await import('./admin-session.server')).assertAdminSession();
    const cloud = await import('./cloud.server');
    // Validate the whole request before writing any records.
    const profiles = data.profiles.map(x => cloud.profileSchema.parse(x));
    const replies = data.replies.map(x => cloud.replySchema.parse(x));
    const settings = cloud.settingsSchema.parse(data.settings);
    let imported = 0;
    for (const p of profiles) if (await cloud.saveProfile(p, true)) imported++;
    // Import is additive: never replace a cloud reply or settings on a retry.
    for (const r of replies) {
      if (!await cloud.readProfile(r.profileId)) throw new Error('Lời nhắn tham chiếu hồ sơ chưa được chuyển. Dữ liệu cũ vẫn được giữ.');
      await cloud.request('/rest/v1/gift_replies?on_conflict=id', 'POST', { id: r.id, profile_id: r.profileId, data: r }, 'resolution=ignore-duplicates');
    }
    await cloud.request('/rest/v1/gift_settings?on_conflict=id', 'POST', { id: true, data: settings }, 'resolution=ignore-duplicates');
    return { imported, skipped: profiles.length - imported };
  });
