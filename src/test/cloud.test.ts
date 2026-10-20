// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { emptyProfile, type Profile } from '../lib/store';

const state = vi.hoisted(() => ({
  admin: false,
  session: { data: {} as Record<string, unknown>,
    async clear() { this.data = {}; },
    async update(next: Record<string, unknown>) { Object.assign(this.data, next); },
  },
}));
vi.mock('@tanstack/react-start/server', () => ({
  useSession: async () => state.session,
  getRequest: () => new Request('https://example.com', { headers: { 'x-real-ip': '127.0.0.1' } }),
}));
vi.mock('../lib/admin-session.server', () => ({
  assertAdminSession: async () => { if (!state.admin) throw new Error('Bạn cần đăng nhập quản trị.'); },
}));
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    let validate: ((data: unknown) => unknown) | undefined;
    const builder = {
      validator(fn: (data: unknown) => unknown) { validate = fn; return builder; },
      handler(fn: (input: { data: unknown }) => unknown) {
        return async (input?: { data: unknown }) => fn({ data: validate ? validate(input?.data) : input?.data });
      },
    };
    return builder;
  },
}));

import { authorizedProfile, challenge, createReply, lookup, request, saveProfile, unlock, uploadPortrait } from '../lib/cloud.server';
import { adminData, adminImportLegacy, adminPortrait, adminSaveSettings, previewGift } from '../lib/gift.functions';

let profile: Profile;
let allowRequests: boolean;
let exists: boolean;
let fetchMock: ReturnType<typeof vi.fn>;
const ok = (value: unknown) => new Response(JSON.stringify(value), { status: 200 });
beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test_not_real');
  vi.stubEnv('SESSION_SECRET', 'test-secret-at-least-32-characters-long');
  state.admin = false; state.session.data = {}; allowRequests = true; exists = false;
  profile = { ...emptyProfile(), id: 'private-profile', label: 'Internal', fullName: 'Nguyễn Ngọc Linh', aliases: ['Ngọc Linh'], status: 'active', keyword: 'HoaMeo', wish: 'PRIVATE LETTER', hint: 'Use hoameo', musicUrl: 'https://example.com/private.mp3' };
  fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    if (url.pathname.endsWith('gift_rate_limit')) return ok(allowRequests);
    if (url.pathname.endsWith('gift_names')) return ok([{ profile_id: profile.id }]);
    if (url.pathname.endsWith('gift_profiles')) {
      if (url.searchParams.has('id')) return ok([{ data: profile }]);
      return ok(exists ? [{ data: profile }] : []);
    }
    if (url.pathname.endsWith('gift_save_profile')) return ok(true);
    if (url.pathname.endsWith('gift_replies')) return ok([]);
    if (url.pathname.endsWith('gift_settings')) return ok([]);
    throw new Error(`Unexpected request: ${url.pathname} ${init?.method}`);
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('shared gift storage permissions', () => {
  it('does not expose the letter, keyword or media during name lookup', async () => {
    const result = await lookup(' NGỌC   LINH ');
    expect(result).toMatchObject({ id: profile.id, wish: '', keyword: '', musicUrl: '', photoId: '' });
    expect(JSON.stringify(result)).not.toContain('PRIVATE LETTER');
    expect(result?.hint).not.toContain('hoameo');
    expect(state.session.data).toEqual({ pendingId: profile.id });
    expect(challenge(profile).label).toBe('');
  });
  it('requires the matching challenge and a correct keyword before issuing access', async () => {
    await expect(unlock(profile.id, 'hoameo')).rejects.toThrow('họ tên');
    state.session.data = { pendingId: profile.id };
    expect(await unlock(profile.id, 'wrong')).toBeNull();
    expect(state.session.data['profileId']).toBeUndefined();
    const result = await unlock(profile.id, ' HOAMEO ');
    expect(result).toMatchObject({ wish: 'PRIVATE LETTER', keyword: '', label: '', aliases: [] });
    expect(state.session.data['pendingId']).toBeUndefined();
    expect((await authorizedProfile(profile.id)).p.id).toBe(profile.id);
    await expect(authorizedProfile('another-person')).rejects.toThrow('hết hạn');
    profile = { ...profile, keyword: 'new-keyword' };
    await expect(authorizedProfile(profile.id)).rejects.toThrow('hết hạn');
  });
  it('rejects inactive profiles and throttled requests without granting access', async () => {
    profile.status = 'inactive';
    expect(await lookup('Ngọc Linh')).toBeNull();
    expect(state.session.data).toEqual({});
    allowRequests = false;
    await expect(lookup('Ngọc Linh')).rejects.toThrow('hơi nhanh');
  });
  it('blocks unauthenticated admin reads, preview, imports, settings and image uploads', async () => {
    await expect(adminData()).rejects.toThrow('đăng nhập');
    await expect(previewGift({ data: { id: profile.id } })).rejects.toThrow('đăng nhập');
    await expect(adminPortrait({ data: { photoId: `cloud:${'a'.repeat(64)}.jpg` } })).rejects.toThrow('đăng nhập');
    await expect(adminImportLegacy({ data: { profiles: [], replies: [], settings: {} } })).rejects.toThrow('đăng nhập');
    await expect(adminSaveSettings({ data: {} as never })).rejects.toThrow('đăng nhập');
    await expect(saveProfile(profile)).rejects.toThrow('đăng nhập');
    await expect(uploadPortrait('/9j/')).rejects.toThrow('đăng nhập');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('validates profiles on the server and protects existing records during import', async () => {
    state.admin = true;
    await expect(saveProfile({ ...profile, musicVolume: 4 })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
    exists = true;
    expect(await saveProfile({ ...profile, wish: 'STALE LOCAL LETTER' }, true)).toBe(false);
    expect(fetchMock.mock.calls.every(([url]) => !String(url).includes('gift_save_profile'))).toBe(true);
    exists = false;
    await saveProfile(profile);
    const write = fetchMock.mock.calls.find(([url]) => String(url).includes('gift_save_profile'));
    const body = JSON.parse(String(write?.[1]?.body));
    expect(body.p_names).toEqual(['nguyễn ngọc linh', 'ngọc linh']);
  });
  it('requires a live recipient session for replies and uses server-owned metadata', async () => {
    await expect(createReply(profile.id, 'Guest', 'Hi', 'reply-id')).rejects.toThrow('hết hạn');
    state.session.data = { pendingId: profile.id };
    await unlock(profile.id, 'hoameo');
    const reply = await createReply(profile.id, 'Guest', 'Hi', 'reply-id');
    expect(reply).toMatchObject({ profileId: profile.id, profileLabel: 'Internal', read: false });
    const write = fetchMock.mock.calls.find(([url, init]) => String(url).includes('gift_replies') && init?.method === 'POST');
    expect((write?.[1]?.headers as Record<string, string>)['Prefer']).toBe('resolution=ignore-duplicates');
    profile.repliesEnabled = false;
    await expect(createReply(profile.id, 'Guest', 'Hi', 'another-id')).rejects.toThrow('tắt nhận');
  });
  it('sends new secret keys only in apikey and reports missing SQL without leaking backend details', async () => {
    await request('/rest/v1/gift_settings');
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['apikey']).toBe('sb_secret_test_not_real');
    expect(headers['Authorization']).toBeUndefined();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ code: 'PGRST205', message: 'PRIVATE DETAILS' }), { status: 404 }));
    await expect(request('/rest/v1/gift_settings')).rejects.toThrow('setup.sql');
  });
});
