import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { CatSticker, Daisy } from "@/components/Decor";
import {
  duplicateProfile,
  emptyProfile,
  getProfiles,
  getReplies,
  getSettings,
  resetDemo,
  saveReplies,
  saveSettings,
  upsertProfile,
  validateProfile,
  defaultSettings,
  SITE_NAME,
  type Profile,
  type Reply,
  type Settings,
  type ValidationErrors,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PersonalMusic } from "@/components/PersonalMusic";
import { catPhotos } from "@/lib/gift-assets";
import { themeStyle } from "@/lib/theme";
import { adminLogin, adminLogout, adminStatus, requireAdmin } from "@/lib/admin-gate.functions";
import { savePortrait } from "@/lib/portraits";
import { Portrait } from "@/components/Portrait";

export const Route = createFileRoute("/admin")({
  loader: async () => { const state = await adminStatus(); if (state.authenticated) await requireAdmin(); return state; },
  head: () => ({
    meta: [
      { title: `Quản trị — ${SITE_NAME}` },
      { name: "description", content: "Chế độ quản trị demo: quản lý hồ sơ quà 20/10, hộp thư và cài đặt, lưu trên trình duyệt." },
      { property: "og:title", content: `Quản trị — ${SITE_NAME}` },
      { property: "og:description", content: "Sandbox quản trị demo, dữ liệu lưu trên trình duyệt này." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const { authenticated } = Route.useLoaderData();
  const router = useRouter(); const login = useServerFn(adminLogin);
  const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  if (authenticated) return <Admin />;
  return <main className="mx-auto max-w-md px-5 py-12"><Link to="/" className="font-display text-xl">{SITE_NAME}</Link><h1 className="mt-10 font-display text-3xl">Quản trị</h1>
    <form className="mt-6" onSubmit={async e => { e.preventDefault(); if (busy) return; setBusy(true); setError(""); try { const result = await login({ data: { password } }); setPassword(""); if (result.ok) await router.invalidate(); else setError("Mật khẩu chưa đúng."); } catch { setError("Chưa đăng nhập được. Bạn thử lại nhé."); } finally { setBusy(false); } }}>
      <label htmlFor="admin-password" className="text-sm font-semibold">Mật khẩu quản trị</label><input id="admin-password" className="field mt-2" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
      {error && <p role="alert" className="mt-3 text-destructive">{error}</p>}
      <Button disabled={busy} type="submit" className="btn btn-primary mt-5 w-full">{busy ? "Đang kiểm tra…" : "Đăng nhập quản trị"}</Button>
    </form><p className="mt-5 text-sm text-muted-foreground">Bản demo: dữ liệu lưu trên trình duyệt này. Mật khẩu bảo vệ truy cập trang quản trị, không mã hoá dữ liệu cục bộ.</p>
  </main>;
}

type Tab = "profiles" | "inbox" | "settings";

function Admin() {
  const router = useRouter(); const logout = useServerFn(adminLogout);
  const [tab, setTab] = useState<Tab>("profiles");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const reload = () => {
    setProfiles(getProfiles());
    setReplies(getReplies());
    setSettings(getSettings());
  };
  useEffect(reload, []);

  const unread = replies.filter((r) => !r.read).length;

  return (
    <div style={themeStyle(settings)} className="min-h-screen">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <Link to="/" className="flex items-center gap-2">
          <Daisy className="h-9 w-9" />
          <span className="font-display text-lg font-bold">{settings.brandTitle}</span>
        </Link>
        <Button variant="outline" onClick={async () => { await logout(); await router.invalidate(); }}>Đăng xuất</Button>
      </header>
      <div className="mx-auto mt-4 max-w-5xl px-5">
        <div role="note" className="rounded-lg border border-dashed border-border bg-secondary/60 p-4 text-sm text-secondary-foreground">
          <strong>Bản demo: dữ liệu lưu trên trình duyệt này.</strong> Trang quản trị kiểm tra mật khẩu trên máy chủ. Dữ liệu cục bộ không được mã hoá hay đồng bộ sang thiết bị khác; lời nhắn chưa thực sự gửi đi.
        </div>
      </div>

      {(
        <main className="mx-auto max-w-5xl px-5 pb-16 pt-6">
          <nav className="flex gap-2 overflow-x-auto" role="tablist">
            {([
              ["profiles", `Hồ sơ (${profiles.length})`],
              ["inbox", `Hộp thư${unread ? ` · ${unread} mới` : ""}`],
              ["settings", "Cài đặt"],
            ] as const).map(([k, label]) => (
              <Button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`btn whitespace-nowrap ${tab === k ? "btn-primary" : "btn-ghost"}`}>
                {label}
              </Button>
            ))}
          </nav>
          <div className="mt-6">
            {tab === "profiles" && <Profiles profiles={profiles} reload={reload} />}
            {tab === "inbox" && <Inbox replies={replies} reload={reload} />}
            {tab === "settings" && <SettingsPanel settings={settings} reload={reload} />}
          </div>
          <Button
            className="mt-12 text-xs text-muted-foreground underline"
            onClick={() => { if (confirm("Xoá toàn bộ dữ liệu demo trên trình duyệt này và khôi phục 3 hồ sơ mẫu?")) { resetDemo(); reload(); } }}
          >
            Khôi phục dữ liệu demo ban đầu
          </Button>
        </main>
      )}
    </div>
  );
}

const statusLabel = { draft: "Nháp", active: "Đang bật", inactive: "Đã tắt" };

function Profiles({ profiles, reload }: { profiles: Profile[]; reload: () => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "active" | "opened" | "inactive">("all");
  const [editing, setEditing] = useState<Profile | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLocaleLowerCase("vi");
    return profiles.filter((p) => {
      if (s && !`${p.label} ${p.fullName} ${p.aliases.join(" ")} ${p.keyword}`.toLocaleLowerCase("vi").includes(s)) return false;
      if (filter === "opened") return p.openedCount > 0;
      if (filter !== "all") return p.status === filter;
      return true;
    });
  }, [profiles, q, filter]);

  if (editing)
    return <Editor initial={editing} onClose={() => { setEditing(null); reload(); }} />;

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input className="field" placeholder="Tìm theo tên, nhãn hoặc từ khoá…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm hồ sơ" />
        <select className="field sm:w-48" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Lọc">
          <option value="all">Tất cả</option>
          <option value="draft">Nháp</option>
          <option value="active">Đang bật</option>
          <option value="opened">Đã mở</option>
          <option value="inactive">Đã tắt</option>
        </select>
        <Button className="btn btn-primary whitespace-nowrap" onClick={() => setEditing(emptyProfile())}>+ Thêm hồ sơ</Button>
      </div>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {list.map((p) => (
          <li key={p.id} className="card-paper p-5" data-testid="profile-card">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-lg font-bold">{p.label || "(chưa đặt nhãn)"}</h3>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.status === "active" ? "bg-secondary text-secondary-foreground" : p.status === "draft" ? "bg-butter" : "bg-muted text-muted-foreground"}`}>
                {statusLabel[p.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.fullName || "Chưa có họ tên"} · Từ khoá: <code className="font-semibold text-foreground">{p.keyword || "—"}</code></p>
            <p className="mt-1 text-xs text-muted-foreground">Đã mở {p.openedCount} lần{p.lastOpenedAt ? ` · gần nhất ${new Date(p.lastOpenedAt).toLocaleString("vi-VN")}` : ""}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="btn btn-ghost min-h-11 px-4 text-sm" onClick={() => setEditing(p)}>Sửa</Button>
              <Button className="btn btn-ghost min-h-11 px-4 text-sm" onClick={() => { duplicateProfile(p); reload(); }}>Nhân bản</Button>
              <a className="btn btn-ghost min-h-11 px-4 text-sm" href={`/?preview=${encodeURIComponent(p.id)}`} target="_blank" rel="noreferrer">Xem trước</a>
              {p.status !== "inactive" ? (
                <Button className="btn btn-ghost min-h-11 px-4 text-sm" onClick={() => { if (confirm(`Tắt hồ sơ "${p.label}"? Người nhận sẽ không mở được nữa.`)) { upsertProfile({ ...p, status: "inactive" }); reload(); } }}>Tắt</Button>
              ) : (
                <Button className="btn btn-ghost min-h-11 px-4 text-sm" onClick={() => { upsertProfile({ ...p, status: "draft" }); reload(); }}>Chuyển về nháp</Button>
              )}
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="text-muted-foreground">Không có hồ sơ phù hợp.</li>}
      </ul>
    </section>
  );
}

function Editor({ initial, onClose }: { initial: Profile; onClose: () => void }) {
  const [p, setP] = useState<Profile>(initial);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saved, setSaved] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => { setP((x) => ({ ...x, [k]: v })); setSaved(""); };

  const save = (mode: "draft" | "active") => {
    const all = getProfiles();
    const e = validateProfile(p, mode, all);
    setErrors(e);
    if (Object.keys(e).length) { setSaved(""); return; }
    const next = { ...p, keyword: p.keyword.trim(), fullName: p.fullName.trim().replace(/\s+/g, " "), aliases: p.aliases.map(n => n.trim()).filter(Boolean), status: mode === "active" ? "active" : "draft" } as Profile;
    upsertProfile(next);
    setP(next);
    setSaved(mode === "active" ? "Đã lưu và bật hồ sơ." : "Đã lưu nháp.");
  };

  const F = ({ k, label, area, hint, type = "text" }: { k: keyof Profile; label: string; area?: boolean; hint?: string; type?: string }) => (
    <div>
      <label className="block text-sm font-semibold" htmlFor={`f-${k}`}>{label}</label>
      {area ? (
        <textarea id={`f-${k}`} className="field mt-1.5 min-h-28" value={String(p[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />
      ) : (
        <input id={`f-${k}`} type={type} className="field mt-1.5" value={String(p[k] ?? "")} onChange={(e) => set(k, (type === "number" ? Number(e.target.value) : e.target.value) as never)} />
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {errors[k] && <p role="alert" className="mt-1 text-sm font-medium text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <section className="card-paper p-5 sm:p-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-bold">{initial.label ? "Sửa hồ sơ" : "Hồ sơ mới"}</h2>
        <Button className="btn btn-ghost min-h-11 text-sm" onClick={onClose}>← Danh sách</Button>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {F({ k: "label", label: "Nhãn nội bộ", hint: "Chỉ hiện trong quản trị, người nhận không thấy." })}
        {F({ k: "keyword", label: "Từ khoá bí mật", hint: "Chỉ xác minh cho tên đã chọn; các hồ sơ khác nhau có thể dùng cùng từ khoá." })}
        <div className="sm:col-span-2">{F({ k: "greeting", label: "Lời chào", hint: "Dùng {nickname} để chèn biệt danh người nhận." })}</div>
        {F({ k: "fullName", label: "Họ và tên", hint: "Bắt buộc khi bật hồ sơ; giữ nguyên dấu tiếng Việt." })}
        <div><label className="block text-sm font-semibold" htmlFor="f-aliases">Tên gọi khác</label><textarea id="f-aliases" className="field mt-1.5" value={p.aliases.join("\n")} onChange={e => set("aliases", e.target.value.split("\n"))} /><p className="mt-1 text-xs text-muted-foreground">Mỗi dòng một tên. Không được trùng họ tên/tên khác của hồ sơ đang bật.</p>{errors.aliases && <p role="alert" className="text-sm text-destructive">{errors.aliases}</p>}</div>
        <div className="sm:col-span-2">{F({ k: "keywordQuestion", label: "Câu hỏi từ khoá" })}</div>
        {F({ k: "hint", label: "Gợi ý" })}
        {F({ k: "correctReaction", label: "Phản hồi khi đúng" })}
        <div className="sm:col-span-2">{F({ k: "wishTitle", label: "Tiêu đề lời chúc" })}</div>
        <div className="sm:col-span-2">{F({ k: "wish", label: "Lời chúc", area: true })}</div>
        {F({ k: "signature", label: "Chữ ký" })}
        {F({ k: "imageUrl", label: "Ảnh (tuỳ chọn, URL https)" })}
        <fieldset className="sm:col-span-2"><legend className="font-display text-xl">Ảnh chân dung người nhận</legend>
          <Portrait profile={p} />
          <label htmlFor="portrait-upload" className="block text-sm font-semibold">Tải / thay ảnh (JPG, PNG, WebP · tối đa 8 MB)</label>
          <input id="portrait-upload" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} className="field mt-2" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); setPhotoError(""); try { const id = await savePortrait(file); set("photoId", id); } catch (err) { setPhotoError(err instanceof Error ? err.message : "Không lưu được ảnh."); } finally { setUploading(false); e.target.value = ""; } }} />
          <p className="mt-2 text-xs text-muted-foreground">Ảnh được thu nhỏ và lưu riêng trên trình duyệt này. Bấm lưu hồ sơ để giữ lựa chọn; ảnh tải lên được ưu tiên hơn URL.</p>
          {uploading && <p role="status">Đang xử lý ảnh…</p>}{photoError && <p role="alert" className="text-destructive">{photoError}</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">{F({ k: "imageAlt", label: "Mô tả ảnh" })}<div><label htmlFor="portrait-fit" className="text-sm font-semibold">Cách hiển thị ảnh</label><select id="portrait-fit" className="field mt-1.5" value={p.imageFit} onChange={e => set("imageFit", e.target.value === "contain" ? "contain" : "cover")}><option value="cover">Lấp đầy khung chân dung</option><option value="contain">Hiện toàn bộ ảnh</option></select></div></div>
          <Button variant="outline" className="mt-4" onClick={() => { setP(x => ({ ...x, photoId: "", imageUrl: "" })); setSaved(""); }}>Gỡ ảnh</Button>
          {p.photoId && <Button variant="ghost" className="mt-4" onClick={() => set("photoId", "")}>Dùng URL thay ảnh đã tải</Button>}
        </fieldset>
        <label className="flex min-h-12 items-center gap-3 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" className="h-5 w-5 accent-primary" checked={p.repliesEnabled} onChange={(e) => set("repliesEnabled", e.target.checked)} />
          Cho phép người nhận gửi lời nhắn lại
        </label>
      </div>
      <fieldset className="mt-8 border-t border-border pt-6">
        <legend className="font-display text-xl font-bold">Nhạc riêng</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {F({ k: "musicTitle", label: "Tên bài nhạc" })}{F({ k: "musicArtist", label: "Nghệ sĩ" })}
          <div className="sm:col-span-2">{F({ k: "musicUrl", label: "URL nhạc trực tiếp", hint: "Cần HTTPS .mp3, .ogg hoặc .wav; không dùng trang YouTube/Spotify. Nhạc demo có sẵn là giai điệu nguyên bản, chưa phải bài hát của bạn." })}</div>
          <label className="flex items-center gap-3"><input type="checkbox" checked={p.musicEnabled} onChange={e => set("musicEnabled", e.target.checked)} />Bật nhạc riêng</label>
          <label className="flex items-center gap-3"><input type="checkbox" checked={p.musicLoop} onChange={e => set("musicLoop", e.target.checked)} />Lặp lại</label>
          <label className="flex flex-wrap items-center gap-3">Âm lượng mặc định <input aria-label="Âm lượng mặc định" type="range" min="0" max="1" step="0.05" value={p.musicVolume} onChange={e => set("musicVolume", Number(e.target.value))} /><span>{Math.round(p.musicVolume * 100)}%</span></label>
        </div>
        <p className="mt-4 text-sm font-semibold">Nghe thử</p>
        <PersonalMusic key={`${p.id}-${p.musicUrl}-${p.musicEnabled}-${p.musicVolume}-${p.musicLoop}`} profile={p} visible />
      </fieldset>
      <fieldset className="mt-8 border-t border-border pt-6"><legend className="font-display text-xl font-bold">Ảnh mèo và chú thích</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">{catPhotos.map((photo, i) => <div key={photo.url}>
          <img src={photo.url} alt={photo.alt} className="aspect-square w-full rounded-lg bg-paper object-contain" />
          <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={p.memes[i]?.enabled ?? true} onChange={e => set("memes", p.memes.map((m, j) => j === i ? { ...m, enabled: e.target.checked } : m))} />Dùng ảnh {i + 1}</label>
          <input aria-label={`Chú thích ảnh ${i + 1}`} className="field mt-2" value={p.memes[i]?.caption ?? ""} onChange={e => set("memes", p.memes.map((m, j) => j === i ? { ...m, caption: e.target.value } : m))} />
        </div>)}</div>{errors.memes && <p role="alert" className="text-destructive">{errors.memes}</p>}
      </fieldset>
      {saved && <p role="status" className="mt-5 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground">{saved} (lưu trên trình duyệt này)</p>}
      {Object.keys(errors).length > 0 && <p role="alert" className="mt-5 text-sm font-medium text-destructive">Vui lòng sửa các lỗi ở trên.</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button className="btn btn-ghost" onClick={() => save("draft")}>Lưu nháp</Button>
        <Button disabled={uploading} className="btn btn-primary" onClick={() => save("active")}>Lưu và bật</Button>
        {getProfiles().some((x) => x.id === p.id) && (
          <a className="btn btn-sage" href={`/?preview=${encodeURIComponent(p.id)}`} target="_blank" rel="noreferrer">Xem trước</a>
        )}
      </div>
    </section>
  );
}

function Inbox({ replies, reload }: { replies: Reply[]; reload: () => void }) {
  const update = (list: Reply[]) => { saveReplies(list); reload(); };
  if (!replies.length)
    return (
      <div className="card-paper flex flex-col items-center p-10 text-center">
        <CatSticker mood="sleepy" caption="Chưa có thư nào…" className="h-28 w-28" />
        <p className="mt-4 text-sm text-muted-foreground">Lời nhắn người nhận gửi trên trình duyệt này sẽ hiện ở đây.</p>
      </div>
    );
  return (
    <ul className="grid gap-4">
      {replies.map((r) => (
        <li key={r.id} className={`card-paper p-5 ${r.read ? "opacity-80" : "border-primary"}`} data-testid="reply">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{r.nickname} <span className="font-normal text-muted-foreground">· {r.profileLabel}</span></p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.read ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground"}`}>{r.read ? "Đã đọc" : "Chưa đọc"}</span>
          </div>
          <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("vi-VN")}</p>
          <p className="mt-3 whitespace-pre-line">{r.message}</p>
          <div className="mt-4 flex gap-2">
            <Button className="btn btn-ghost min-h-11 text-sm" onClick={() => update(replies.map((x) => (x.id === r.id ? { ...x, read: !x.read } : x)))}>
              {r.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
            </Button>
            <Button className="btn btn-ghost min-h-11 text-sm text-destructive" onClick={() => { if (confirm("Xoá lời nhắn này? Không thể hoàn tác.")) update(replies.filter((x) => x.id !== r.id)); }}>Xoá</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SettingsPanel({ settings, reload }: { settings: Settings; reload: () => void }) {
  const [s, setS] = useState(settings);
  const [ok, setOk] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => { setS({ ...s, [k]: v }); setOk(false); };
  return (
    <section className="card-paper grid gap-5 p-5 sm:grid-cols-2 sm:p-8">
      <div><label className="text-sm font-semibold" htmlFor="s-t">Tên website</label><input id="s-t" className="field mt-1.5" value={SITE_NAME} readOnly /></div>
      <div><label className="text-sm font-semibold" htmlFor="s-s">Phụ đề</label><input id="s-s" className="field mt-1.5" value={s.brandSubtitle} onChange={(e) => set("brandSubtitle", e.target.value)} /></div>
      <div><label className="text-sm font-semibold" htmlFor="s-p">Màu chính</label><input id="s-p" type="color" className="field mt-1.5 p-1" value={s.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} /></div>
      <div><label className="text-sm font-semibold" htmlFor="s-a">Màu phụ</label><input id="s-a" type="color" className="field mt-1.5 p-1" value={s.accentColor} onChange={(e) => set("accentColor", e.target.value)} /></div>
      <div className="sm:col-span-2"><label className="text-sm font-semibold" htmlFor="s-g">Chữ ký mặc định</label><input id="s-g" className="field mt-1.5" value={s.signature} onChange={(e) => set("signature", e.target.value)} /></div>
      <label className="flex min-h-12 items-center gap-3 text-sm font-semibold sm:col-span-2">
        <input type="checkbox" className="h-5 w-5 accent-primary" checked={s.confetti} onChange={(e) => set("confetti", e.target.checked)} /> Hiệu ứng cánh hoa rơi
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button className="btn btn-primary" onClick={() => { saveSettings(s); setOk(true); reload(); }}>Lưu cài đặt</Button>
        <Button className="btn btn-ghost" onClick={() => setS(defaultSettings)}>Về mặc định</Button>
        {ok && <span role="status" className="text-sm font-medium text-secondary-foreground">Đã lưu trên trình duyệt này.</span>}
      </div>
    </section>
  );
}

