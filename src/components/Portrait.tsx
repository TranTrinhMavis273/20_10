import { useEffect, useState } from "react";
import { loadPortrait } from "@/lib/portraits";
import type { Profile } from "@/lib/store";
import { FloralSprig } from "@/components/Decor";

export function Portrait({ profile }: { profile: Profile }) {
  const [localUrl, setLocalUrl] = useState("");
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false); setLocalUrl("");
    let alive = true; let url = "";
    if (profile.photoId) void loadPortrait(profile.photoId).then(blob => {
      if (alive && blob) { url = URL.createObjectURL(blob); setLocalUrl(url); }
    }).catch(() => {});
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [profile.photoId, profile.imageUrl]);
  const src = profile.photoId ? localUrl : profile.imageUrl;
  return <figure className="portrait-frame">
    <div className="portrait-slot">
      {src && !broken ? <img src={src} alt={profile.imageAlt || `Chân dung ${profile.fullName}`} onError={() => setBroken(true)} className={`h-full w-full ${profile.imageFit === "contain" ? "object-contain" : "object-cover"}`} /> : <div className="flex h-full flex-col items-center justify-center bg-accent px-5 text-center"><FloralSprig className="h-36 w-28" /><span className="font-display text-xl font-extrabold">Một bông hoa<br />mang tên bạn</span></div>}
    </div>
    <figcaption className="pt-3 text-center font-hand text-2xl">{profile.fullName}</figcaption>
    <FloralSprig className="pointer-events-none absolute -bottom-3 -left-7 h-32 w-20" />
    <FloralSprig className="pointer-events-none absolute -right-7 top-1 h-28 w-20 rotate-12" />
  </figure>;
}
