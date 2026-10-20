import flowers from "@/assets/meo-tang-hoa.jpg.asset.json";
import gifts from "@/assets/meo-mang-qua.jpg.asset.json";
import toss from "@/assets/meo-tung-hoa.jpg.asset.json";
import music1 from "@/assets/nhac-demo-1.wav.asset.json";
import music2 from "@/assets/nhac-demo-2.wav.asset.json";
import music3 from "@/assets/nhac-demo-3.wav.asset.json";
import soundtrack from "@/assets/love-like-you.mp3.asset.json";

export const globalTrack = { url: soundtrack.url, title: "Love Like You", volume: 0.2, loop: true };

export const catPhotos = [
  { url: flowers.url, alt: "Mèo trắng tặng bó hoa hồng đỏ" },
  { url: gifts.url, alt: "Mèo đen trắng mang hoa hồng đỏ và quà" },
  { url: toss.url, alt: "Mèo vàng tung bó hoa vàng" },
];
export const defaultMemes = ["Meo tặng hoa", "Meo mang quà", "Meo tung hoa"].map(caption => ({ enabled: true, caption }));
export const demoMusicUrls = [music1.url, music2.url, music3.url];
