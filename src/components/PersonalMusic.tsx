import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/store";

export type MusicHandle = { start: () => void; stop: () => void };
export const PersonalMusic = forwardRef<MusicHandle, { profile: Profile; visible: boolean }>(function PersonalMusic({ profile, visible }, ref) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(profile.musicVolume);
  const [status, setStatus] = useState("");
  const start = () => {
    const a = audio.current;
    if (!a || !profile.musicEnabled || !profile.musicUrl) return;
    if (!a.getAttribute("src")) a.src = profile.musicUrl;
    a.volume = volume;
    document.dispatchEvent(new Event("preview-music"));
    setStatus("");
    const promise = a.play();
    promise?.catch((e: DOMException) => setStatus(e.name === "NotAllowedError" ? "Trình duyệt chặn phát nhạc. Bạn bấm Bật nhạc nhé." : "Không phát được nhạc. Bạn vẫn có thể đọc lời chúc."));
  };
  const stop = () => { const a = audio.current; if (a) { a.pause(); a.currentTime = 0; } setPlaying(false); };
  useImperativeHandle(ref, () => ({ start, stop }));
  useEffect(() => { const a = audio.current; return () => { a?.pause(); }; }, [profile.id, profile.musicUrl]);
  if (!profile.musicEnabled || !profile.musicUrl) return null;
  return <div className={visible ? "mt-6 border-y border-border py-4" : "hidden"}>
    <audio ref={audio} src={visible ? profile.musicUrl : undefined} preload="none" loop={profile.musicLoop} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setStatus("Không tải được nhạc. Bạn vẫn có thể đọc lời chúc.")} />
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1"><p className="break-words font-semibold">{profile.musicTitle || "Nhạc riêng"}</p><p className="text-xs text-muted-foreground">{profile.musicArtist}</p></div>
      <Button variant="outline" title={playing ? "Tạm dừng" : "Bật nhạc"} aria-label={playing ? "Tạm dừng" : "Bật nhạc"} onClick={() => playing ? audio.current?.pause() : start()}>{playing ? <Pause /> : <Play />}{!playing && "Bật nhạc"}</Button>
      <Button variant="ghost" size="icon" title={muted ? "Bỏ tắt tiếng" : "Tắt tiếng"} aria-label={muted ? "Bỏ tắt tiếng" : "Tắt tiếng"} onClick={() => { const next = !muted; setMuted(next); if (audio.current) audio.current.muted = next; }}>{muted ? <VolumeX /> : <Volume2 />}</Button>
      <input aria-label="Âm lượng nhạc" className="w-24 accent-primary" type="range" min="0" max="1" step="0.05" value={volume} onChange={e => { const v = Number(e.target.value); setVolume(v); if (audio.current) audio.current.volume = v; }} />
    </div>
    {status && <p role="status" className="mt-2 text-sm text-muted-foreground">{status}</p>}
  </div>;
});
