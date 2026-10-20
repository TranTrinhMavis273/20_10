import { demoMusicUrls, defaultMemes } from "@/lib/gift-assets";
// Shared data is accessed through the cloud facade below. The synchronous local
// functions remain solely for importing existing browser records and old tests.

export type ProfileStatus = "draft" | "active" | "inactive";

export type Profile = {
  id: string;
  label: string;
  fullName: string;
  aliases: string[];
  keywordQuestion: string;
  musicTitle: string;
  musicArtist: string;
  musicUrl: string;
  musicEnabled: boolean;
  musicLoop: boolean;
  musicVolume: number;
  memes: { enabled: boolean; caption: string }[];
  keyword: string;
  status: ProfileStatus;
  greeting: string;
  question: string;
  answer: string;
  hint: string;
  correctReaction: string;
  skipThreshold: number;
  wishTitle: string;
  wish: string;
  signature: string;
  imageUrl: string;
  imageAlt: string;
  imageFit: "cover" | "contain";
  photoId: string;
  photoUrl?: string; // Temporary signed URL; never persisted in the database.
  repliesEnabled: boolean;
  openedCount: number;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Reply = {
  id: string;
  profileId: string;
  profileLabel: string;
  nickname: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type Settings = {
  brandTitle: string;
  brandSubtitle: string;
  primaryColor: string;
  accentColor: string;
  signature: string;
  confetti: boolean;
};

export type Progress = {
  version: 2;
  nickname: string;
  step: "keyword" | "gifts" | "letter";
  attempts: number;
  verified: boolean;
  cat: number | null;
};

const K = {
  profiles: "mh.profiles.v1",
  replies: "mh.replies.v1",
  settings: "mh.settings.v1",
  progress: (id: string) => `mh.progress.v2.${id}`,
  draft: (id: string) => `mh.draft.v1.${id}`,
  session: "mh.session.v2",
};

export const MAX_REPLY = 2000;

export const normalizeName = (s: string) => s.trim().replace(/\s+/g, " ").normalize("NFC").toLocaleLowerCase("vi");

export const normalizeKeyword = (s: string) => s.trim().normalize("NFC").toLocaleLowerCase("vi");

/** Letters/digits of the answer as tiles (NFC, uppercase), spaces & punctuation ignored. */
export function answerTiles(answer: string): string[] {
  return Array.from(answer.normalize("NFC").toLocaleUpperCase("vi")).filter((c) =>
    /[\p{L}\p{N}]/u.test(c),
  );
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i] as T; a[i] = a[j] as T; a[j] = t;
  }
  // avoid presenting the solved order
  if (a.length > 1 && a.join("") === arr.join("")) {
    const different = a.findIndex((v) => String(v) !== String(a[0]));
    if (different > 0) { const t = a[0] as T; a[0] = a[different] as T; a[different] = t; }
  }
  return a;
}

export const fillNickname = (tpl: string, nickname: string) =>
  tpl.replace(/\{nickname\}/g, nickname);

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const SITE_NAME = "Gửi những người phụ nữ của TranTrinh";
export const defaultSettings: Settings = {
  brandTitle: SITE_NAME,
  brandSubtitle: "Quà 20/10",
  primaryColor: "#FF5C89",
  accentColor: "#FB8CAC",
  signature: "Từ một người luôn quý bạn",
  confetti: true,
};

export function emptyProfile(): Profile {
  const now = new Date().toISOString();
  return {
    id: uid(),
    label: "",
    fullName: "",
    aliases: [],
    keywordQuestion: "Từ khoá bí mật bạn được gửi là gì?",
    musicTitle: "Giai điệu tặng bạn",
    musicArtist: "Meo & Hoa · giai điệu nguyên bản",
    musicUrl: "",
    musicEnabled: false,
    musicLoop: true,
    musicVolume: 0.4,
    memes: defaultMemes.map((m) => ({ ...m })),
    keyword: "",
    status: "draft",
    greeting: "Chào {nickname}!",
    question: "",
    answer: "",
    hint: "",
    correctReaction: "Đúng rồi!",
    skipThreshold: 3,
    wishTitle: "Chúc mừng 20/10",
    wish: "",
    signature: "",
    imageUrl: "",
    imageAlt: "",
    imageFit: "cover",
    photoId: "",
    repliesEnabled: true,
    openedCount: 0,
    lastOpenedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function seed(): Profile[] {
  const base = emptyProfile();
  return [
    {
      ...base,
      id: "seed-hoameo",
      label: "Bạn thân hội hoa",
      keyword: "hoameo",
      status: "active",
      greeting: "Chào {nickname} ơi! Hôm nay là ngày của bạn đó nha 🌷",
      question: "Loài hoa nào tượng trưng cho tình yêu và được tặng nhiều nhất ngày 20/10?",
      answer: "HOA HỒNG",
      hint: "Có gai, màu đỏ, bắt đầu bằng chữ H.",
      correctReaction: "Chuẩn không cần chỉnh! Meo vỗ tay rần rần 👏",
      wishTitle: "Gửi {nickname} — bông hoa xinh nhất",
      wish: "Chúc {nickname} một ngày 20/10 thật rực rỡ: cà phê ngon, deadline nhẹ, và thật nhiều tiếng cười. Cảm ơn vì đã luôn là người dịu dàng nhất trong nhóm. Mong bạn luôn được yêu thương như cách bạn yêu thương mọi người.",
      signature: "Meo Mập",
      imageUrl: "",
    },
    {
      ...base,
      id: "seed-dalat",
      label: "Người bạn đồng hành Đà Lạt",
      keyword: "dalat1208",
      status: "active",
      greeting: "{nickname} ơi, còn nhớ chuyến đi sương mù năm ấy không?",
      question: "Thành phố ngàn hoa nơi tụi mình từng lạc đường?",
      answer: "ĐÀ LẠT",
      hint: "Thành phố sương mù ở Lâm Đồng.",
      correctReaction: "Đúng rồi! Thơm mùi dâu tây và thông luôn 🍓",
      skipThreshold: 3,
      wishTitle: "Một chút se lạnh cho {nickname}",
      wish: "Chúc {nickname} 20/10 ấm áp như ly sữa đậu nành ở chợ đêm. Mong năm nay mình lại được đi cùng nhau thêm thật nhiều nơi.",
      signature: "Hoa Cúc",
    },
    {
      ...base,
      id: "seed-meomeo",
      label: "Hội yêu mèo",
      keyword: "meomeo",
      status: "draft",
      greeting: "Meo meo! {nickname} đã tới rồi 🐾",
      question: "Mèo con lúc ngủ thì trông như thế nào?",
      answer: "DỄ THƯƠNG",
      hint: "Hai chữ, chữ đầu có dấu ngã.",
      correctReaction: "Chính xác! Dễ thương y như {nickname} vậy 😽",
      skipThreshold: 2,
      wishTitle: "Một rổ meo cho {nickname}",
      wish: "Chúc {nickname} 20/10 nhiều niềm vui, được ngủ nướng như mèo và ăn ngon như mèo được pate.",
      signature: "Bé Mun",
      repliesEnabled: false,
    },
  ];
}

// ---------- profiles ----------
export function getProfiles(): Profile[] {
  if (typeof window === "undefined") return [];
  const existing = read<Profile[] | null>(K.profiles, null);
  if (existing) {
    const migrated = existing.map(migrateProfile);
    if (JSON.stringify(existing) !== JSON.stringify(migrated)) write(K.profiles, migrated);
    invalidateLegacyAccess();
    return migrated;
  }
  const s = seed().map((p, i) => migrateProfile({ ...p, fullName: ["Nguyễn Ngọc Linh", "Trần Mai Anh", "Lê Minh An"][i] ?? "", aliases: [["Ngọc Linh"], ["Mai Anh"], ["Minh An"]][i] ?? [], musicUrl: demoMusicUrls[i] ?? "", musicEnabled: false }));
  invalidateLegacyAccess();
  write(K.profiles, s);
  return s;
}
export function saveProfiles(list: Profile[]) {
  write(K.profiles, list);
}
export function findByKeyword(keyword: string): Profile | null {
  const k = normalizeKeyword(keyword);
  if (!k) return null;
  return getProfiles().find((p) => p.status === "active" && normalizeKeyword(p.keyword) === k) ?? null;
}
export function getProfile(id: string) {
  return getProfiles().find((p) => p.id === id) ?? null;
}

export type ValidationErrors = Partial<Record<keyof Profile, string>>;

export function validateProfile(p: Profile, mode: "draft" | "active", all: Profile[]): ValidationErrors {
  const e: ValidationErrors = {};
  if (!p.label.trim()) e.label = "Cần nhãn nội bộ.";
  if (mode === "active") {
    if (!normalizeName(p.fullName)) e.fullName = "Cần họ và tên để bật hồ sơ.";
    const names = [p.fullName, ...p.aliases].map(normalizeName).filter(Boolean);
    if (new Set(names).size !== names.length) e.aliases = "Họ tên và tên gọi khác trong hồ sơ không được trùng nhau.";
    if (all.some(o => o.id !== p.id && o.status === "active" && [o.fullName, ...o.aliases].some(n => names.includes(normalizeName(n))))) {
      e.fullName = "Họ tên hoặc tên gọi khác trùng với một hồ sơ đang bật.";
      e.aliases = "Mỗi họ tên/tên gọi khác chỉ được dùng cho một hồ sơ đang bật.";
    }
    if (!p.keyword.trim()) e.keyword = "Cần từ khoá bí mật.";
    if (!p.keywordQuestion.trim()) e.keywordQuestion = "Cần câu hỏi từ khoá.";
    if (!p.greeting.trim()) e.greeting = "Cần lời chào.";
    if (!p.wish.trim()) e.wish = "Cần lời chúc.";
    if (!p.memes.some(m => m.enabled)) e.memes = "Chọn ít nhất một ảnh mèo.";
  }
  if (p.imageUrl && !/^https:\/\/\S+$/i.test(p.imageUrl)) e.imageUrl = "Đường dẫn ảnh phải bắt đầu bằng https://";
  if (p.musicEnabled && !isAudioUrl(p.musicUrl)) e.musicUrl = "Cần URL HTTPS trực tiếp .mp3, .ogg hoặc .wav (không phải trang YouTube/Spotify).";
  if (!Number.isFinite(p.musicVolume) || p.musicVolume < 0 || p.musicVolume > 1) e.musicVolume = "Âm lượng từ 0 đến 1.";
  return e;
}

export function isAudioUrl(url: string) {
  if (demoMusicUrls.includes(url)) return true;
  try { const u = new URL(url); return u.protocol === "https:" && /\.(mp3|ogg|wav)$/i.test(u.pathname) && !/(^|\.)(youtube\.com|youtu\.be|spotify\.com)$/i.test(u.hostname); } catch { return false; }
}

export function migrateProfile(raw: Profile): Profile {
  const index = ["seed-hoameo", "seed-dalat", "seed-meomeo"].indexOf(raw.id);
  const names = ["Nguyễn Ngọc Linh", "Trần Mai Anh", "Lê Minh An"];
  const aliases = ["Ngọc Linh", "Mai Anh", "Minh An"];
  const defaults = emptyProfile();
  return { ...defaults, ...raw,
    fullName: raw.fullName ?? names[index] ?? "",
    aliases: raw.aliases ?? (index >= 0 ? [aliases[index] as string] : []),
    keywordQuestion: raw.keywordQuestion ?? raw.question ?? defaults.keywordQuestion,
    musicUrl: raw.musicUrl ?? demoMusicUrls[index] ?? "",
    musicEnabled: demoMusicUrls.includes(raw.musicUrl ?? demoMusicUrls[index] ?? "") ? false : raw.musicEnabled ?? false,
    memes: defaultMemes.map((m, i) => ({ ...m, ...raw.memes?.[i] })),
  };
}
function invalidateLegacyAccess() {
  Object.keys(localStorage).filter(k => k.startsWith("mh.progress.v1.") || k === "mh.session.v1").forEach(k => localStorage.removeItem(k));
}
export function findByName(name: string): Profile | null {
  const n = normalizeName(name);
  if (!n) return null;
  const matches = getProfiles().filter(p => p.status === "active" && [p.fullName, ...p.aliases].some(x => normalizeName(x) === n));
  return matches.length === 1 ? matches[0] ?? null : null;
}
export function verifyKeyword(p: Profile, answer: string) {
  const current = getProfile(p.id);
  return current?.status === "active" && normalizeKeyword(answer) !== "" && normalizeKeyword(answer) === normalizeKeyword(current.keyword);
}

export function upsertProfile(p: Profile) {
  const list = getProfiles();
  const next = { ...p, updatedAt: new Date().toISOString() };
  const i = list.findIndex((x) => x.id === p.id);
  if (i >= 0) list[i] = next;
  else list.unshift(next);
  saveProfiles(list);
}
export function duplicateProfile(p: Profile): Profile {
  const copy: Profile = {
    ...p,
    id: uid(),
    label: `${p.label} (bản sao)`,
    keyword: "",
    status: "draft",
    openedCount: 0,
    lastOpenedAt: null,
    createdAt: new Date().toISOString(),
  };
  upsertProfile(copy);
  return copy;
}
export function recordOpen(id: string) {
  const list = getProfiles();
  const p = list.find((x) => x.id === id);
  if (!p) return;
  p.openedCount += 1;
  p.lastOpenedAt = new Date().toISOString();
  saveProfiles(list);
}

// ---------- progress / session ----------
export const getProgress = (id: string) => { const p = read<Progress | null>(K.progress(id), null); return p?.version === 2 ? p : null; };
export const saveProgress = (id: string, p: Progress) => write(K.progress(id), p);
export const clearProgress = (id: string) => localStorage.removeItem(K.progress(id));
export const getSession = () => read<{ profileId: string } | null>(K.session, null);
export const saveSession = (s: { profileId: string } | null) =>
  s ? write(K.session, s) : localStorage.removeItem(K.session);

// ---------- replies ----------
export const getReplies = () => read<Reply[]>(K.replies, []);
export function addReply(r: Omit<Reply, "id" | "createdAt" | "read">): Reply {
  const reply: Reply = { ...r, id: uid(), createdAt: new Date().toISOString(), read: false };
  write(K.replies, [reply, ...getReplies()]);
  return reply;
}
export const saveReplies = (list: Reply[]) => write(K.replies, list);
export const getDraft = (id: string) => read<{ nickname: string; message: string } | null>(K.draft(id), null);
export const saveDraft = (id: string, d: { nickname: string; message: string } | null) =>
  d ? write(K.draft(id), d) : localStorage.removeItem(K.draft(id));

// ---------- settings ----------
export function getSettings(): Settings {
  const old = read<Partial<Settings>>(K.settings, {});
  const next = { ...defaultSettings, ...old, brandTitle: SITE_NAME,
    primaryColor: !old.primaryColor || old.primaryColor === "#e8667a" ? defaultSettings.primaryColor : old.primaryColor,
    accentColor: !old.accentColor || old.accentColor === "#8fae8b" ? defaultSettings.accentColor : old.accentColor };
  if (typeof window !== "undefined") write(K.settings, next);
  return next;
}
export const saveSettings = (s: Settings) => write(K.settings, s);

export function resetDemo() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("mh."))
    .forEach((k) => localStorage.removeItem(k));
}

// ---------- shared server storage (the only store used by the live UI) ----------
const cloud = () => import('./gift.functions');
export const loadCloudSettings = async () => (await cloud()).siteSettings();
export const loadAdminData = async () => (await cloud()).adminData();
export const findCloudGift = async (name: string) => (await cloud()).findGift({ data: { name } });
export const unlockCloudGift = async (id: string, answer: string) => (await cloud()).unlockGift({ data: { id, answer } });
export const exitCloudGift = async () => (await cloud()).exitGift();
export const previewCloudGift = async (id: string) => (await cloud()).previewGift({ data: { id } });
export const recordCloudOpen = async (id: string) => (await cloud()).openGift({ data: { id } });
export const saveCloudProfile = async (profile: Profile) => (await cloud()).adminSaveProfile({ data: profile });
export const saveCloudSettings = async (settings: Settings) => (await cloud()).adminSaveSettings({ data: settings });
export const changeCloudReply = async (id: string, patch: { read?: boolean; remove?: boolean }) => (await cloud()).adminChangeReply({ data: { id, ...patch } });
export const sendCloudReply = async (id: string, nickname: string, message: string, replyId: string) =>
  (await cloud()).sendGiftReply({ data: { id, nickname, message, replyId } });
export const loadCloudPortrait = async (photoId: string) => (await cloud()).adminPortrait({ data: { photoId } });
export async function duplicateCloudProfile(p: Profile) {
  const now = new Date().toISOString();
  await saveCloudProfile({ ...p, id: uid(), label: `${p.label} (bản sao)`, keyword: '', status: 'draft', openedCount: 0, lastOpenedAt: null, createdAt: now, updatedAt: now });
}
async function blobBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Không đọc được ảnh.'));
    reader.readAsDataURL(blob);
  });
}
export async function uploadCloudPortrait(blob: Blob) {
  return (await cloud()).adminUploadPortrait({ data: { base64: await blobBase64(blob) } });
}
export function legacySummary() {
  return { profiles: read<Profile[]>(K.profiles, []).length, replies: getReplies().length };
}
export function exportLegacyBackup() {
  return { profiles: read<Profile[]>(K.profiles, []), replies: getReplies(), settings: getSettings() };
}
export async function importLegacyData(onProgress: (message: string) => void) {
  // Read only existing profiles: never seed sample records during migration.
  const profiles = read<Profile[]>(K.profiles, []).map(migrateProfile);
  const existingIds = new Set((await loadAdminData()).profiles.map(p => p.id));
  const { loadPortrait } = await import('./portraits');
  const converted: Profile[] = [];
  for (const [i, p] of profiles.entries()) {
    if (existingIds.has(p.id)) continue;
    onProgress(`Đang chuyển hồ sơ ${i + 1}/${profiles.length}…`);
    if (p.photoId && !p.photoId.startsWith('cloud:')) {
      const blob = await loadPortrait(p.photoId);
      if (!blob) throw new Error(`Không tìm thấy ảnh của ${p.fullName || p.label}. Mở bằng trình duyệt đã tải ảnh rồi thử lại.`);
      converted.push({ ...p, ...await uploadCloudPortrait(blob) });
    } else converted.push(p);
  }
  onProgress('Đang lưu hồ sơ và lời nhắn…');
  const result = await (await cloud()).adminImportLegacy({ data: { profiles: converted, replies: getReplies(), settings: getSettings() } });
  // Retain local records and IndexedDB as a backup; retries skip cloud records.
  return { ...result, skipped: result.skipped + profiles.filter(p => existingIds.has(p.id)).length };
}

