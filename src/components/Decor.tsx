import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Mood = "love" | "shock" | "proud" | "sad" | "sleepy";

/** Original illustrated cat sticker (inline SVG, never breaks). */
export function CatSticker({
  mood = "love",
  caption,
  className = "",
  tilt = -4,
}: {
  mood?: Mood;
  caption?: string;
  className?: string;
  tilt?: number;
}) {
  const fur = mood === "sleepy" ? "#3a3236" : mood === "proud" ? "#f2b36b" : "#fbf4ea";
  const stroke = "#4a3338";
  const inner = mood === "sleepy" ? "#6b5a60" : "#f7a9b4";
  return (
    <figure
      className={`inline-flex flex-col items-center ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <svg viewBox="0 0 120 110" className="h-full w-full drop-shadow-md" aria-hidden>
        <rect x="4" y="4" width="112" height="102" rx="26" fill="#fff" />
        <path d="M30 42 L26 14 L50 30 Z" fill={fur} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
        <path d="M90 42 L94 14 L70 30 Z" fill={fur} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
        <path d="M32 34 L30 22 L42 30 Z" fill={inner} />
        <path d="M88 34 L90 22 L78 30 Z" fill={inner} />
        <ellipse cx="60" cy="60" rx="38" ry="32" fill={fur} stroke={stroke} strokeWidth="3" />
        {mood === "love" && (
          <>
            <path d="M40 54c0-5 7-6 8-1 1-5 8-4 8 1 0 5-8 9-8 9s-8-4-8-9Z" fill="#e8667a" />
            <path d="M64 54c0-5 7-6 8-1 1-5 8-4 8 1 0 5-8 9-8 9s-8-4-8-9Z" fill="#e8667a" />
          </>
        )}
        {mood === "shock" && (
          <>
            <circle cx="46" cy="56" r="7" fill="#fff" stroke={stroke} strokeWidth="2.5" />
            <circle cx="74" cy="56" r="7" fill="#fff" stroke={stroke} strokeWidth="2.5" />
            <circle cx="46" cy="56" r="2.5" fill={stroke} />
            <circle cx="74" cy="56" r="2.5" fill={stroke} />
          </>
        )}
        {mood === "proud" && (
          <>
            <path d="M38 56 q8 -8 16 0" stroke={stroke} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M66 56 q8 -8 16 0" stroke={stroke} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
        {mood === "sad" && (
          <>
            <circle cx="46" cy="56" r="5" fill={stroke} />
            <circle cx="74" cy="56" r="5" fill={stroke} />
            <path d="M42 64 q-2 8 2 10" stroke="#7cc3e8" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
        {mood === "sleepy" && (
          <>
            <path d="M38 58 q8 6 16 0" stroke="#fbf4ea" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M66 58 q8 6 16 0" stroke="#fbf4ea" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
        <ellipse cx="38" cy="70" rx="6" ry="3.5" fill="#f7a9b4" opacity=".8" />
        <ellipse cx="82" cy="70" rx="6" ry="3.5" fill="#f7a9b4" opacity=".8" />
        <path
          d={mood === "shock" ? "M55 74 q5 -6 10 0 q-5 6 -10 0" : mood === "sad" ? "M54 76 q6 -5 12 0" : "M52 70 q4 5 8 0 q4 5 8 0"}
          stroke={mood === "sleepy" ? "#fbf4ea" : stroke}
          strokeWidth="2.5"
          fill={mood === "shock" ? stroke : "none"}
          strokeLinecap="round"
        />
        <path d="M22 66 h-14 M22 72 h-12 M98 66 h14 M98 72 h12" stroke={mood === "sleepy" ? "#3a3236" : stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
      {caption && (
        <figcaption className="-mt-3 rounded-full border border-border bg-card px-3 py-1 text-center font-hand text-base leading-tight text-accent-foreground shadow-sm">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function Daisy({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => (
        <ellipse key={i} cx="30" cy="14" rx="6" ry="13" fill="#fffaf2" stroke="#e9d9c4" strokeWidth="1.2" transform={`rotate(${i * 36} 30 30)`} />
      ))}
      <circle cx="30" cy="30" r="8" fill="#f6c453" />
    </svg>
  );
}

export function Tulip({ className = "", color = "var(--primary)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 40 80" className={className} aria-hidden>
      <path d="M20 40 V78" stroke="#7d9c78" strokeWidth="3" />
      <path d="M20 62 q-14 -4 -16 -18 q12 2 16 14" fill="#8fae8b" />
      <path d="M8 14 q4 26 12 26 q8 0 12 -26 l-6 8 l-6 -12 l-6 12 Z" fill={color} />
    </svg>
  );
}

export function Petals({ enabled = true, count = 14 }: { enabled?: boolean; count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        left: (i * 73) % 100,
        delay: (i * 1.3) % 9,
        dur: 9 + ((i * 7) % 8),
        size: 10 + ((i * 5) % 10),
        hue: i % 3,
      })),
    [count],
  );
  if (!enabled) return null;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {items.map((p, i) => (
        <span
          key={i}
          className="animate-petal absolute -top-6 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.8,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            borderRadius: "80% 0 80% 0",
            background: ["var(--primary)", "var(--coral)", "var(--secondary)"][p.hue],
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}

export function ClickSparkles() {
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const sequence = useRef(0);
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const burst = (event: MouseEvent) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const target = event.target;
      if (!(target instanceof Element) || target.closest("input, textarea, select")) return;
      const rect = target.closest("button, a")?.getBoundingClientRect();
      const id = sequence.current++;
      const x = event.detail === 0 && rect ? rect.left + rect.width / 2 : event.clientX;
      const y = event.detail === 0 && rect ? rect.top + rect.height / 2 : event.clientY;
      setBursts(current => [...current.slice(-7), { id, x, y }]);
      const timer = setTimeout(() => {
        setBursts(current => current.filter(item => item.id !== id));
        timers.delete(timer);
      }, 800);
      timers.add(timer);
    };
    document.addEventListener("click", burst);
    return () => { document.removeEventListener("click", burst); timers.forEach(clearTimeout); };
  }, []);
  return <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
    {bursts.map(burst => <div key={burst.id} className="absolute" style={{ left: burst.x, top: burst.y }}>
      {Array.from({ length: 8 }, (_, i) => <span key={i} className="click-sparkle" style={{
        "--spark-x": `${Math.cos(i * Math.PI / 4) * (48 + i % 3 * 12)}px`,
        "--spark-y": `${Math.sin(i * Math.PI / 4) * 55 - 22}px`,
        "--spark-turn": `${i % 2 ? 60 : -60}deg`,
      } as CSSProperties}>{["🌸", "💖", "✨", "🐾"][i % 4]}</span>)}
    </div>)}
  </div>;
}

export function FloralSprig({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 100 160" className={className} aria-hidden="true">
    <path d="M50 151Q37 102 24 56M51 152Q67 103 76 44M50 150L49 62" fill="none" stroke="var(--sage)" strokeWidth="4" />
    <path d="M42 116Q10 118 12 83Q40 86 42 116M56 121Q88 113 88 83Q60 88 56 121M47 137Q22 139 21 116Q42 116 47 137" fill="var(--sage)" />
    <path d="M11 32L22 42L29 25L34 41L42 30Q42 67 26 68Q10 66 11 32" fill="var(--primary)" />
    <path d="M60 24L69 31L75 15L82 29L93 21Q93 53 77 58Q60 53 60 24" fill="var(--secondary)" />
    <path d="M32 56Q28 35 46 32Q65 30 68 50Q73 68 51 75Q32 72 32 56" fill="var(--coral)" />
    <path d="M39 50Q57 37 62 52Q64 65 44 65Q36 58 49 49Q60 49 53 58" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
  </svg>;
}

