import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { globalTrack } from "@/lib/gift-assets";
import type { Profile } from "@/lib/store";

const MusicContext = createContext({ unlock: (_p: Profile) => {}, reset: () => {} });
export const useGlobalMusic = () => useContext(MusicContext);
export function GlobalMusic({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(globalTrack.volume);
  const [title, setTitle] = useState(globalTrack.title);
  const [failed, setFailed] = useState(false);
  const userPaused = useRef(false);
  const attempt = () => { const a = audio.current; if (a && a.paused && !userPaused.current) void a.play().catch(() => {}); };
  const reset = () => {
    const a = audio.current; if (!a) return;
    if (a.getAttribute("src") !== globalTrack.url) { a.src = globalTrack.url; a.loop = globalTrack.loop; a.volume = globalTrack.volume; setVolume(globalTrack.volume); setTitle(globalTrack.title); setFailed(false); }
    attempt();
  };
  const unlock = (p: Profile) => {
    const a = audio.current;
    if (a && p.musicEnabled && p.musicUrl) { a.pause(); a.src = p.musicUrl; a.loop = p.musicLoop; a.volume = p.musicVolume; setTitle(p.musicTitle || "Nhạc riêng"); setVolume(p.musicVolume); setFailed(false); }
    attempt();
  };
  useEffect(() => {
    const a = audio.current; if (a) a.volume = globalTrack.volume;
    attempt();
    const retry = () => attempt();
    const pauseForPreview = () => { audio.current?.pause(); userPaused.current = true; };
    document.addEventListener("pointerdown", retry, { capture: true });
    document.addEventListener("keydown", retry, { capture: true });
    document.addEventListener("preview-music", pauseForPreview);
    return () => { document.removeEventListener("pointerdown", retry, true); document.removeEventListener("keydown", retry, true); document.removeEventListener("preview-music", pauseForPreview); a?.pause(); };
  }, []);
  return <MusicContext.Provider value={{ unlock, reset }}>
    {children}
    <audio data-testid="global-audio" ref={audio} src={globalTrack.url} preload="auto" loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} />
    <aside aria-label="Nhạc nền" className="soundtrack-bar">
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{title}</p>{failed && <p className="text-xs">Không tải được nhạc</p>}</div>
      <Button variant="ghost" size="icon" title={playing ? "Tạm dừng nhạc nền" : "Phát nhạc nền"} aria-label={playing ? "Tạm dừng nhạc nền" : "Phát nhạc nền"} onClick={() => { const a = audio.current; if (!a) return; if (playing) { userPaused.current = true; a.pause(); } else { userPaused.current = false; attempt(); } }}>{playing ? <Pause /> : <Play />}</Button>
      <Button variant="ghost" size="icon" title={muted ? "Bỏ tắt tiếng" : "Tắt tiếng"} aria-label={muted ? "Bỏ tắt tiếng" : "Tắt tiếng"} onClick={() => { if (audio.current) audio.current.muted = !muted; setMuted(!muted); }}>{muted ? <VolumeX /> : <Volume2 />}</Button>
      <input aria-label="Âm lượng nhạc nền" type="range" min="0" max="1" step="0.01" value={volume} className="w-16 accent-primary sm:w-24" onChange={e => { const v = Number(e.target.value); setVolume(v); if (audio.current) audio.current.volume = v; }} />
    </aside>
  </MusicContext.Provider>;
}
