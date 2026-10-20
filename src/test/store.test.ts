import { describe, expect, it } from "vitest";
import { answerTiles, normalizeKeyword, normalizeName, validateProfile, emptyProfile, shuffle, getProfiles, getProgress, findByName, verifyKeyword, isAudioUrl, getSettings, migrateProfile } from "@/lib/store";
import { demoMusicUrls, globalTrack } from "@/lib/gift-assets";
import { validatePhoto } from "@/lib/portraits";
describe("store", () => {
  it("tiles keep repeats & diacritics, drop spaces", () => {
    expect(answerTiles("HOA HỒNG")).toEqual(["H","O","A","H","Ồ","N","G"]);
    expect(answerTiles("Đà Lạt!")).toEqual(["Đ","À","L","Ạ","T"]);
    expect(answerTiles("DỄ THƯƠNG")).toHaveLength(8);
  });
  it("normalizes keyword", () => {
    expect(normalizeKeyword("  HoaMeo ")).toBe("hoameo");
    expect(normalizeKeyword("Đà")).not.toBe(normalizeKeyword("da"));
  });
  it("allows shared keywords but blocks active name/alias collisions", () => {
    const a = { ...emptyProfile(), label: "a", fullName: "Nguyễn Ngọc Linh", aliases: ["Ngọc Linh"], keyword: "hoameo", status: "active" as const, wish: "Hi" };
    const b = { ...emptyProfile(), label: "b", fullName: "Trần Mai Anh", keyword: "HOAMEO ", wish: "Hi" };
    expect(validateProfile(b, "active", [a]).keyword).toBeUndefined();
    expect(validateProfile({ ...b, aliases: ["  NGỌC   LINH "] }, "active", [a]).aliases).toBeTruthy();
    expect(normalizeName("  Nguyễn   Ngọc Linh ".normalize("NFD"))).toBe("nguyễn ngọc linh");
    expect(normalizeName("Ngoc Linh")).not.toBe(normalizeName("Ngọc Linh"));
  });
  it("terminates shuffle for identical letters", () => {
    expect(shuffle(["A", "A", "A"])).toEqual(["A", "A", "A"]);
  });
  it("migrates without losing custom fields and invalidates old access", () => {
    localStorage.clear();
    const old = { ...emptyProfile(), id: "seed-hoameo", label: "Keep", keyword: "hoameo", question: "Old question", wish: "Keep my wish", status: "active", openedCount: 7 } as Record<string, unknown>;
    for (const key of ["fullName", "aliases", "keywordQuestion", "musicUrl", "musicTitle", "musicArtist", "musicEnabled", "musicVolume", "musicLoop", "memes"]) delete old[key];
    localStorage.setItem("mh.profiles.v1", JSON.stringify([old]));
    localStorage.setItem("mh.progress.v1.seed-hoameo", JSON.stringify({ step: "letter", revealed: true }));
    localStorage.setItem("mh.session.v1", JSON.stringify({ profileId: "seed-hoameo" }));
    const p = getProfiles()[0];
    expect(p?.fullName).toBe("Nguyễn Ngọc Linh"); expect(p?.wish).toBe("Keep my wish"); expect(p?.openedCount).toBe(7); expect(p?.keywordQuestion).toBe("Old question");
    expect(getProgress("seed-hoameo")).toBeNull(); expect(localStorage.getItem("mh.session.v1")).toBeNull();
    expect(findByName(" NGỌC   LINH ")?.id).toBe("seed-hoameo");
    if (p) { expect(verifyKeyword(p, "dalat1208")).toBe(false); expect(verifyKeyword(p, " HoaMeo ")).toBe(true); }
    localStorage.clear();
  });
  it("validates direct audio URLs", () => {
    expect(isAudioUrl("https://example.com/song.mp3?token=x")).toBe(true);
    expect(isAudioUrl("https://youtube.com/watch?v=x")).toBe(false);
    expect(isAudioUrl("http://example.com/song.wav")).toBe(false);
  });
  it("uses the supplied global looping track at 0.2 volume", () => {
    expect(globalTrack.volume).toBe(0.2); expect(globalTrack.loop).toBe(true);
    expect(globalTrack.url).toContain("love-like-you.mp3");
  });
  it("disables original seed overrides but preserves real custom music", () => {
    expect(migrateProfile({ ...emptyProfile(), musicUrl: demoMusicUrls[0] ?? "", musicEnabled: true }).musicEnabled).toBe(false);
    expect(migrateProfile({ ...emptyProfile(), musicUrl: "https://example.com/custom.mp3", musicEnabled: true }).musicEnabled).toBe(true);
  });
  it("migrates default name and pink colors without deleting replies or custom settings", () => {
    localStorage.clear(); localStorage.setItem("mh.settings.v1", JSON.stringify({ brandTitle: "Meo & Hoa", primaryColor: "#e8667a", accentColor: "#8fae8b", signature: "Keep" }));
    localStorage.setItem("mh.replies.v1", JSON.stringify([{ message: "Keep reply" }]));
    expect(getSettings()).toMatchObject({ brandTitle: "Gửi những người phụ nữ của TranTrinh", primaryColor: "#FF5C89", accentColor: "#FB8CAC", signature: "Keep" });
    expect(JSON.parse(localStorage.getItem("mh.replies.v1") ?? "[]")[0].message).toBe("Keep reply");
    localStorage.setItem("mh.settings.v1", JSON.stringify({ primaryColor: "#123456" })); expect(getSettings().primaryColor).toBe("#123456"); localStorage.clear();
  });
  it("keeps existing portrait URL and description during migration", () => {
    const p = migrateProfile({ ...emptyProfile(), imageUrl: "https://example.com/portrait.jpg", imageAlt: "Recipient" });
    expect(p.imageUrl).toBe("https://example.com/portrait.jpg"); expect(p.imageAlt).toBe("Recipient");
  });
  it("allows supported photo types up to 8 MB and rejects larger files", () => {
    expect(() => validatePhoto({ type: "image/jpeg", size: 8 * 1024 * 1024 })).not.toThrow();
    expect(() => validatePhoto({ type: "image/jpeg", size: 8 * 1024 * 1024 + 1 })).toThrow();
    expect(() => validatePhoto({ type: "text/plain", size: 10 })).toThrow();
  });
});

