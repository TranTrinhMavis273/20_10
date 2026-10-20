import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { themeStyle } from "@/lib/theme";
import { CatSticker, ClickSparkles, Daisy, Petals, Tulip } from "@/components/Decor";
import { Button } from "@/components/ui/button";
import { useGlobalMusic } from "@/components/GlobalMusic";
import { Portrait } from "@/components/Portrait";
import { catPhotos } from "@/lib/gift-assets";
import { SITE_NAME, MAX_REPLY, fillNickname, findCloudGift, unlockCloudGift, exitCloudGift, previewCloudGift, loadCloudSettings, recordCloudOpen, sendCloudReply, defaultSettings, type Profile, type Progress, type Settings } from "@/lib/store";
const TITLE = SITE_NAME;
const DESC = "Một chút hoa, một chút meo, một lời chúc dành riêng cho bạn nhân ngày Phụ nữ Việt Nam 20/10.";

export const Route = createFileRoute("/")({
  validateSearch: z.object({ preview: z.string().optional() }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Step = "landing" | "login" | "keyword" | "gifts" | "letter";

function Index() {
  const { preview } = Route.useSearch();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [step, setStep] = useState<Step>("landing");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const music = useGlobalMusic();
  const isPreview = !!preview;
  useEffect(() => {
    let alive = true;
    setLoading(true); setError(""); setProfile(null); setProgress(null); setStep("landing");
    void (async () => {
      try {
        const settings = await loadCloudSettings();
        if (alive) setSettings(settings);
        if (preview) {
          const p = await previewCloudGift(preview);
          if (!p) throw new Error('Không tìm thấy hồ sơ để xem trước.');
          if (alive) { setProfile(p); setProgress({ version: 2, nickname: "Bạn xem thử", step: "gifts", attempts: 0, verified: false, cat: null }); setStep("gifts"); }
        } else await exitCloudGift();
      } catch (err) { if (alive) setError(err instanceof Error ? err.message : 'Chưa tải được quà. Bạn thử lại nhé.'); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [preview]);
  const update = (patch: Partial<Progress>) => {
    if (!profile || !progress) return;
    const next = { ...progress, ...patch }; setProgress(next); setStep(next.step);
  };
  const logout = async () => {
    music.reset();
    setProfile(null); setProgress(null); setStep("landing"); setError("");
    try { if (!isPreview) await exitCloudGift(); }
    catch { setError('Chưa kết thúc được phiên. Bạn tải lại trang nhé.'); }
  };
  const unlocked = !!progress?.verified || isPreview;
  return <div style={themeStyle(settings)} className="relative min-h-screen overflow-x-hidden">
    <Petals enabled={settings.confetti} />
    <ClickSparkles />
    <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 pt-5">
      <Button variant="ghost" onClick={isPreview ? undefined : logout} className="h-auto min-w-0 justify-start whitespace-normal p-0 text-left" aria-label="Về trang đầu"><Daisy className="h-9 w-9 shrink-0" /><span><span className="block font-display text-sm font-bold sm:text-lg">{SITE_NAME}</span><span className="font-hand text-base text-muted-foreground">{settings.brandSubtitle}</span></span></Button>
      {isPreview ? <span className="text-xs font-semibold text-accent-foreground">Xem trước</span> : <Link to="/admin" className="text-xs text-muted-foreground hover:underline">Quản trị</Link>}
    </header>
    <main className="relative z-10 mx-auto max-w-3xl px-5 pb-16 pt-6">
      {error && <p role="alert" className="card-paper mb-5 p-4 text-sm">{error}<button className="ml-3 underline" onClick={() => window.location.reload()}>Tải lại</button></p>}
      {loading ? <p role="status" className="py-12 text-center">Đang chuẩn bị quà…</p> : preview && error ? null : step === "landing" ? <Landing onStart={() => setStep("login")} /> : step === "login" ? <Login onBack={logout} onSuccess={(p, nickname) => {
        music.reset(); const pr: Progress = { version: 2, nickname, step: "keyword", attempts: 0, verified: false, cat: null };
        setProfile(p); setProgress(pr); setStep("keyword");
      }} /> : profile && progress ? <>
        {step === "keyword" && <Keyword profile={profile} progress={progress} onBack={logout} onWrong={() => update({ attempts: progress.attempts + 1 })} onSuccess={(unlocked) => {
          setProfile(unlocked); music.unlock(unlocked); update({ verified: true, step: "gifts" });
        }} />}
        {unlocked && step === "gifts" && <Gifts profile={profile} opening={opening} onOpen={async cat => {
          if (opening) return;
          setOpening(true); setError("");
          try { if (!isPreview && progress.cat === null) await recordCloudOpen(profile.id); update({ cat, step: "letter" }); }
          catch (err) { setError(err instanceof Error ? err.message : 'Chưa mở được quà. Bạn thử lại nhé.'); }
          finally { setOpening(false); }
        }} />}
        {unlocked && step === "letter" && <Letter profile={profile} progress={progress} settings={settings} isPreview={isPreview} onReopen={() => update({ step: "gifts" })} onExit={logout} />}
      </> : <p>Không tìm thấy hồ sơ để xem trước.</p>}
    </main>
  </div>;
}
function Landing({ onStart }: { onStart: () => void }) {
  return <section className="animate-pop flex flex-col items-center text-center">
    <div className="relative flex items-end gap-3"><Tulip className="h-24 w-10" /><img src={catPhotos[0]?.url} alt={catPhotos[0]?.alt} className="h-56 w-48 rotate-[-3deg] rounded-lg border-8 border-paper object-contain shadow sm:h-64 sm:w-56" /><Daisy className="h-16 w-16" /></div>
    <h1 className="landing-title mt-6 w-full font-display font-black"><span>Gửi những người phụ nữ</span><span>của TranTrinh</span></h1>
    <Button onClick={onStart} className="btn btn-primary mt-6 px-8 text-lg">Mở quà của mình</Button>
  </section>;
}
function Login({ onBack, onSuccess }: { onBack: () => void; onSuccess: (p: Profile, nickname: string) => void }) {
  const [fullName, setFullName] = useState(""); const [nickname, setNickname] = useState(""); const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (busy) return;
    if (!fullName.trim() || !nickname.trim()) return setError("Bạn nhớ nhập họ và tên cùng nickname nhé.");
    setBusy(true); setError("");
    try { const p = await findCloudGift(fullName); if (!p) return setError("Meo chưa tìm thấy quà cho tên này. Bạn kiểm tra lại họ tên và dấu tiếng Việt nhé."); onSuccess(p, nickname.trim()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Chưa kết nối được. Bạn thử lại nhé.'); }
    finally { setBusy(false); }
  };
  return <section className="animate-pop mx-auto max-w-md"><form onSubmit={submit} className="tape card-paper p-6 sm:p-8">
    <h2 className="font-display text-2xl font-bold">Ai đó đang tới?</h2>
    <label className="mt-6 block text-sm font-semibold" htmlFor="fullName">Họ và tên</label><input id="fullName" className="field mt-2" required value={fullName} maxLength={160} onChange={e => setFullName(e.target.value)} autoComplete="name" />
    <label className="mt-4 block text-sm font-semibold" htmlFor="nick">Nickname</label><input id="nick" className="field mt-2" required maxLength={40} value={nickname} onChange={e => setNickname(e.target.value)} autoComplete="nickname" />
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    <Button disabled={busy} type="submit" className="btn btn-primary mt-6 w-full">{busy ? 'Đang tìm quà…' : 'Tiếp tục'}</Button><Button disabled={busy} variant="outline" type="button" onClick={onBack} className="btn btn-ghost mt-3 w-full">Quay lại</Button>
  </form></section>;
}
function Keyword({ profile, progress, onSuccess, onWrong, onBack }: { profile: Profile; progress: Progress; onSuccess: (p: Profile) => void; onWrong: () => void; onBack: () => void }) {
  const [answer, setAnswer] = useState(""); const [error, setError] = useState(""); const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (busy) return; setBusy(true); setError("");
    try { const p = await unlockCloudGift(profile.id, answer); if (!p) { onWrong(); setError("Từ khoá chưa đúng rồi. Bạn thử lại nhé!"); return; } onSuccess(p); }
    catch (err) { setError(err instanceof Error ? err.message : 'Chưa xác minh được. Bạn thử lại nhé.'); }
    finally { setBusy(false); }
  };
  return <section className="animate-pop mx-auto max-w-lg"><p className="font-hand text-2xl text-primary">{fillNickname(profile.greeting, progress.nickname)}</p><form onSubmit={submit} className="tape card-paper mt-6 p-6 sm:p-8">
    <h2 className="font-display text-2xl font-bold">{fillNickname(profile.keywordQuestion, progress.nickname)}</h2>
    <label htmlFor="kw" className="mt-5 block text-sm font-semibold">Từ khoá bí mật</label><input id="kw" className="field mt-2" required maxLength={256} value={answer} onChange={e => setAnswer(e.target.value)} autoComplete="off" autoCapitalize="none" />
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {hint && <p role="status" className="mt-3 text-sm">{profile.hint}</p>}
    <Button disabled={busy} type="submit" className="btn btn-primary mt-5 w-full">{busy ? 'Đang mở…' : 'Mở quà'}</Button>
    <div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" type="button" onClick={() => setHint(true)}>Gợi ý</Button><Button disabled={busy} variant="outline" type="button" onClick={onBack}>Đổi người nhận</Button></div>
    {progress.attempts > 0 && <p className="mt-3 text-xs text-muted-foreground">Chưa đúng {progress.attempts} lần</p>}
  </form></section>;
}
function Gifts({ profile, onOpen, opening }: { profile: Profile; onOpen: (cat: number) => void; opening: boolean }) {
  return <section className="animate-pop text-center"><h2 className="font-display text-3xl font-bold">Chọn một meo mang hoa</h2><div className="mt-8 grid gap-4 sm:grid-cols-3">
    {catPhotos.map((photo, i) => profile.memes[i]?.enabled && <Button disabled={opening} key={photo.url} variant="outline" onClick={() => onOpen(i)} aria-label={profile.memes[i]?.caption} className="h-auto flex-col whitespace-normal rounded-lg bg-card p-3 shadow-sm transition-transform hover:-translate-y-1">
      <img src={photo.url} alt={photo.alt} className="aspect-square w-full object-contain" /><span className="py-2 font-hand text-2xl">{profile.memes[i]?.caption}</span>
    </Button>)}
  </div></section>;
}

function Letter({ profile, progress, settings, isPreview, onReopen, onExit }: { profile: Profile; progress: Progress; settings: Settings; isPreview: boolean; onReopen: () => void; onExit: () => void }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const n = progress.nickname;
  return (
    <section className="animate-pop">
      <article className="tape card-paper relative overflow-hidden p-6 sm:p-10">
        <Daisy className="absolute -right-4 -top-4 h-20 w-20 opacity-80" />
        <Tulip className="absolute -bottom-2 left-2 h-20 w-10 opacity-70" />
        <Portrait profile={profile} />
        <p className="pr-14 font-hand text-2xl text-muted-foreground">{fillNickname(profile.greeting, n)}</p>
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">{fillNickname(profile.wishTitle, n)}</h2>
        <p className="mt-6 whitespace-pre-line text-lg leading-relaxed">{fillNickname(profile.wish, n)}</p>
        <p className="mt-8 text-right font-hand text-2xl">— {profile.signature || settings.signature}</p>
        <div className="mt-6 flex justify-center">
          <figure className="text-center"><img src={catPhotos[progress.cat ?? 0]?.url} alt={catPhotos[progress.cat ?? 0]?.alt} className="h-40 w-40 rounded-lg object-contain" /><figcaption className="font-hand text-xl text-primary">{profile.memes[progress.cat ?? 0]?.caption}</figcaption></figure>
        </div>
      </article>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {profile.repliesEnabled && (
          <Button className="btn btn-primary sm:col-span-2" onClick={() => setReplyOpen((v) => !v)} aria-expanded={replyOpen}>
            Gửi một lời chúc lại cho mình 💌
          </Button>
        )}
        <Button className="btn btn-ghost" onClick={onReopen}>Chọn lại ảnh mèo</Button>
        {!isPreview && <Button className="btn btn-ghost" onClick={onExit}>Thoát</Button>}
      </div>
      {replyOpen && <ReplyForm profile={profile} nickname={n} isPreview={isPreview} />}
    </section>
  );
}

function ReplyForm({ profile, nickname, isPreview }: { profile: Profile; nickname: string; isPreview: boolean }) {
  const [nick, setNick] = useState(nickname);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const replyId = useRef(crypto.randomUUID());
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "sending" || state === "done") return;
    if (isPreview) return setError("Chế độ xem trước không lưu lời nhắn.");
    if (!nick.trim()) return setError("Cần biệt danh.");
    if (!message.trim()) return setError("Bạn viết vài dòng nhé.");
    if (message.length > MAX_REPLY) return setError(`Tối đa ${MAX_REPLY} ký tự.`);
    setError("");
    setState("sending");
    try {
      await sendCloudReply(profile.id, nick.trim(), message.trim(), replyId.current);
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Chưa gửi được lời nhắn. Nội dung vẫn ở đây, bạn thử lại nhé.");
    }
  };

  if (state === "done")
    return (
      <div role="status" className="card-paper animate-pop mt-6 flex items-center gap-4 p-6">
        <CatSticker mood="proud" className="h-20 w-20 shrink-0" />
        <div>
          <p className="font-display text-xl font-bold">Đã gửi lời nhắn 💌</p>
        </div>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="card-paper animate-pop mt-6 p-6">
      <h3 className="font-display text-xl font-bold">Viết lời chúc gửi lại</h3>
      <label className="mt-4 block text-sm font-semibold" htmlFor="rnick">Biệt danh</label>
      <input id="rnick" className="field mt-1.5" value={nick} maxLength={40} onChange={(e) => setNick(e.target.value)} />
      <label className="mt-4 block text-sm font-semibold" htmlFor="rmsg">Lời nhắn</label>
      <textarea id="rmsg" className="field mt-1.5 min-h-36" value={message} maxLength={MAX_REPLY} onChange={(e) => setMessage(e.target.value)} placeholder="Cảm ơn bạn vì…" />
      <p className="mt-1 text-right text-xs text-muted-foreground">{message.length}/{MAX_REPLY}</p>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-destructive">{error}</p>}
      <Button type="submit" className="btn btn-primary mt-4 w-full" disabled={state === "sending"}>
        {state === "sending" ? "Đang gửi…" : "Gửi lời nhắn"}
      </Button>
    </form>
  );
}

