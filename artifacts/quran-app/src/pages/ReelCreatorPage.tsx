import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useGetSurahs, useGetSurah } from "@workspace/api-client-react";
import {
  Square, ImageIcon, Film, Loader2, Upload,
  ChevronLeft, ChevronRight, Volume2, VolumeX, X, Plus, ChevronDown,
  Music, Play, Pause, Trash2, RotateCcw, Home, CheckCircle2, AlertCircle,
  BookOpen, Palette, Monitor, SlidersHorizontal
} from "lucide-react";
import { toArabicDigits } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import AudioEditorModal from "@/components/AudioEditorModal";

const MAX_AYAHS_VIDEO = 10;
const MAX_BG_IMAGES   = 5;
const CANVAS_W = 1080;
const CANVAS_H = 1920;

const RECITERS = [
  { id: "ar.alafasy",            name: "مشاري راشد العفاسي" },
  { id: "ar.abdurrahmanasudais", name: "عبدالرحمن السديس" },
  { id: "ar.husary",             name: "محمود خليل الحصري" },
  { id: "ar.minshawi",           name: "محمد صديق المنشاوي" },
  { id: "ar.ahmedajamy",         name: "أحمد بن علي العجمي" },
  { id: "ar.mahermuaiqly",       name: "ماهر المعيقلي" },
  { id: "ar.abdullahbasfar",     name: "عبدالله بصفر" },
  { id: "ar.saudalshuraim",      name: "سعود الشريم" },
  { id: "ar.shaatree",           name: "أبو بكر الشاطري" },
  { id: "ar.ibrahimakhbar",      name: "إبراهيم الأخضر" },
  { id: "ar.hani",               name: "هاني الرفاعي" },
  { id: "ar.husarymujawwad",     name: "الحصري (مجوّد)" },
  { id: "ar.minshawimujawwad",   name: "المنشاوي (مجوّد)" },
  { id: "ar.nasser.alqatami",    name: "ناصر القطامي" },
  { id: "ar.khalefa",            name: "خالفة الطنيجي" },
  { id: "ar.abdulsamad",         name: "عبد الباسط عبد الصمد" },
  { id: "ar.alhudhayfi",         name: "علي الحذيفي" },
  { id: "ar.saadalghamdi",       name: "سعد الغامدي" },
  { id: "ar.muhammadayyub",      name: "محمد أيوب" },
  { id: "ar.johani",             name: "عبد الله الجهني" },
  { id: "ar.faresabbad",         name: "فارس عباد" },
  { id: "ar.bandarbalila",       name: "بندر بليلة" },
  { id: "ar.walk",               name: "ووكر" },
];

// Quran CDN reciter IDs for automatic timing data
const QURAN_CDN_RECITER_MAP: Record<string, number> = {
  "ar.alafasy":            7,
  "ar.abdurrahmanasudais": 3,
  "ar.husary":             6,
  "ar.minshawi":           9,
  "ar.mahermuaiqly":       10,
  "ar.abdullahbasfar":     2,
  "ar.shaatree":           13,
  "ar.nasser.alqatami":    11,
};

const COLOR_BKGS = [
  { id: "green",   name: "أخضر",    stops: ["#061a0a","#0d3318","#1a5c2e","#0d3318","#061a0a"], accent: "#c9a84c" },
  { id: "navy",    name: "بحري",    stops: ["#050d1a","#0a1f3d","#12306b","#0a1f3d","#050d1a"], accent: "#d4af7a" },
  { id: "black",   name: "أسود",    stops: ["#000000","#111111","#1a1a1a","#111111","#000000"], accent: "#d4a017" },
  { id: "emerald", name: "زمردي",   stops: ["#012117","#023d2a","#03614a","#023d2a","#012117"], accent: "#fbbf24" },
  { id: "purple",  name: "أرجواني", stops: ["#13052a","#2d1060","#4c1d95","#2d1060","#13052a"], accent: "#e8c85a" },
  { id: "brown",   name: "بني",     stops: ["#150900","#2d1500","#4a2200","#2d1500","#150900"], accent: "#f5c842" },
  { id: "teal",    name: "فيروزي",  stops: ["#021c1b","#033834","#054d48","#033834","#021c1b"], accent: "#fcd34d" },
  { id: "slate",   name: "رمادي",   stops: ["#070d14","#0f1c2a","#1a2d42","#0f1c2a","#070d14"], accent: "#94d0cc" },
];

// Decoration styles (used internally by drawReel)
const DECO_STYLES = ["none","classic","ornate","minimal","arch","mosque"] as const;
type DecoStyle = typeof DECO_STYLES[number];

// Named theme presets — each sets a bg color only; decorations are chosen separately via PATTERNS
const TEMPLATES: { id: string; name: string; emoji: string; bgId: string; decoId: DecoStyle }[] = [
  { id: "purple-night",  name: "ليل بنفسجي",  emoji: "🌙", bgId: "purple",  decoId: "none" },
  { id: "gold-luxe",     name: "ذهبي فاخر",   emoji: "✨", bgId: "navy",    decoId: "none" },
  { id: "islamic-green", name: "أخضر إسلامي", emoji: "🕌", bgId: "green",   decoId: "none" },
  { id: "royal-blue",    name: "أزرق ملكي",   emoji: "💙", bgId: "navy",    decoId: "none" },
  { id: "dark-maroon",   name: "عنابي داكي",  emoji: "🌺", bgId: "brown",   decoId: "none" },
  { id: "silver-grey",   name: "رمادي فضي",   emoji: "○",  bgId: "slate",   decoId: "none" },
  { id: "emerald",       name: "زمردي",        emoji: "💚", bgId: "emerald", decoId: "none" },
  { id: "purple-pink",   name: "بنفسجي وردي", emoji: "🌸", bgId: "purple",  decoId: "none" },
  { id: "black-gold",    name: "أسود ذهبي",   emoji: "⭐", bgId: "black",   decoId: "none" },
  { id: "sky-teal",      name: "سماوي",        emoji: "🐠", bgId: "teal",    decoId: "none" },
  { id: "dark-beige",    name: "بيج داكي",    emoji: "💗", bgId: "brown",   decoId: "none" },
  { id: "plain",         name: "بلا زخرفة",   emoji: "□",  bgId: "black",   decoId: "none" },
];

const PATTERNS = [
  { id: "none",       name: "بدون زخرفة" },
  { id: "hexagon",    name: "شبكة سداسية" },
  { id: "geometric",  name: "هندسي إسلامي" },
  { id: "arabesque",  name: "أرابيسك" },
  { id: "mashrabiya", name: "مشربية" },
  { id: "stars8",     name: "ثماني إسلامي" },
  { id: "stars6",     name: "نجوم إسلامية" },
  { id: "floral",     name: "زخارف نباتية" },
  { id: "waves",      name: "موجات ذهبية" },
  { id: "arabic",     name: "زخارف عربية" },
  { id: "mosaic",     name: "فسيفساء" },
  { id: "dots",       name: "نقاط" },
];

const BG_ANIMATIONS = [
  { id: "none",      label: "بدون حركة" },
  { id: "ken-burns", label: "Ken Burns (موصى به) ⭐" },
  { id: "zoom-in",   label: "تكبير مستمر (Zoom In)" },
  { id: "zoom-out",  label: "تصغير مستمر (Zoom Out)" },
  { id: "pan",       label: "تحريك" },
  { id: "rotate",    label: "دوران" },
];

const VIDEO_QUALITY_OPTIONS = [
  { id: "medium", label: "متوسطة",      sublabel: "1 Mbps",    bitrateKbps: 1000 },
  { id: "high",   label: "عالية",       sublabel: "2.5 Mbps",  bitrateKbps: 2500 },
  { id: "ultra",  label: "عالية جداً",  sublabel: "5 Mbps",    bitrateKbps: 5000 },
] as const;

const FPS_OPTIONS = [
  { id: "24", label: "24 fps",        fps: 24 },
  { id: "30", label: "30 fps (ريلز)", fps: 30 },
  { id: "60", label: "60 fps",        fps: 60 },
] as const;

// Surahs: 9 = no bismillah, 1 = bismillah IS ayah 1 (not a header)
const SURAH_NO_BISMILLAH   = 9;
const SURAH_BISMILLAH_IS_AYAH = 1;
const BISMILLAH_DISPLAY    = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
const MAX_SEGMENT_WORDS    = 16;

function startsWithBismillah(text: string): boolean {
  const bare = text.trim().replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED\u0640\u0652\u0670\u0671\uFB50-\uFDFF\uFE70-\uFEFF\u200B-\u200F]/g, "");
  return bare.startsWith("بسم");
}

function stripBismillahPrefix(text: string): string {
  const words = text.trim().split(/\s+/);
  // Bismillah is exactly 4 words; strip them if present
  if (words.length > 4 && startsWithBismillah(text)) return words.slice(4).join(" ").trim();
  return text.trim();
}

function splitIntoWordSegments(text: string, maxWords = MAX_SEGMENT_WORDS): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return [text.trim()];
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) chunks.push(words.slice(i, i + maxWords).join(" "));
  return chunks;
}

// ── Sync segments: split long ayahs into ≤16-word chunks ────────────────────
const SYNC_MAX_WORDS   = 16;
const SYNC_MIN_TAIL    = 4;  // merge last chunk if ≤ this many words

interface SyncSegment {
  ayahIdx:    number;   // index into ayahRange
  ayahNum:    number;   // numberInSurah
  text:       string;   // segment text (partial or full ayah)
  partIdx:    number;   // 0-based within ayah
  totalParts: number;
  isFirst:    boolean;
  isLast:     boolean;
}

function computeSyncSegments(
  ayahRange: { text: string; numberInSurah: number }[],
): SyncSegment[] {
  const segs: SyncSegment[] = [];
  for (let ayahIdx = 0; ayahIdx < ayahRange.length; ayahIdx++) {
    const ayah  = ayahRange[ayahIdx];
    const words = ayah.text.trim().split(/\s+/).filter(Boolean);

    if (words.length <= SYNC_MAX_WORDS) {
      segs.push({ ayahIdx, ayahNum: ayah.numberInSurah, text: ayah.text.trim(),
        partIdx: 0, totalParts: 1, isFirst: true, isLast: true });
      continue;
    }

    // Build raw chunks of SYNC_MAX_WORDS
    const chunks: string[][] = [];
    for (let i = 0; i < words.length; i += SYNC_MAX_WORDS)
      chunks.push(words.slice(i, i + SYNC_MAX_WORDS));

    // Merge last chunk into previous if too small
    if (chunks.length > 1 && chunks[chunks.length - 1].length <= SYNC_MIN_TAIL) {
      const tail = chunks.pop()!;
      chunks[chunks.length - 1].push(...tail);
    }

    chunks.forEach((chunk, partIdx) =>
      segs.push({
        ayahIdx, ayahNum: ayah.numberInSurah,
        text: chunk.join(" "),
        partIdx, totalParts: chunks.length,
        isFirst: partIdx === 0, isLast: partIdx === chunks.length - 1,
      })
    );
  }
  return segs;
}

const FONT_OPTIONS = [
  { id: "'Scheherazade New', 'Amiri', serif", name: "Scheherazade — نص عربي" },
  { id: "'Amiri', serif",                      name: "Amiri — نص عربي" },
  { id: "'Noto Naskh Arabic', serif",          name: "Noto Naskh — نص عربي" },
  { id: "'Lateef', serif",                     name: "Lateef — نص عربي" },
  { id: "'Cairo', sans-serif",                 name: "Cairo — نص عربي" },
];

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getAudioExt(file: File): string {
  const mime = file.type.toLowerCase();
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("aac")) return "aac";
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ?? "mp3";
}

function hex2rgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function getGlobalAyahNumber(surahNumber: number, ayahNum: number, counts: number[]): number {
  let c = 0;
  for (let i = 0; i < surahNumber - 1; i++) c += counts[i] ?? 0;
  return c + ayahNum;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, or: number, ir: number, pts: number, col: string, alpha: number) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = col;
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? or : ir;
    const ang = (i * Math.PI) / pts - Math.PI / 2;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(ang), cy + r * Math.sin(ang));
    else ctx.lineTo(cx + r * Math.cos(ang), cy + r * Math.sin(ang));
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawGeomCorner(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, col: string, fx: boolean, fy: boolean) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(fx ? -1 : 1, fy ? -1 : 1);
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.moveTo(0, size); ctx.lineTo(0, 0); ctx.lineTo(size, 0); ctx.stroke();
  ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(0, size*0.6); ctx.lineTo(0, size*0.15); ctx.lineTo(size*0.15, 0); ctx.lineTo(size*0.6, 0); ctx.stroke();
  ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.arc(size*0.3, size*0.3, size*0.25, 0, Math.PI*2); ctx.stroke();
  ctx.restore();
}

function drawArabesque(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, col: string, alpha: number) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = 2.5;
  const petals = 7; const r = 28;
  for (let i = 0; i < petals; i++) {
    const ang = (i / petals) * Math.PI * 2;
    const px = x + Math.cos(ang) * r * 1.6, py = y + Math.sin(ang) * r * 0.9;
    ctx.beginPath(); ctx.ellipse(px, py, r * 0.5, r * 0.22, ang, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.globalAlpha = alpha * 0.6;
  ctx.beginPath(); ctx.moveTo(x - w/2, y); ctx.bezierCurveTo(x - w/4, y - 30, x - w/6, y + 30, x, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w/2, y); ctx.bezierCurveTo(x + w/4, y - 30, x + w/6, y + 30, x, y); ctx.stroke();
  ctx.restore();
}

function drawArch(ctx: CanvasRenderingContext2D, cx: number, top: number, w: number, h: number, col: string, alpha: number) {
  const r = w / 2;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx - r, top + h); ctx.lineTo(cx - r, top + r);
  ctx.arc(cx, top + r, r, Math.PI, 0, false); ctx.lineTo(cx + r, top + h); ctx.stroke();
  ctx.lineWidth = 2; ctx.globalAlpha = alpha * 0.5;
  const ir = r - 20;
  ctx.beginPath(); ctx.moveTo(cx - ir, top + h); ctx.lineTo(cx - ir, top + r + 20);
  ctx.arc(cx, top + r + 20, ir, Math.PI, 0, false); ctx.lineTo(cx + ir, top + h); ctx.stroke();
  ctx.fillStyle = col; ctx.globalAlpha = alpha * 0.6;
  ctx.beginPath(); ctx.arc(cx, top, 16, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawDome(ctx: CanvasRenderingContext2D, cx: number, y: number, col: string, alpha: number) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 160, y);
  ctx.bezierCurveTo(cx - 160, y - 80, cx - 80, y - 200, cx, y - 240);
  ctx.bezierCurveTo(cx + 80, y - 200, cx + 160, y - 80, cx + 160, y);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 220, y - 100, 30, 100);
  ctx.beginPath(); ctx.moveTo(cx - 220, y - 100); ctx.lineTo(cx - 205, y - 140); ctx.lineTo(cx - 190, y - 100); ctx.stroke();
  ctx.strokeRect(cx + 190, y - 100, 30, 100);
  ctx.beginPath(); ctx.moveTo(cx + 190, y - 100); ctx.lineTo(cx + 205, y - 140); ctx.lineTo(cx + 220, y - 100); ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(cx, y - 250, 18, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawOverlayPattern(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  patternType: string, accent: string,
  intensity = 1,
) {
  if (patternType === "none" || intensity <= 0) return;
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = 1;
  const a = (n: number) => n * intensity;

  switch (patternType) {
    case "hexagon": {
      const R = 55, hh = R * Math.sqrt(3);
      ctx.globalAlpha = a(0.07);
      for (let col = -1; col * R * 3 < W + R * 3; col++) {
        for (let row = -1; row * hh < H + hh; row++) {
          const cx = col * R * 3;
          const cy = row * hh + (col % 2 !== 0 ? hh / 2 : 0);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3 + Math.PI / 6;
            i === 0 ? ctx.moveTo(cx + R * Math.cos(a), cy + R * Math.sin(a))
                    : ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
          }
          ctx.closePath(); ctx.stroke();
        }
      }
      break;
    }
    case "mashrabiya": {
      const sp = 50;
      ctx.globalAlpha = a(0.08);
      for (let x = -H; x < W + H; x += sp) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - H, H); ctx.stroke();
      }
      break;
    }
    case "dots": {
      const sp = 65;
      ctx.globalAlpha = a(0.13);
      for (let x = sp / 2; x < W; x += sp)
        for (let y = sp / 2; y < H; y += sp) {
          ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
        }
      break;
    }
    case "waves": {
      const sp = 95, amp = 22, wl = 130;
      ctx.globalAlpha = a(0.1); ctx.lineWidth = 1.5;
      for (let y = sp / 2; y < H; y += sp) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 5) {
          const wy = y + Math.sin((x / wl) * Math.PI * 2) * amp;
          x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
        }
        ctx.stroke();
      }
      break;
    }
    case "stars8": {
      const sp = 130;
      ctx.globalAlpha = a(0.07);
      for (let x = sp / 2; x < W; x += sp)
        for (let y = sp / 2; y < H; y += sp) {
          ctx.beginPath();
          for (let i = 0; i < 16; i++) {
            const r = i % 2 === 0 ? sp * 0.44 : sp * 0.19;
            const a = (i * Math.PI) / 8 - Math.PI / 2;
            i === 0 ? ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
                    : ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
          }
          ctx.closePath(); ctx.stroke();
        }
      break;
    }
    case "stars6": {
      const sp = 110;
      ctx.globalAlpha = a(0.07);
      for (let x = sp / 2; x < W; x += sp)
        for (let y = sp / 2; y < H; y += sp) {
          ctx.beginPath();
          for (let i = 0; i < 12; i++) {
            const r = i % 2 === 0 ? sp * 0.42 : sp * 0.22;
            const a = (i * Math.PI) / 6 - Math.PI / 2;
            i === 0 ? ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
                    : ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
          }
          ctx.closePath(); ctx.stroke();
        }
      break;
    }
    case "geometric": {
      const sp = 85;
      ctx.globalAlpha = a(0.07);
      for (let x = 0; x < W; x += sp)
        for (let y = 0; y < H; y += sp) {
          const cx = x + sp / 2, cy = y + sp / 2, r = sp * 0.44;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2 + Math.PI / 4;
            i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
                    : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
          }
          ctx.closePath(); ctx.stroke();
          ctx.strokeRect(x + sp * 0.15, y + sp * 0.15, sp * 0.7, sp * 0.7);
        }
      break;
    }
    case "mosaic": {
      const sp = 42;
      ctx.globalAlpha = a(0.07);
      for (let x = 0; x < W; x += sp)
        for (let y = 0; y < H; y += sp)
          if ((Math.floor(x / sp) + Math.floor(y / sp)) % 2 === 0)
            ctx.fillRect(x, y, sp, sp);
      break;
    }
    case "arabesque": {
      const sp = 150;
      ctx.globalAlpha = a(0.08); ctx.lineWidth = 1.5;
      for (let x = sp / 2; x < W; x += sp)
        for (let y = sp / 2; y < H; y += sp) {
          for (let p = 0; p < 6; p++) {
            const a = (p / 6) * Math.PI * 2;
            const r = sp * 0.28;
            ctx.beginPath();
            ctx.ellipse(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85, r * 0.4, r * 0.14, a, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
        }
      break;
    }
    case "floral": {
      const sp = 165;
      ctx.globalAlpha = a(0.08); ctx.lineWidth = 1.5;
      for (let x = sp / 2; x < W; x += sp)
        for (let y = sp / 2; y < H; y += sp) {
          for (let p = 0; p < 4; p++) {
            const a = (p / 4) * Math.PI * 2;
            const lx = x + Math.cos(a) * sp * 0.28;
            const ly = y + Math.sin(a) * sp * 0.28;
            ctx.beginPath(); ctx.ellipse(lx, ly, sp * 0.22, sp * 0.09, a + Math.PI / 4, 0, Math.PI * 2); ctx.stroke();
          }
          for (let p = 0; p < 4; p++) {
            const a = (p / 4) * Math.PI * 2 + Math.PI / 4;
            const lx = x + Math.cos(a) * sp * 0.18, ly = y + Math.sin(a) * sp * 0.18;
            ctx.beginPath(); ctx.ellipse(lx, ly, sp * 0.12, sp * 0.05, a, 0, Math.PI * 2); ctx.stroke();
          }
        }
      break;
    }
    case "arabic": {
      const sp = 105;
      ctx.globalAlpha = a(0.07); ctx.lineWidth = 1;
      for (let x = 0; x < W; x += sp)
        for (let y = 0; y < H; y += sp) {
          const cx = x + sp / 2, cy = y + sp / 2;
          ctx.beginPath(); ctx.arc(cx, cy, sp * 0.3, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, cy, sp * 0.13, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(cx - sp * 0.42, cy); ctx.lineTo(cx + sp * 0.42, cy);
          ctx.moveTo(cx, cy - sp * 0.42); ctx.lineTo(cx, cy + sp * 0.42);
          ctx.stroke();
          for (let p = 0; p < 4; p++) {
            const a = (p / 4) * Math.PI * 2 + Math.PI / 4;
            ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * sp * 0.3, cy + Math.sin(a) * sp * 0.3);
            ctx.lineTo(cx + Math.cos(a) * sp * 0.45, cy + Math.sin(a) * sp * 0.45); ctx.stroke();
          }
        }
      break;
    }
  }
  ctx.restore();
}

interface DrawOptions {
  showSurahName?: boolean;
  showReciterName?: boolean;
  showBadge?: boolean;
  watermarkText?: string;
  showBgOverlay?: boolean;
  bgOpacity?: number;
}

async function drawReel(
  canvas: HTMLCanvasElement,
  ayahText: string, surahName: string, englishName: string,
  ayahNum: number, surahNum: number,
  bgColor1: string, bgColor2: string, fontFamily: string,
  totalAyahs: number, currentIndex: number,
  templateId: string,
  reciterName: string,
  bgImage: HTMLImageElement | null,
  textColor: string,
  fontSize: number,
  patternType: string,
  animType = "none",
  animProgress = 0,
  opts: DrawOptions = {},
) {
  const {
    showSurahName  = true,
    showReciterName = true, showBadge = true,
    watermarkText = "",
    showBgOverlay = true,
    bgOpacity = 20,
  } = opts;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = CANVAS_W, H = CANVAS_H;
  const accent = "#c9a84c";

  await document.fonts.ready;
  ctx.clearRect(0, 0, W, H);

  if (bgImage) {
    const imgAspect = bgImage.width / bgImage.height;
    const canvasAspect = W / H;
    let sx = 0, sy = 0, sw = bgImage.width, sh = bgImage.height;
    if (imgAspect > canvasAspect) { sw = bgImage.height * canvasAspect; sx = (bgImage.width - sw) / 2; }
    else { sh = bgImage.width / canvasAspect; sy = (bgImage.height - sh) / 2; }

    const p = Math.max(0, Math.min(1, animProgress));
    let fsx = sx, fsy = sy, fsw = sw, fsh = sh;

    if (animType === "zoom-in") {
      const scale = 1 + 0.18 * p;
      fsw = sw / scale; fsh = sh / scale;
      fsx = sx + (sw - fsw) / 2; fsy = sy + (sh - fsh) / 2;
    } else if (animType === "zoom-out") {
      const scale = 1.18 - 0.18 * p;
      fsw = sw / scale; fsh = sh / scale;
      fsx = sx + (sw - fsw) / 2; fsy = sy + (sh - fsh) / 2;
    } else if (animType === "ken-burns") {
      const scale = 1 + 0.1 * p;
      fsw = sw / scale; fsh = sh / scale;
      fsx = sx + (sw - fsw) * (0.3 + 0.4 * p);
      fsy = sy + (sh - fsh) * 0.3;
    } else if (animType === "pan") {
      const maxPan = sw * 0.12;
      fsw = sw * 0.88; fsh = sh * 0.88;
      fsx = sx + maxPan * p; fsy = sy + (sh - fsh) / 2;
    } else if (animType === "rotate") {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate((p * 4 - 2) * Math.PI / 180);
      ctx.translate(-W / 2, -H / 2);
      ctx.drawImage(bgImage, sx - sw * 0.08, sy - sh * 0.08, sw * 1.16, sh * 1.16, 0, 0, W, H);
      ctx.restore();
      fsx = -1; // sentinel — skip default draw
    }

    if (fsx >= 0) ctx.drawImage(bgImage, fsx, fsy, fsw, fsh, 0, 0, W, H);

    // Dark base overlay
    const darkOverlay = ctx.createLinearGradient(0, 0, 0, H);
    darkOverlay.addColorStop(0, "rgba(0,0,0,0.72)");
    darkOverlay.addColorStop(0.5, "rgba(0,0,0,0.55)");
    darkOverlay.addColorStop(1, "rgba(0,0,0,0.72)");
    ctx.fillStyle = darkOverlay; ctx.fillRect(0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, bgColor1);
    grad.addColorStop(1, bgColor2);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    const radial = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7);
    radial.addColorStop(0, hex2rgba(accent, 0.07));
    radial.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = radial; ctx.fillRect(0, 0, W, H);
  }

  // Overlay pattern
  drawOverlayPattern(ctx, W, H, patternType, accent, showBgOverlay ? bgOpacity / 100 : 0);

  const margin = 60;
  if (templateId === "classic") {
    [[120,200],[960,180],[80,1720],[1000,1740],[200,900],[880,920]].forEach(([x,y]) =>
      drawStar(ctx, x, y, 18, 8, 6, accent, 0.3));
    drawStar(ctx, W/2, 420, 30, 13, 8, accent, 0.25);
    drawGeomCorner(ctx, margin, margin, 100, accent, false, false);
    drawGeomCorner(ctx, W-margin, margin, 100, accent, true, false);
    drawGeomCorner(ctx, margin, H-margin, 100, accent, false, true);
    drawGeomCorner(ctx, W-margin, H-margin, 100, accent, true, true);
  } else if (templateId === "ornate") {
    const rosPos = [[margin+60,margin+60],[W-margin-60,margin+60],[margin+60,H-margin-60],[W-margin-60,H-margin-60]] as [number,number][];
    rosPos.forEach(([rx,ry]) => {
      for (let p = 0; p < 8; p++) {
        const ang = (p/8)*Math.PI*2;
        drawStar(ctx, rx + Math.cos(ang)*28, ry + Math.sin(ang)*28, 10, 4, 6, accent, 0.5);
      }
      drawStar(ctx, rx, ry, 22, 10, 8, accent, 0.9);
    });
    drawArabesque(ctx, W/2, margin+14, 300, accent, 0.7);
    drawArabesque(ctx, W/2, H-margin-14, 300, accent, 0.7);
    drawArabesque(ctx, margin+14, H/2, 300, accent, 0.7);
    drawArabesque(ctx, W-margin-14, H/2, 300, accent, 0.7);
    for (let i = 0; i < 5; i++) {
      drawStar(ctx, W/2 - 200 + i*100, 490, 10, 4, 6, accent, 0.5);
      drawStar(ctx, W/2 - 200 + i*100, H-490, 10, 4, 6, accent, 0.5);
    }
  } else if (templateId === "minimal") {
    [[margin,margin],[W-margin,margin],[margin,H-margin],[W-margin,H-margin]].forEach(([cx,cy]) => {
      ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI*2);
      ctx.fillStyle = accent; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
    });
    const dw = 60;
    [[W/2, margin+6],[W/2, H-margin-6]].forEach(([dx,dy]) => {
      ctx.beginPath(); ctx.moveTo(dx, dy-dw/2); ctx.lineTo(dx+dw/3, dy);
      ctx.lineTo(dx, dy+dw/2); ctx.lineTo(dx-dw/3, dy); ctx.closePath();
      ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
    });
  } else if (templateId === "arch") {
    drawArch(ctx, W/2, margin+30, 700, 500, accent, 0.8);
    ctx.save(); ctx.translate(W/2, H/2); ctx.scale(1, -1); ctx.translate(-W/2, -H/2);
    drawArch(ctx, W/2, H-margin-530, 700, 500, accent, 0.8);
    ctx.restore();
    drawStar(ctx, W/2, margin+80, 28, 12, 8, accent, 0.5);
    [[W/2-200,margin+200],[W/2+200,margin+200]].forEach(([sx,sy]) => drawStar(ctx, sx, sy, 14, 6, 6, accent, 0.35));
    drawGeomCorner(ctx, margin, margin, 80, accent, false, false);
    drawGeomCorner(ctx, W-margin, margin, 80, accent, true, false);
    drawGeomCorner(ctx, margin, H-margin, 80, accent, false, true);
    drawGeomCorner(ctx, W-margin, H-margin, 80, accent, true, true);
  } else if (templateId === "mosque") {
    drawDome(ctx, W/2, margin+280, accent, 0.7);
    ctx.save(); ctx.translate(0, H); ctx.scale(1, -1);
    drawDome(ctx, W/2, margin+280, accent, 0.7);
    ctx.restore();
    [[W/2, margin+300],[W/2-300, H/2],[W/2+300, H/2]].forEach(([sx,sy]) =>
      drawStar(ctx, sx, sy, 18, 7, 6, accent, 0.2));
  }

  const bisY = templateId === "arch" ? margin + 340 : templateId === "mosque" ? margin + 330 : 320;

  const divY1 = bisY + 140, divY2 = H - divY1;

  const textMargin = 120, textMaxW = W - textMargin * 2;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";

  // Auto-shrink font so long ayahs fit between the two dividers
  const textAvailH = divY2 - divY1 - 320; // reserve 320px for badge + dots + margins
  let fs = fontSize;
  ctx.font = `${fs}px ${fontFamily}`;
  let lines = wrapText(ctx, ayahText, textMaxW);
  let lineH = fs * 1.65;
  while (lines.length * lineH > textAvailH && fs > 34) {
    fs -= 2;
    ctx.font = `${fs}px ${fontFamily}`;
    lines = wrapText(ctx, ayahText, textMaxW);
    lineH = fs * 1.65;
  }
  const totalTH = lines.length * lineH;

  // Center text block within the zone between the two dividers
  const textZoneMid = (divY1 + divY2) / 2 - 80;
  const textY = textZoneMid - totalTH / 2;

  ctx.fillStyle = textColor;
  ctx.shadowColor = hex2rgba(accent, 0.3); ctx.shadowBlur = 20;
  lines.forEach((line, i) => ctx.fillText(line, W/2, textY + i * lineH));
  ctx.shadowBlur = 0;

  const ayahBadgeY = textY + totalTH + 80;
  if (showBadge) {
    ctx.save();
    ctx.beginPath(); ctx.arc(W/2, ayahBadgeY, 40, 0, Math.PI*2);
    ctx.fillStyle = hex2rgba(accent, 0.2); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.8; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.font = `bold 40px ${fontFamily}`; ctx.fillStyle = accent;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(toArabicDigits(ayahNum), W/2, ayahBadgeY); ctx.restore();
  }

  if (totalAyahs > 1) {
    const ds = 14, dg = 24, tw = totalAyahs*(ds+dg)-dg;
    const sx = W/2 - tw/2 + ds/2, dy = ayahBadgeY + 80;
    for (let d = 0; d < totalAyahs; d++) {
      ctx.beginPath(); ctx.arc(sx + d*(ds+dg), dy, ds/2, 0, Math.PI*2);
      ctx.fillStyle = d === currentIndex ? accent : hex2rgba(accent, 0.3);
      ctx.globalAlpha = 1; ctx.fill();
    }
  }

  if (showSurahName) {
    ctx.font = `bold 62px ${fontFamily}`; ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.globalAlpha = 0.95;
    ctx.fillText(surahName, W/2, divY2 - 10); ctx.globalAlpha = 1;
  }

  // reciter block — moved higher to leave room for watermark
  const rY = H - margin - 290;
  if (reciterName && showReciterName) {
    ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.moveTo(W/2-180, rY-30); ctx.lineTo(W/2+180, rY-30); ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.font = `bold 38px ${fontFamily}`; ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("بصوت", W/2, rY + 10);
    ctx.font = `bold 46px ${fontFamily}`; ctx.fillStyle = accent;
    ctx.fillText(reciterName, W/2, rY + 68);
    ctx.globalAlpha = 1;
  }

  // ── Watermark / Signature — anchored below reciter block ────────────
  if (watermarkText) {
    ctx.save();
    const wFontSize = 34;
    ctx.font = `bold ${wFontSize}px Cairo, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.28;
    ctx.textAlign = "center";
    const wx = W / 2;
    const wy = rY + 148;   // always just below the reciter name line
    ctx.fillStyle = "#ffffff";
    ctx.fillText(watermarkText, wx, wy);
    ctx.restore();
  }
}

interface BgImageEntry { img: HTMLImageElement; name: string; objUrl: string; }

export default function ReelCreatorPage() {
  const { data: surahs, isLoading: surahsLoading } = useGetSurahs();
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [startAyah, setStartAyah]         = useState(1);
  const [endAyah, setEndAyah]             = useState(1);
  const [bgColor1,        setBgColor1]        = useState("#13052a");
  const [bgColor2,        setBgColor2]        = useState("#4c1d95");
  const [showBgOverlay,   setShowBgOverlay]   = useState(true);
  const [bgOpacity,       setBgOpacity]       = useState(100);
  const [selectedTheme, setSelectedTheme]       = useState("purple-night");
  const [selectedTemplate, setSelectedTemplate] = useState<DecoStyle>("none");

  const applyTheme = (themeId: string) => {
    const t = TEMPLATES.find(x => x.id === themeId);
    if (!t) return;
    setSelectedTheme(themeId);
    const bgEntry = COLOR_BKGS.find(b => b.id === t.bgId);
    if (bgEntry) {
      setBgColor1(bgEntry.stops[0]);
      setBgColor2(bgEntry.stops[2]);
    }
    setSelectedTemplate(t.decoId);
  };
  const [patternType, setPatternType]           = useState("none");
  const [selectedReciter, setSelectedReciter]   = useState(RECITERS[0].id);
  const [previewAyahIndex, setPreviewAyahIndex] = useState(0);

  const [bgImages, setBgImages]           = useState<BgImageEntry[]>([]);
  const [animBgIdx, setAnimBgIdx]         = useState(0);
  const [imageDuration, setImageDuration] = useState(5);

  const [, navigate] = useLocation();

  const [bgAnimType, setBgAnimType] = useState("ken-burns");
  const animProgressRef = useRef(0);
  const animStartRef    = useRef<number | null>(null);
  const rafRef          = useRef<number | null>(null);

  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].id);
  const [textColor, setTextColor]   = useState("#ffffff");
  const [fontSize, setFontSize]     = useState(66);
  const [surahOpen, setSurahOpen]   = useState(false);
  const [fontOpen, setFontOpen]     = useState(true);
  const [designOpen, setDesignOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(true);
  const [displayOpen, setDisplayOpen] = useState(true);

  // Display controls
  const [showSurahName,   setShowSurahName]   = useState(true);
  const [showReciterName, setShowReciterName] = useState(true);
  const [showBadge,       setShowBadge]       = useState(true);
  const [watermarkText,   setWatermarkText]   = useState("");
  const [videoQuality,    setVideoQuality]    = useState<"medium"|"high"|"ultra">("high");
  const [videoFps,        setVideoFps]        = useState<"24"|"30"|"60">("30");

  // Custom audio reciter name
  const [customReciterName, setCustomReciterName] = useState("");
  const [mobileTab, setMobileTab] = useState<"preview"|"surah"|"design"|"audio">("preview");

  // Custom audio sync
  const [customAudioFile, setCustomAudioFile]   = useState<File | null>(null);
  const [showAudioEditor, setShowAudioEditor]   = useState(false);
  const [customAudioUrl, setCustomAudioUrl]     = useState<string | null>(null);
  const [syncPoints, setSyncPoints]             = useState<number[]>([]);
  const [audioOpen, setAudioOpen]               = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration]       = useState(0);
  const [isAudioPlaying, setIsAudioPlaying]     = useState(false);
  const customAudioRef   = useRef<HTMLAudioElement | null>(null);
  const audioInputRef    = useRef<HTMLInputElement>(null);
  const progressBarRef   = useRef<HTMLDivElement>(null);

  // Sync modal
  const [syncModalOpen, setSyncModalOpen]       = useState(false);
  const [syncPhase, setSyncPhase]               = useState<"idle"|"running"|"done">("idle");
  const [syncCursor, setSyncCursor]             = useState(0);
  const [syncDraft, setSyncDraft]               = useState<number[]>([]);
  const syncCdnAudioRef                         = useRef<HTMLAudioElement | null>(null);
  const [syncCdnOffset, setSyncCdnOffset]       = useState(0);
  const [syncCdnCurrentTime, setSyncCdnCurrentTime] = useState(0);
  const [syncCdnAyahIdx, setSyncCdnAyahIdx]     = useState(0);
  const syncCdnOffsetRef                        = useRef(0);
  const syncCdnAyahIdxRef                       = useRef(0);
  // Per-ayah start offsets (cumulative seconds when each ayah's audio began)
  // Fixes: user tapping late (after onended already advanced) records wrong times
  const ayahStartOffsetsRef                     = useRef<number[]>([]);
  // Refs that are always current — avoids stale-closure bugs in event handlers
  const syncCursorRef                           = useRef(0);
  const syncPhaseRef                            = useRef<"idle"|"running"|"done">("idle");
  const syncNextRef                             = useRef<() => void>(() => {});
  const [autoSyncLoading, setAutoSyncLoading]   = useState(false);
  const [autoSyncError,   setAutoSyncError]     = useState("");

  const [isPlaying, setIsPlaying]         = useState(false);
  const [isPlayingAll, setIsPlayingAll]   = useState(false);
  const playAllActiveRef                  = useRef(false);
  const playAllCumRef                     = useRef(0); // cumulative seconds before current ayah
  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep]   = useState<"idle"|"rendering"|"uploading"|"encoding"|"done">("idle");
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDetail,   setExportDetail]   = useState("");
  const [exportError, setExportError]       = useState<string|null>(null);
  const exportStartRef = useRef<number>(0);
  const [exportTick, setExportTick] = useState(0);
  const [exportedBlob,     setExportedBlob]     = useState<Blob | null>(null);
  const [exportedType,     setExportedType]     = useState<"png"|"mp4">("mp4");
  const [exportedFilename, setExportedFilename] = useState("");
  const [exportedUrl,      setExportedUrl]      = useState<string|null>(null);

  const { data: surahDetail, isLoading: ayahsLoading } = useGetSurah(selectedSurah);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const stopFlagRef  = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const surahAyahCounts    = (surahs ?? []).map(s => s.numberOfAyahs);
  const currentSurah       = surahs?.find(s => s.number === selectedSurah);
  const ayahList           = surahDetail?.ayahs ?? [];
  const totalAyahsInRange  = Math.max(0, endAyah - startAyah + 1);

  // Ayah range and segments — defined early so currentSegment is available before handlers
  const ayahRange = ayahList.filter(a => a.numberInSurah >= startAyah && a.numberInSurah <= endAyah).slice(0, MAX_AYAHS_VIDEO);

  const segmentList = useMemo(() => {
    type Seg = { text: string; ayahNum: number; globalAyahNum: number; ayahRangeIdx: number; segIdx: number; totalSegs: number };
    const list: Seg[] = [];
    ayahRange.forEach((ayah, ayahIdx) => {
      const needsStrip = selectedSurah !== SURAH_NO_BISMILLAH && selectedSurah !== SURAH_BISMILLAH_IS_AYAH && ayah.numberInSurah === 1;
      const baseText = needsStrip ? stripBismillahPrefix(ayah.text) : ayah.text;
      const segs = splitIntoWordSegments(baseText);
      const gNum = getGlobalAyahNumber(selectedSurah, ayah.numberInSurah, surahAyahCounts);
      segs.forEach((segText, segIdx) =>
        list.push({ text: segText, ayahNum: ayah.numberInSurah, globalAyahNum: gNum, ayahRangeIdx: ayahIdx, segIdx, totalSegs: segs.length })
      );
    });
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayahList, startAyah, endAyah, selectedSurah, surahAyahCounts]);

  const currentSegment = segmentList[Math.min(previewAyahIndex, Math.max(0, segmentList.length - 1))];
  const previewAyah    = currentSegment ? ayahRange[currentSegment.ayahRangeIdx] : undefined;
  const hasLargeAyahInRange = segmentList.some(seg => seg.totalSegs > 1);
  const showSyncSection = !!customAudioFile || hasLargeAyahInRange;
  const currentReciterName = customAudioFile
    ? (customReciterName || "")
    : (RECITERS.find(r => r.id === selectedReciter)?.name ?? "");

  const drawOpts: DrawOptions = {
    showSurahName, showReciterName,
    showBadge, watermarkText,
    showBgOverlay, bgOpacity,
  };

  useEffect(() => {
    if (bgImages.length <= 1) { setAnimBgIdx(0); return; }
    const id = setInterval(() => setAnimBgIdx(p => (p + 1) % bgImages.length), imageDuration * 1000);
    return () => clearInterval(id);
  }, [bgImages.length, imageDuration]);

  useEffect(() => { playAllActiveRef.current = false; setIsPlayingAll(false); setIsPlaying(false); audioRef.current?.pause(); setStartAyah(1); setEndAyah(1); setPreviewAyahIndex(0); }, [selectedSurah]);
  useEffect(() => { playAllActiveRef.current = false; setIsPlayingAll(false); setIsPlaying(false); audioRef.current?.pause(); if (endAyah < startAyah) setEndAyah(startAyah); setPreviewAyahIndex(0); }, [startAyah, endAyah]);

  const currentBgImage = bgImages[animBgIdx]?.img ?? null;

  const redraw = useCallback(async () => {
    if (!canvasRef.current || !currentSegment || !currentSurah) return;
    await drawReel(
      canvasRef.current, currentSegment.text, currentSurah.name, currentSurah.englishName,
      currentSegment.ayahNum, selectedSurah, bgColor1, bgColor2, fontFamily,
      ayahRange.length, currentSegment.ayahRangeIdx, selectedTemplate, currentReciterName,
      currentBgImage, textColor, fontSize, patternType,
      bgAnimType, animProgressRef.current, drawOpts,
    );
  }, [currentSegment, currentSurah, selectedSurah, bgColor1, bgColor2, fontFamily, ayahRange.length,
      selectedTemplate, currentReciterName,
      currentBgImage, textColor, fontSize, patternType, bgAnimType,
      showSurahName, showReciterName, showBadge,
      watermarkText, showBgOverlay, bgOpacity]);

  useEffect(() => { if (!isExporting) redraw(); }, [redraw, isExporting]);

  // Tick every second during export so remaining-time display refreshes
  useEffect(() => {
    if (!isExporting) return;
    const id = setInterval(() => setExportTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isExporting]);

  // RAF animation loop for preview — paused during export to avoid canvas race conditions
  useEffect(() => {
    if (!currentBgImage || bgAnimType === "none" || isExporting) {
      animProgressRef.current = 0;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      animStartRef.current = null;
      return;
    }
    const CYCLE = 6000; // 6 second cycle
    const loop = (ts: number) => {
      if (animStartRef.current === null) animStartRef.current = ts;
      animProgressRef.current = ((ts - animStartRef.current) % CYCLE) / CYCLE;
      redraw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      animStartRef.current = null;
    };
  }, [currentBgImage, bgAnimType, redraw, isExporting]);

  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.slice(0, MAX_BG_IMAGES - bgImages.length).forEach(file => {
      const objUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () =>
        setBgImages(prev => prev.length < MAX_BG_IMAGES ? [...prev, { img, name: file.name, objUrl }] : prev);
      img.src = objUrl;
    });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setBgImages(prev => {
      URL.revokeObjectURL(prev[idx].objUrl);
      const next = prev.filter((_, i) => i !== idx);
      setAnimBgIdx(a => Math.min(a, Math.max(0, next.length - 1)));
      return next;
    });
  };

  // ── Custom audio handlers ──────────────────────────────────────────
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Stop & clean up previous
    if (customAudioRef.current) { customAudioRef.current.pause(); customAudioRef.current = null; }
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);

    setCustomAudioFile(file);
    setSyncPoints([]);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setIsAudioPlaying(false);

    // iOS Safari: use FileReader → data URL as primary,
    // URL.createObjectURL as fallback to avoid blob playback issues
    const setupAudio = (src: string) => {
      setCustomAudioUrl(src);
      const audio = new Audio();
      audio.preload = "metadata";
      // iOS requires explicit attribute for inline playback
      (audio as any).playsInline = true;
      (audio as any).webkitPlaysInline = true;
      audio.src = src;
      audio.onloadedmetadata = () => setAudioDuration(audio.duration);
      audio.ondurationchange   = () => { if (audio.duration && isFinite(audio.duration)) setAudioDuration(audio.duration); };
      audio.ontimeupdate = () => setAudioCurrentTime(audio.currentTime);
      audio.onended = () => setIsAudioPlaying(false);
      audio.onerror = (err) => console.warn("Audio load error:", err);
      audio.load();
      customAudioRef.current = audio;
    };

    // Prefer FileReader on iOS for maximum compatibility
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) setupAudio(dataUrl);
      };
      reader.onerror = () => {
        // Fallback to object URL
        const url = URL.createObjectURL(file);
        setupAudio(url);
      };
      reader.readAsDataURL(file);
    } else {
      const url = URL.createObjectURL(file);
      setupAudio(url);
    }

    e.target.value = "";
  };

  const handleAudioEditorApply = (processedFile: File) => {
    if (customAudioRef.current) { customAudioRef.current.pause(); customAudioRef.current = null; }
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
    setCustomAudioFile(processedFile);
    setAudioCurrentTime(0);
    setIsAudioPlaying(false);
    setShowAudioEditor(false);
    // WAV from editor — use object URL (already decoded, safe on all platforms)
    const url = URL.createObjectURL(processedFile);
    setCustomAudioUrl(url);
    const audio = new Audio();
    audio.preload = "metadata";
    (audio as any).playsInline = true;
    audio.src = url;
    audio.onloadedmetadata = () => setAudioDuration(audio.duration);
    audio.ondurationchange   = () => { if (audio.duration && isFinite(audio.duration)) setAudioDuration(audio.duration); };
    audio.ontimeupdate = () => setAudioCurrentTime(audio.currentTime);
    audio.onended = () => setIsAudioPlaying(false);
    audio.load();
    customAudioRef.current = audio;
  };

  const clearCustomAudio = () => {
    if (customAudioRef.current) { customAudioRef.current.pause(); customAudioRef.current = null; }
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
    setCustomAudioFile(null);
    setCustomAudioUrl(null);
    setSyncPoints([]);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setIsAudioPlaying(false);
  };

  const toggleCustomAudioPlay = () => {
    const audio = customAudioRef.current;
    if (!audio) return;
    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
    } else {
      // iOS Safari: play() returns a Promise — must handle it
      const p = audio.play();
      if (p !== undefined) {
        p.then(() => setIsAudioPlaying(true))
         .catch(err => {
           console.warn("Audio play failed:", err);
           // Try reloading src and playing again (iOS quirk)
           audio.load();
           audio.play().then(() => setIsAudioPlaying(true)).catch(() => {});
         });
      } else {
        setIsAudioPlaying(true);
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!customAudioRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    customAudioRef.current.currentTime = ratio * audioDuration;
  };

  const handleMark = () => {
    if (!customAudioRef.current) return;
    const time = customAudioRef.current.currentTime;
    setSyncPoints(prev => [...prev, time]);
  };

  const removeSyncPoint = (idx: number) => {
    setSyncPoints(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Sync modal handlers ─────────────────────────────────────────────────
  const openSyncModal = () => {
    setSyncDraft([...syncPoints]);
    setSyncPhase(syncPoints.length > 0 ? "done" : "idle");
    setSyncCursor(syncPoints.length);
    setAutoSyncError("");
    setSyncModalOpen(true);
  };

  const stopCdnSyncAudio = () => {
    if (syncCdnAudioRef.current) {
      syncCdnAudioRef.current.pause();
      syncCdnAudioRef.current.onended = null;
      syncCdnAudioRef.current.ontimeupdate = null;
      syncCdnAudioRef.current = null;
    }
  };

  const playCdnAyah = (idx: number, offset: number) => {
    if (idx >= ayahRange.length) return;
    stopCdnSyncAudio();
    // Record this ayah's start offset so syncNext can read correct times even after onended advances
    ayahStartOffsetsRef.current[idx] = offset;
    const ayah = ayahRange[idx];
    const g    = getGlobalAyahNumber(selectedSurah, ayah.numberInSurah, surahAyahCounts);
    const url  = `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${g}.mp3`;
    const audio = new Audio(url);
    syncCdnAudioRef.current = audio;
    syncCdnAyahIdxRef.current = idx;
    syncCdnOffsetRef.current = offset;
    audio.ontimeupdate = () => setSyncCdnCurrentTime(offset + audio.currentTime);
    audio.onended = () => {
      // Use the stored start offset for this ayah (not the global ref which may have changed)
      const storedStart = ayahStartOffsetsRef.current[idx] ?? offset;
      const newOffset   = storedStart + audio.duration;
      syncCdnOffsetRef.current = newOffset;
      setSyncCdnOffset(newOffset);
      setSyncCdnAyahIdx(idx + 1);
      syncCdnAyahIdxRef.current = idx + 1;
      playCdnAyah(idx + 1, newOffset);
    };
    audio.play().catch(() => {});
    setSyncCdnAyahIdx(idx);
  };

  const closeSyncModal = () => {
    syncPhaseRef.current = "idle";
    setSyncModalOpen(false);
    setSyncPhase("idle");
    if (customAudioRef.current) { customAudioRef.current.pause(); }
    stopCdnSyncAudio();
    setSyncCdnOffset(0); setSyncCdnCurrentTime(0); setSyncCdnAyahIdx(0);
    syncCdnOffsetRef.current = 0; syncCdnAyahIdxRef.current = 0;
    syncCursorRef.current = 0; ayahStartOffsetsRef.current = [];
    setIsAudioPlaying(false);
  };

  const handleAutoSync = async () => {
    if (!syncSegments.length) return;
    setAutoSyncLoading(true);
    setAutoSyncError("");

    try {
      // ── Step 1: measure actual duration of each ayah audio file ──────────
      const loadDuration = (urls: string[]): Promise<number> =>
        new Promise((resolve, reject) => {
          let idx = 0;
          const tryNext = () => {
            if (idx >= urls.length) { reject(new Error("تعذّر تحميل الملف الصوتي")); return; }
            const audio = new Audio();
            audio.preload = "metadata";
            audio.addEventListener("loadedmetadata", () => {
              const d = audio.duration;
              audio.src = "";
              if (isFinite(d) && d > 0) resolve(d); else tryNext();
            }, { once: true });
            audio.addEventListener("error", () => { audio.src = ""; tryNext(); }, { once: true });
            audio.src = urls[idx++];
          };
          tryNext();
        });

      const durations: number[] = await Promise.all(
        ayahRange.map((ayah: { numberInSurah: number }) => {
          const g   = getGlobalAyahNumber(selectedSurah, ayah.numberInSurah, surahAyahCounts);
          const primary   = `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${g}.mp3`;
          const secondary = `/api/quran/audio/${selectedReciter}/${g}`;
          return loadDuration([primary, secondary]).catch(() => 5);
        })
      );

      // ── Step 2: try to get word-level timing RATIOS from Quran CDN ───────
      // These ratios tell us what fraction of the ayah duration elapses before
      // each word — used to precisely time multi-part ayah segments.
      type WordRatio = number[]; // ratio[k] = fraction of ayah duration before word (k+1)
      let cdnWordRatios: (WordRatio | null)[] | null = null;
      const cdnId = QURAN_CDN_RECITER_MAP[selectedReciter];
      if (cdnId) {
        try {
          const resp = await fetch(
            `https://api.qurancdn.com/api/qdc/audio/reciters/${cdnId}/audio_files?chapter_number=${selectedSurah}&segments=true`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (resp.ok) {
            const data = await resp.json();
            const allTimings: Array<{
              verse_key: string;
              timestamp_from: number;
              timestamp_to: number;
              segments: [number, number, number][];
            }> = data.audio_files?.[0]?.verse_timings ?? [];

            cdnWordRatios = ayahRange.map((ayah: { numberInSurah: number }) => {
              const key = `${selectedSurah}:${ayah.numberInSurah}`;
              const vt  = allTimings.find(t => t.verse_key === key);
              if (!vt?.segments?.length) return null;
              const dur = vt.timestamp_to - vt.timestamp_from;
              if (dur <= 0) return null;
              // ratio[k] = (start_of_word_k_ms_from_ayah_start) / ayah_duration
              return (vt.segments as [number, number, number][]).map(s => s[1] / dur);
            });
          }
        } catch { /* timing ratios optional — fall through to proportional */ }
      }

      // ── Step 3: compute cumulative ayah start times ───────────────────────
      const ayahStarts: number[] = [0];
      for (let i = 1; i < durations.length; i++)
        ayahStarts.push(ayahStarts[i - 1] + durations[i - 1]);

      // ── Step 4: build syncPoints for each segment ─────────────────────────
      const points: number[] = [];
      for (let si = 0; si < syncSegments.length; si++) {
        const seg      = syncSegments[si];
        const ayahStart = ayahStarts[seg.ayahIdx];
        const ayahDur  = durations[seg.ayahIdx];

        if (si === 0) {
          points.push(0);
        } else if (seg.partIdx === 0) {
          points.push(ayahStart);
        } else {
          // Multi-part ayah — find the start ratio of this segment's first word
          const firstWordIdx = seg.partIdx * SYNC_MAX_WORDS; // 0-based word index
          const ratios       = cdnWordRatios?.[seg.ayahIdx];
          let ratio: number;

          if (ratios && firstWordIdx < ratios.length) {
            ratio = ratios[firstWordIdx];
          } else {
            // Fallback: proportional by word count
            const totalWords = (ayahRange[seg.ayahIdx] as { text: string }).text
              .trim().split(/\s+/).filter(Boolean).length;
            ratio = Math.min(firstWordIdx / Math.max(totalWords, 1), 1);
          }
          points.push(ayahStart + ratio * ayahDur);
        }
      }

      // End marker: end of last ayah
      const li = ayahRange.length - 1;
      points.push(ayahStarts[li] + durations[li]);

      setSyncPoints(points);
      setSyncDraft(points);
      syncCursorRef.current = points.length;
      setSyncCursor(points.length);
      setSyncPhase("done");
    } catch (err) {
      setAutoSyncError(err instanceof Error ? err.message : "خطأ في قياس التوقيتات الصوتية");
    } finally {
      setAutoSyncLoading(false);
    }
  };

  const startSync = () => {
    syncCursorRef.current = 0;
    syncPhaseRef.current  = "running";
    ayahStartOffsetsRef.current = [];
    setAutoSyncError("");
    setSyncDraft([]); setSyncCursor(0); setSyncPhase("running");
    if (customAudioFile && customAudioRef.current) {
      customAudioRef.current.currentTime = 0;
      const p = customAudioRef.current.play();
      if (p !== undefined) { p.then(() => setIsAudioPlaying(true)).catch(() => {}); }
      else { setIsAudioPlaying(true); }
    } else {
      syncCdnOffsetRef.current = 0;
      syncCdnAyahIdxRef.current = 0;
      setSyncCdnOffset(0); setSyncCdnCurrentTime(0);
      playCdnAyah(0, 0);
    }
    // cursor stays at 0 so the user sees the first segment immediately.
    // t[0] is forced to 0 inside syncNext when cur===0.
  };

  // syncNext reads everything from refs so it's always fresh — never stale
  const syncNext = () => {
    if (syncPhaseRef.current !== "running") return;
    const isCdnMode = !customAudioFile;

    // ── Advance cursor synchronously via ref to avoid stale closure on rapid taps ──
    const cur  = syncCursorRef.current;
    const next = cur + 1;

    // ── Read current playback time ──
    let time: number;
    if (cur === 0) {
      // Force first segment to start at t=0 regardless of tap delay.
      // This prevents a ~0.3–1s offset that would make all text appear too late.
      time = 0;
    } else if (!isCdnMode && customAudioRef.current) {
      time = customAudioRef.current.currentTime;
    } else {
      const segAyahIdx     = syncSegments[cur]?.ayahIdx ?? 0;
      const playingAyahIdx = syncCdnAyahIdxRef.current;
      if (segAyahIdx === playingAyahIdx) {
        const ayahStart = ayahStartOffsetsRef.current[segAyahIdx] ?? syncCdnOffsetRef.current;
        time = ayahStart + (syncCdnAudioRef.current?.currentTime ?? 0);
      } else {
        // Audio auto-advanced past this ayah — record end of that ayah as the boundary.
        time = ayahStartOffsetsRef.current[playingAyahIdx] ?? syncCdnOffsetRef.current;
      }
    }
    syncCursorRef.current = next;

    setSyncDraft(prev => { const d = [...prev]; d[cur] = time; return d; });
    setSyncCursor(next);

    // In CDN mode: start the next ayah's audio as soon as we cross an ayah boundary.
    // segments[cur] = segment whose start we just recorded
    // segments[next] = segment we're about to record — if it's in a different ayah, start that ayah now.
    if (isCdnMode && next < syncSegments.length) {
      const currAyah = syncSegments[cur]?.ayahIdx ?? 0;
      const nextAyah = syncSegments[next]?.ayahIdx ?? 0;
      if (nextAyah !== currAyah && syncCdnAyahIdxRef.current !== nextAyah) {
        const offset = (ayahStartOffsetsRef.current[syncCdnAyahIdxRef.current] ?? 0)
          + (syncCdnAudioRef.current?.currentTime ?? 0);
        syncCdnOffsetRef.current = offset;
        setSyncCdnOffset(offset);
        playCdnAyah(nextAyah, offset);
      }
    }

    if (next >= totalSyncPoints) {
      syncPhaseRef.current = "done";
      setSyncPhase("done");
      if (customAudioRef.current) { customAudioRef.current.pause(); setIsAudioPlaying(false); }
      stopCdnSyncAudio();
    }
  };

  // Keep syncNextRef always pointing to the latest syncNext
  syncNextRef.current = syncNext;

  const saveSyncModal = () => {
    setSyncPoints(syncDraft);
    closeSyncModal();
  };

  const resetSyncDraft = () => {
    syncCursorRef.current = 0;
    syncPhaseRef.current  = "idle";
    ayahStartOffsetsRef.current = [];
    setSyncDraft([]); setSyncCursor(0); setSyncPhase("idle");
    if (customAudioRef.current) { customAudioRef.current.pause(); customAudioRef.current.currentTime = 0; }
    stopCdnSyncAudio();
    setSyncCdnOffset(0); setSyncCdnCurrentTime(0); setSyncCdnAyahIdx(0);
    syncCdnOffsetRef.current = 0; syncCdnAyahIdxRef.current = 0;
    setIsAudioPlaying(false);
  };

  // Spacebar to advance during sync — uses syncNextRef so we never re-register on every audio tick
  useEffect(() => {
    if (!syncModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        syncNextRef.current(); // always calls the latest syncNext
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [syncModalOpen]); // only re-register when modal opens/closes

  // Computed segments (splits long ayahs into ≤16-word chunks)
  const syncSegments = useMemo(() => computeSyncSegments(ayahRange), [ayahRange]);
  const totalSyncPoints = syncSegments.length + 1; // segments + 1 end marker

  const syncComplete = syncPoints.length >= totalSyncPoints;
  const syncHint = syncPoints.length < totalSyncPoints
    ? `مقطع ${toArabicDigits(syncPoints.length + 1)} من ${toArabicDigits(totalSyncPoints)}`
    : "✓ المزامنة مكتملة";

  const getAudioUrl = (ayahNum: number) => {
    const g = getGlobalAyahNumber(selectedSurah, ayahNum, surahAyahCounts);
    return `/api/quran/audio/${selectedReciter}/${g}`;
  };

  const handlePlayAudio = () => {
    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); return; }
    if (!currentSegment) return;
    const audio = new Audio(getAudioUrl(currentSegment.ayahNum));
    audio.preload = "auto";
    audioRef.current = audio;
    audio.play(); setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
  };

  const stopPlayAll = () => {
    playAllActiveRef.current = false;
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlayingAll(false);
    setIsPlaying(false);
  };

  const handlePlayAll = () => {
    if (isPlayingAll) { stopPlayAll(); return; }
    if (!segmentList.length || !ayahRange.length) return;

    playAllActiveRef.current = true;
    playAllCumRef.current = 0;
    setIsPlayingAll(true);
    setIsPlaying(true);
    setPreviewAyahIndex(0);

    const playAyahAtIdx = (ayahRangeIdx: number) => {
      if (!playAllActiveRef.current) return;
      if (ayahRangeIdx >= ayahRange.length) {
        // Finished all ayahs
        playAllActiveRef.current = false;
        setIsPlayingAll(false);
        setIsPlaying(false);
        setPreviewAyahIndex(0);
        return;
      }

      const ayah = (ayahRange as { numberInSurah: number }[])[ayahRangeIdx];
      const audio = new Audio(getAudioUrl(ayah.numberInSurah));
      audio.preload = "auto";
      audioRef.current = audio;

      // First global segment index for this ayah
      const firstSegGlobalIdx = segmentList.findIndex(s => s.ayahRangeIdx === ayahRangeIdx);
      const ayahSegs = segmentList.filter(s => s.ayahRangeIdx === ayahRangeIdx);
      if (firstSegGlobalIdx >= 0) setPreviewAyahIndex(firstSegGlobalIdx);

      // Only advance sub-segments within the same ayah (for long split ayahs).
      // syncPoints are NOT used here — they come from a different audio source
      // (full-surah CDN recordings) and their timings don't match the per-ayah
      // MP3 files we play in play-all mode, which would cause wrong jumps.
      audio.addEventListener("timeupdate", () => {
        if (!playAllActiveRef.current) return;
        if (ayahSegs.length <= 1) return; // nothing to advance within this ayah
        if (!audio.duration || !isFinite(audio.duration)) return;
        const subIdx = Math.min(
          Math.floor((audio.currentTime / audio.duration) * ayahSegs.length),
          ayahSegs.length - 1,
        );
        setPreviewAyahIndex(Math.min(firstSegGlobalIdx + subIdx, segmentList.length - 1));
      });

      audio.addEventListener("ended", () => {
        if (!playAllActiveRef.current) return;
        playAllCumRef.current += isFinite(audio.duration) ? audio.duration : 0;
        playAyahAtIdx(ayahRangeIdx + 1);
      });

      audio.addEventListener("error", () => stopPlayAll());

      audio.play().catch(() => stopPlayAll());
    };

    playAyahAtIdx(0);
  };

  const handleExportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const filename = `islam-reels-${selectedSurah}-${currentSegment?.ayahNum ?? startAyah}.png`;
    canvas.toBlob(blob => {
      if (!blob) return;
      if (exportedUrl) URL.revokeObjectURL(exportedUrl);
      const url = URL.createObjectURL(blob);
      setExportedBlob(blob); setExportedType("png"); setExportedFilename(filename); setExportedUrl(url);
      setExportStep("done");
      triggerDownload(url, filename);
    }, "image/png");
  };

  const handleStop = () => {
    stopFlagRef.current = true;
    setIsExporting(false); setExportStep("idle"); setExportProgress(0);
  };

  const handleExportClose = () => {
    if (exportedUrl) URL.revokeObjectURL(exportedUrl);
    setExportedUrl(null); setExportedBlob(null); setExportedFilename("");
    setExportStep("idle"); setExportProgress(0);
  };

  // Auto-download on PC & Android (iOS doesn't support programmatic anchor.click downloads)
  const triggerDownload = (url: string, filename: string) => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) return; // iOS: user taps the manual download button instead
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 200);
  };

  const handleDownload = () => {
    if (!exportedUrl || !exportedFilename) return;
    const a = document.createElement("a"); a.href = exportedUrl; a.download = exportedFilename;
    document.body.appendChild(a); a.click(); setTimeout(() => document.body.removeChild(a), 200);
  };

  const handleShare = async (platform?: "whatsapp"|"telegram"|"facebook"|"instagram") => {
    if (!exportedBlob || !exportedFilename) return;
    const mimeType = exportedType === "mp4" ? "video/mp4" : "image/png";
    const file = new File([exportedBlob], exportedFilename, { type: mimeType });
    const shareText = "ريل قرآني من إسلام ريلز 🌙✨";
    const appUrl = window.location.origin;

    if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`, "_blank"); return;
    }
    if (platform === "instagram") {
      window.open("https://www.instagram.com/", "_blank"); return;
    }

    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "إسلام ريلز", text: shareText }); return; } catch {}
    }
    // Fallback for WhatsApp / Telegram desktop
    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + "\n" + appUrl)}`, "_blank");
    } else if (platform === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
    } else {
      handleDownload();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleExportMP4 = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isExporting || !currentSurah) return;
    if (ayahRange.length === 0) return;

    // Stop RAF animation loop immediately — prevents race condition where RAF redraws
    // the canvas between our drawReel() call and toDataURL() capture
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    // Validate custom audio sync if custom audio is set
    if (customAudioFile && syncPoints.length < totalSyncPoints - 1) {
      setExportError(`المزامنة غير مكتملة — حدِّد ${toArabicDigits(totalSyncPoints)} مقطع (محدَّد ${toArabicDigits(syncPoints.length)})`);
      return;
    }

    stopFlagRef.current = false;
    exportStartRef.current = Date.now();
    const exportAyahCount = ayahRange.length;

    // iOS Safari: use lower JPEG quality to reduce payload size and prevent memory exhaustion
    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const frameJpegQuality = isIOSDevice ? 0.45 : 0.82;

    setIsExporting(true); setExportStep("rendering"); setExportError(null); setExportProgress(0);
    setExportDetail(exportAyahCount > 1 ? `جاري تجهيز ${toArabicDigits(exportAyahCount)} آيات للتصدير...` : "جاري تجهيز الآية للتصدير...");

    // Helper: POST JSON and read NDJSON stream, calling onProgress/onResult/onError
    // Falls back to full-text parsing for mobile Safari which may not support streaming
    const parseNdjson = (text: string, onProgress: (p: number, detail: string) => void, onResult: (b64: string) => void) => {
      const lines = text.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        const msg = JSON.parse(line) as { type: string; p?: number; detail?: string; b64?: string; msg?: string };
        if (msg.type === "progress") onProgress(msg.p ?? 0, msg.detail ?? "");
        else if (msg.type === "result") onResult(msg.b64 ?? "");
        else if (msg.type === "error") throw new Error(msg.msg ?? "فشل توليد الفيديو");
      }
    };

    const postAndStream = async (
      body: object,
      onProgress: (p: number, detail: string) => void,
      onResult: (b64: string) => void,
    ) => {
      const resp = await fetch("/api/quran/generate-mp4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `خطأ من الخادم (${resp.status})` }));
        throw new Error(err.error ?? `فشل توليد الفيديو (${resp.status})`);
      }

      // Streaming path (Chrome, Firefox, desktop Safari)
      if (resp.body && typeof resp.body.getReader === "function") {
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const msg = JSON.parse(line) as { type: string; p?: number; detail?: string; b64?: string; msg?: string };
            if (msg.type === "progress") onProgress(msg.p ?? 0, msg.detail ?? "");
            else if (msg.type === "result") onResult(msg.b64 ?? "");
            else if (msg.type === "error") throw new Error(msg.msg ?? "فشل توليد الفيديو");
          }
        }
      } else {
        // Fallback for mobile Safari (iOS < 14.5) — wait for full response then parse
        setExportDetail("جارٍ معالجة الفيديو... (وضع التوافق)");
        const text = await resp.text();
        parseNdjson(text, onProgress, onResult);
      }
    };

    const b64ToBlob = (b64: string, mime: string): Blob => {
      // Process in chunks to avoid OOM on mobile with large MP4 files
      const CHUNK = 65536;
      const parts: Uint8Array[] = [];
      let offset = 0;
      while (offset < b64.length) {
        const slice = b64.slice(offset, offset + CHUNK);
        const binary = atob(slice);
        const chunk = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) chunk[i] = binary.charCodeAt(i);
        parts.push(chunk);
        offset += CHUNK;
      }
      return new Blob(parts, { type: mime });
    };

    try {
      const reciterName = currentReciterName;

      if (customAudioFile) {
        // ── Custom audio mode: one frame per sync segment, duration from sync points ──
        const ayahPayload: { frames: { pngBase64: string; durationSec: number }[] }[] = [];

        for (let i = 0; i < syncSegments.length; i++) {
          if (stopFlagRef.current) return;
          const seg  = syncSegments[i];
          const ayah = ayahRange[seg.ayahIdx];
          const start = syncPoints[i];
          const end   = syncPoints[i + 1] ?? audioDuration;
          const dur   = Math.max(0.5, end - start);

          // Use segment text (already chunked), no need to strip bismillah for non-first parts
          const needsStripCA = seg.isFirst && selectedSurah !== SURAH_NO_BISMILLAH && selectedSurah !== SURAH_BISMILLAH_IS_AYAH && ayah.numberInSurah === 1;
          const baseTextCA = needsStripCA ? stripBismillahPrefix(seg.text) : seg.text;
          const caSegs = splitIntoWordSegments(baseTextCA);

          const bgImg = bgImages[0]?.img ?? null;
          const caFrames: { pngBase64: string; durationSec: number }[] = [];
          for (let si = 0; si < caSegs.length; si++) {
            const segText = caSegs[si];
            const segDur = dur / caSegs.length;
            const CA_STEPS = (bgImg && bgAnimType !== "none") ? 2 : 1;
            const caFrameDur = segDur / CA_STEPS;
            for (let f = 0; f < CA_STEPS; f++) {
              const progress = CA_STEPS > 1 ? f / (CA_STEPS - 1) : 0;
              await drawReel(canvas, segText, currentSurah.name, currentSurah.englishName,
                ayah.numberInSurah, selectedSurah, bgColor1, bgColor2, fontFamily,
                syncSegments.length, i, selectedTemplate, reciterName,
                bgImg, textColor, fontSize, patternType, bgAnimType, progress, drawOpts);
              const caDataUrl = canvas.toDataURL("image/jpeg", frameJpegQuality);
              if (!caDataUrl || caDataUrl.length < 100) throw new Error("فشل رسم الإطار — جرّب تقليل عدد الآيات أو إعادة تحميل الصفحة");
              caFrames.push({ pngBase64: caDataUrl.split(",")[1], durationSec: caFrameDur });
            }
          }
          ayahPayload.push({ frames: caFrames });
          setExportProgress(Math.round(((i + 1) / syncSegments.length) * 40));
        }

        if (stopFlagRef.current) return;
        setExportStep("uploading"); setExportProgress(48); setExportDetail("رفع الملفات إلى الخادم...");

        const customAudioBase64 = await fileToBase64(customAudioFile);
        const customAudioExt    = getAudioExt(customAudioFile);

        let mp4BlobCA: Blob | null = null;
        await postAndStream(
          {
            ayahs: ayahPayload, customAudioBase64, customAudioExt,
            surahNumber: selectedSurah, startAyah, endAyah,
            videoBitrateKbps: VIDEO_QUALITY_OPTIONS.find(q => q.id === videoQuality)?.bitrateKbps ?? 2500,
            fps: FPS_OPTIONS.find(f => f.id === videoFps)?.fps ?? 30,
          },
          (p, detail) => {
            setExportStep("encoding");
            setExportProgress(50 + p * 0.48);
            setExportDetail(detail);
          },
          (b64) => { mp4BlobCA = b64ToBlob(b64, "video/mp4"); },
        );
        if (!mp4BlobCA) throw new Error("لم يُستلم الفيديو من الخادم");
        const fname = `islam-reels-custom-${selectedSurah}-${startAyah}.mp4`;
        if (exportedUrl) URL.revokeObjectURL(exportedUrl);
        const blobUrl = URL.createObjectURL(mp4BlobCA);
        setExportedBlob(mp4BlobCA); setExportedType("mp4"); setExportedFilename(fname); setExportedUrl(blobUrl);
        triggerDownload(blobUrl, fname);

      } else {
        // ── CDN audio mode ─────────────────────────────────────────────
        const ayahPayload: { frames: { pngBase64: string; durationSec: number }[]; globalAyahNum: number }[] = [];
        console.log(`[export-cdn] ayahRange=${ayahRange.length} ayahs: ${ayahRange.map(a => a.numberInSurah).join(',')}`);

        for (let i = 0; i < ayahRange.length; i++) {
          if (stopFlagRef.current) return;
          const ayah = ayahRange[i];
          const globalAyahNum = getGlobalAyahNumber(selectedSurah, ayah.numberInSurah, surahAyahCounts);
          const imgList = bgImages.length > 0 ? bgImages.map(e => e.img) : [null];

          // Split ayah into word segments (max 16 words each)
          const needsStrip = selectedSurah !== SURAH_NO_BISMILLAH && selectedSurah !== SURAH_BISMILLAH_IS_AYAH && ayah.numberInSurah === 1;
          const baseText = needsStrip ? stripBismillahPrefix(ayah.text) : ayah.text;
          const ayahSegs = splitIntoWordSegments(baseText);

          const frames: { pngBase64: string; durationSec: number }[] = [];
          for (const bgImg of imgList) {
            for (let si = 0; si < ayahSegs.length; si++) {
              const segText = ayahSegs[si];
              const segDurFrac = imageDuration / (imgList.length * ayahSegs.length);
              const ANIM_STEPS = (bgImg && bgAnimType !== "none") ? 2 : 1;
              const frameDur = segDurFrac / ANIM_STEPS;
              for (let f = 0; f < ANIM_STEPS; f++) {
                const progress = ANIM_STEPS > 1 ? f / (ANIM_STEPS - 1) : 0;
                await drawReel(canvas, segText, currentSurah.name, currentSurah.englishName,
                  ayah.numberInSurah, selectedSurah, bgColor1, bgColor2, fontFamily,
                  ayahRange.length, i, selectedTemplate, currentReciterName,
                  bgImg, textColor, fontSize, patternType, bgAnimType, progress, drawOpts);
                const frameDataUrl = canvas.toDataURL("image/jpeg", frameJpegQuality);
                if (!frameDataUrl || frameDataUrl.length < 100) throw new Error("فشل رسم الإطار — جرّب تقليل عدد الآيات أو إعادة تحميل الصفحة");
                frames.push({ pngBase64: frameDataUrl.split(",")[1], durationSec: frameDur });
              }
            }
          }
          ayahPayload.push({ frames, globalAyahNum });
          setExportProgress(Math.round(((i + 1) / ayahRange.length) * 40));
        }

        if (!stopFlagRef.current && currentSegment) {
          await drawReel(canvas, currentSegment.text, currentSurah.name, currentSurah.englishName,
            currentSegment.ayahNum, selectedSurah, bgColor1, bgColor2, fontFamily,
            ayahRange.length, currentSegment.ayahRangeIdx, selectedTemplate, currentReciterName,
            currentBgImage, textColor, fontSize, patternType, "none", 0, drawOpts);
        }
        if (stopFlagRef.current) return;

        setExportStep("uploading"); setExportProgress(44); setExportDetail("رفع الإطارات إلى الخادم...");

        let mp4BlobCDN: Blob | null = null;
        await postAndStream(
          {
            ayahs: ayahPayload, reciter: selectedReciter, surahNumber: selectedSurah, startAyah, endAyah,
            videoBitrateKbps: VIDEO_QUALITY_OPTIONS.find(q => q.id === videoQuality)?.bitrateKbps ?? 2500,
            fps: FPS_OPTIONS.find(f => f.id === videoFps)?.fps ?? 30,
          },
          (p, detail) => {
            setExportStep("encoding");
            setExportProgress(46 + p * 0.52);
            setExportDetail(detail);
          },
          (b64) => { mp4BlobCDN = b64ToBlob(b64, "video/mp4"); },
        );
        if (!mp4BlobCDN) throw new Error("لم يُستلم الفيديو من الخادم");
        const fname = ayahRange.length === 1
          ? `islam-reels-${selectedSurah}-${startAyah}.mp4`
          : `islam-reels-${selectedSurah}-${startAyah}-${endAyah}.mp4`;
        if (exportedUrl) URL.revokeObjectURL(exportedUrl);
        const blobUrl = URL.createObjectURL(mp4BlobCDN);
        setExportedBlob(mp4BlobCDN); setExportedType("mp4"); setExportedFilename(fname); setExportedUrl(blobUrl);
        triggerDownload(blobUrl, fname);
      }

      setExportProgress(100); setExportStep("done");
    } catch (err) {
      if (!stopFlagRef.current) {
        let msg = "حدث خطأ غير متوقع";
        if (err instanceof Error) {
          if (err.name === "TypeError" && err.message.toLowerCase().includes("network")) {
            msg = "خطأ في الشبكة — تحقق من الاتصال وحاول مجدداً";
          } else if (err.name === "AbortError") {
            msg = "انتهت مهلة الطلب — جرّب آية واحدة فقط";
          } else {
            msg = err.message;
          }
        }
        setExportError(msg);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const maxAyahs = currentSurah?.numberOfAyahs ?? 1;

  const [displayW, setDisplayW] = useState(280);
  const displayH = CANVAS_H * (displayW / CANVAS_W);

  useEffect(() => {
    const update = () => {
      // header≈40, sub-header≈36, padding≈32, controls≈48, gaps≈16
      const isMob = window.innerWidth < 1024;
      const overhead = 40 + 36 + 32 + 48 + 16 + (isMob ? 56 : 0);
      const maxH = Math.max(260, window.innerHeight - overhead);
      const h = Math.min(540, maxH);
      setDisplayW(Math.round(h * CANVAS_W / CANVAS_H));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div dir="rtl" className="h-screen overflow-hidden bg-[#0a0a0a] text-white flex flex-col" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* ─── Top bar ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-2 border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/15 hover:bg-white/10 hover:border-[#c9a84c]/40 flex items-center justify-center transition"
            title="الرئيسية">
            <Home className="w-4 h-4 text-white/60" />
          </button>
          <img
            src={`${import.meta.env.BASE_URL}icon-96.png`}
            alt="إسلام ريلز"
            className="w-9 h-9 rounded-xl"
          />
          <div>
            <h1 className="text-lg font-bold text-[#c9a84c] leading-none">إسلام ريلز</h1>
            <p className="text-xs text-white/40">Islam Reels</p>
          </div>
        </div>
      </header>

      {/* ── Sub-header: footer moved under logo ──────────────────────── */}
      <div className="border-b border-white/8 bg-[#0d0d0d]/80 px-4 h-9 flex items-center justify-between flex-shrink-0" dir="rtl">
        {/* Right: contact label + social icons */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/35 font-medium whitespace-nowrap" style={{ fontFamily: "Cairo, sans-serif" }}>
            للتواصل مع مطور الأداة:
          </span>
          <div className="w-px h-4 bg-white/10" />
          <a href="#" title="واتساب" className="w-6 h-6 rounded-md bg-white/6 hover:bg-[#25d366]/25 border border-white/8 hover:border-[#25d366]/40 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.531 5.845L.057 23.882l6.186-1.453A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.056-1.397l-.361-.214-3.742.879.936-3.639-.235-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
          </a>
          <a href="#" title="انستغرام" className="w-6 h-6 rounded-md bg-white/6 hover:bg-[#e1306c]/25 border border-white/8 hover:border-[#e1306c]/40 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></svg>
          </a>
          <a href="#" title="فيسبوك" className="w-6 h-6 rounded-md bg-white/6 hover:bg-[#1877f2]/25 border border-white/8 hover:border-[#1877f2]/40 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="#" title="لينكدإن" className="w-6 h-6 rounded-md bg-white/6 hover:bg-[#0077b5]/25 border border-white/8 hover:border-[#0077b5]/40 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
        </div>

        {/* Left: only animated dua text */}
        <div className="relative overflow-hidden flex-1 mx-6 h-full flex items-center" dir="ltr">
          <div className="ticker-track flex whitespace-nowrap will-change-transform text-xs">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="inline-flex items-center gap-3 mx-6" style={{ fontFamily: "Cairo, sans-serif" }}>
                <span className="text-[#c9a84c] font-bold">🤲 لاتنسونا من صالح دعائكم</span>
                <span className="text-white/20">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile overlay — tap outside to close sidebar */}
        {mobileTab !== "preview" && (
          <div className="absolute inset-0 z-20 bg-black/60 lg:hidden"
            onClick={() => setMobileTab("preview")} />
        )}

        {/* ── Right sidebar ─── السورة والقارئ + الصوت ─────────────── */}
        <aside className={`
          absolute top-0 right-0 h-full z-30 lg:static lg:z-auto
          w-72 bg-[#111] border-l border-white/10 overflow-y-auto flex flex-col
          transition-transform duration-300 ease-in-out
          ${(mobileTab === "surah" || mobileTab === "audio") ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}>

          {/* ١. السورة + الآيات + القارئ — Accordion */}
          <div className="border-b border-white/8">
            <button onClick={() => setSurahOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#c9a84c] tracking-wider">١. السورة والقارئ</h3>
                {currentSurah && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#c9a84c]/20 text-[#c9a84c]">
                    {currentSurah.name}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-[#c9a84c]/70 transition-transform ${surahOpen ? "rotate-180" : ""}`} />
            </button>

            {surahOpen && (
              <div className="px-4 pb-4 space-y-3">
                {/* السورة */}
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">السورة</label>
                  {surahsLoading ? <LoadingSpinner /> : (
                    <select value={selectedSurah} onChange={e => setSelectedSurah(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm">
                      {(surahs ?? []).map(s => (
                        <option key={s.number} value={s.number} className="bg-[#1a1a1a]">
                          {toArabicDigits(s.number)}. {s.name} — {s.englishName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* نطاق الآيات */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-white/50 mb-1 block">من الآية</label>
                    <input
                      type="number" min={1} max={maxAyahs} value={startAyah}
                      onChange={e => {
                        const v = Math.max(1, Math.min(maxAyahs, Number(e.target.value) || 1));
                        setStartAyah(v);
                        if (endAyah < v) setEndAyah(v);
                      }}
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm text-center focus:border-[#c9a84c]/60 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end pb-2 text-white/30 text-sm">←</div>
                  <div className="flex-1">
                    <label className="text-xs text-white/50 mb-1 block">إلى الآية</label>
                    <input
                      type="number" min={startAyah} max={Math.min(maxAyahs, startAyah + MAX_AYAHS_VIDEO - 1)} value={endAyah}
                      onChange={e => {
                        const v = Math.max(startAyah, Math.min(Math.min(maxAyahs, startAyah + MAX_AYAHS_VIDEO - 1), Number(e.target.value) || startAyah));
                        setEndAyah(v);
                      }}
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm text-center focus:border-[#c9a84c]/60 focus:outline-none"
                    />
                  </div>
                </div>
                {/* عداد الآيات المختارة */}
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-white/35">
                    {totalAyahsInRange > 1
                      ? `${toArabicDigits(totalAyahsInRange)} آيات مختارة للمعاينة والتصدير`
                      : "آية واحدة مختارة"}
                  </span>
                  {maxAyahs > 1 && totalAyahsInRange < Math.min(maxAyahs, MAX_AYAHS_VIDEO) && (
                    <button
                      onClick={() => { setStartAyah(1); setEndAyah(Math.min(maxAyahs, MAX_AYAHS_VIDEO)); }}
                      className="text-xs text-[#c9a84c]/70 hover:text-[#c9a84c] transition">
                      تحديد الكل
                    </button>
                  )}
                </div>

                {/* القارئ */}
                {!customAudioFile && (
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">القارئ</label>
                    <select value={selectedReciter} onChange={e => setSelectedReciter(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm">
                      {RECITERS.map(r => (
                        <option key={r.id} value={r.id} className="bg-[#1a1a1a]">{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* معاينة نص القطعة الحالية */}
                {currentSegment && (
                  <div className="bg-white/5 rounded-lg p-2 text-right">
                    <p className="text-xs text-white/90 leading-relaxed" style={{ fontFamily }}>
                      {currentSegment.text.slice(0, 80)}{currentSegment.text.length > 80 ? "..." : ""}
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      {currentSurah?.name} • الآية {toArabicDigits(currentSegment.ayahNum)}
                      {currentSegment.totalSegs > 1 && <> · جزء {toArabicDigits(currentSegment.segIdx + 1)}/{toArabicDigits(currentSegment.totalSegs)}</>}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>


          {/* ── مزامنة الآيات — تظهر فقط عند الصوت المخصص أو الآيات الكبيرة */}
          {showSyncSection && (
            <div className="px-4 py-3 border-b border-white/8">
              <button
                onClick={openSyncModal}
                className="w-full flex items-center justify-between gap-3 bg-[#c9a84c]/10 hover:bg-[#c9a84c]/18 border border-[#c9a84c]/30 hover:border-[#c9a84c]/60 rounded-xl px-4 py-3 transition group">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🎛️</span>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-[#c9a84c]">مزامنة الآيات يدوياً</p>
                    {syncComplete ? (
                      <p className="text-[10px] text-green-400">✓ مكتملة — {toArabicDigits(syncPoints.length)} مقطع</p>
                    ) : syncPoints.length > 0 ? (
                      <p className="text-[10px] text-yellow-400">{toArabicDigits(syncPoints.length)} / {toArabicDigits(totalSyncPoints)} مقطع</p>
                    ) : customAudioFile ? (
                      <p className="text-[10px] text-white/35">{toArabicDigits(totalSyncPoints)} مقطع للمزامنة</p>
                    ) : (
                      <p className="text-[10px] text-white/35">لضبط توقيت الأجزاء يدوياً</p>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#c9a84c]/60 -rotate-90 group-hover:text-[#c9a84c] transition" />
              </button>
            </div>
          )}

          {/* ٤. الصوت المخصص — Accordion */}
          <div className="border-b border-white/8">
            <button onClick={() => setAudioOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#c9a84c] tracking-wider">٤. الصوت المخصص</h3>
                {customAudioFile && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${syncComplete ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {syncComplete ? "✓ جاهز" : "يحتاج مزامنة"}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-[#c9a84c]/70 transition-transform ${audioOpen ? "rotate-180" : ""}`} />
            </button>

            {audioOpen && (
              <div className="px-4 pb-4 space-y-3">
                <input
                  ref={audioInputRef}
                  type="file"
                  accept=".mp3,.m4a,.aac,.wav,.ogg,.opus,.flac,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/flac"
                  className="hidden"
                  onChange={handleAudioUpload}
                />

                {!customAudioFile ? (
                  <button onClick={() => audioInputRef.current?.click()}
                    className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-[#c9a84c]/50 rounded-lg px-3 py-3 text-white/50 text-xs transition">
                    <Upload className="w-4 h-4" />
                    رفع ملف صوتي (MP3 / WAV / AAC)
                  </button>
                ) : (
                  <div className="space-y-3">

                    {/* File info */}
                    <div className="flex items-center gap-2 bg-white/5 border border-[#c9a84c]/30 rounded-lg px-3 py-2">
                      <Music className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
                      <span className="text-xs text-white/70 flex-1 truncate">{customAudioFile.name}</span>
                      <button onClick={() => setShowAudioEditor(true)}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#c9a84c] hover:text-[#d4b660] bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 border border-[#c9a84c]/30 rounded-md px-2 py-0.5 transition flex-shrink-0">
                        ✂️ تحرير
                      </button>
                      <button onClick={clearCustomAudio} className="text-white/30 hover:text-red-400 transition flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Player */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <button onClick={toggleCustomAudioPlay}
                          className="w-8 h-8 rounded-full bg-[#c9a84c]/20 hover:bg-[#c9a84c]/30 border border-[#c9a84c]/50 flex items-center justify-center text-[#c9a84c] transition flex-shrink-0">
                          {isAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <div ref={progressBarRef} onClick={handleSeek}
                          className="flex-1 bg-white/10 rounded-full h-2 cursor-pointer relative">
                          <div className="bg-[#c9a84c] h-2 rounded-full transition-all"
                            style={{ width: audioDuration ? `${(audioCurrentTime / audioDuration) * 100}%` : "0%" }} />
                          {/* Sync point markers */}
                          {syncPoints.map((pt, idx) => (
                            <div key={idx}
                              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-400 border border-black"
                              style={{ left: `${audioDuration ? (pt / audioDuration) * 100 : 0}%`, transform: "translate(-50%, -50%)" }} />
                          ))}
                        </div>
                        <span className="text-[10px] text-white/40 tabular-nums flex-shrink-0 w-12 text-left">
                          {formatTime(audioCurrentTime)} / {formatTime(audioDuration)}
                        </span>
                      </div>
                    </div>

                    {/* Custom reciter name */}
                    <div>
                      <label className="block text-[10px] text-white/50 mb-1">اسم القارئ (يظهر على الريل)</label>
                      <input
                        type="text"
                        value={customReciterName}
                        onChange={e => setCustomReciterName(e.target.value)}
                        placeholder="مثال: الشيخ عبدالباسط عبدالصمد"
                        dir="rtl"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 transition"
                      />
                    </div>

                  </div>
                )}

              </div>
            )}
          </div>

          {/* ٣. إعدادات الخط — Right sidebar */}
          <div className="border-b border-white/8">
            <button onClick={() => setFontOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition">
              <h3 className="text-xs font-bold text-[#c9a84c] tracking-wider">٣. إعدادات الخط</h3>
              <ChevronDown className={`w-4 h-4 text-[#c9a84c]/70 transition-transform ${fontOpen ? "rotate-180" : ""}`} />
            </button>
            {fontOpen && (
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">نوع الخط</label>
                  <select value={fontFamily} onChange={e => setFontFamily(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm">
                    {FONT_OPTIONS.map(f => (
                      <option key={f.id} value={f.id} className="bg-[#1a1a1a]" style={{ fontFamily: f.id }}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">لون النص</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                      className="w-10 h-8 rounded-md border border-white/20 cursor-pointer bg-transparent" />
                    <div className="flex gap-2 flex-wrap">
                      {["#ffffff","#c9a84c","#fbbf24","#86efac","#93c5fd","#f9a8d4"].map(c => (
                        <button key={c} onClick={() => setTextColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition ${textColor === c ? "border-white scale-110" : "border-transparent hover:border-white/50"}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-white/50">حجم الخط</label>
                    <span className="text-xs text-[#c9a84c] font-bold">{fontSize}px</span>
                  </div>
                  <input type="range" min={40} max={100} step={2} value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))}
                    className="w-full accent-[#c9a84c]" />
                  <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
                    <span>صغير</span><span>كبير</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </aside>

        {/* ── Center: Canvas ────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] p-3 gap-3 overflow-hidden">

          {/* Export Modal */}

          {bgImages.length > 1 && (
            <div className="flex items-center gap-2">
              {bgImages.map((_, idx) => (
                <button key={idx} onClick={() => setAnimBgIdx(idx)}
                  className={`transition-all rounded-full ${animBgIdx === idx ? "w-4 h-4 bg-[#c9a84c]" : "w-2.5 h-2.5 bg-white/25 hover:bg-white/50"}`} />
              ))}
              <span className="text-xs text-white/30 mr-1">صورة {animBgIdx + 1}/{bgImages.length}</span>
            </div>
          )}

          <div className="relative" style={{ width: displayW }}>
            <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
              style={{ width: displayW, height: displayH, borderRadius: 16, boxShadow: "0 0 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,168,76,0.2)" }} />
            {ayahsLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                <LoadingSpinner />
              </div>
            )}
            {segmentList.length > 1 && (
              <>
                <button onClick={() => setPreviewAyahIndex(Math.max(0, previewAyahIndex - 1))} disabled={previewAyahIndex === 0 || !currentSegment}
                  className="absolute top-1/2 right-full -translate-y-1/2 mr-3 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center disabled:opacity-30 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => setPreviewAyahIndex(Math.min(segmentList.length - 1, previewAyahIndex + 1))} disabled={previewAyahIndex >= segmentList.length - 1}
                  className="absolute top-1/2 left-full -translate-y-1/2 ml-3 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center disabled:opacity-30 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Play-all button — multiple ayahs */}
            {segmentList.length > 1 ? (
              <button onClick={handlePlayAll} disabled={!previewAyah}
                className="flex items-center gap-2 text-white text-xs px-4 py-2 rounded-full disabled:opacity-40 transition"
                style={isPlayingAll
                  ? { background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.5)", color: "#c9a84c" }
                  : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                {isPlayingAll ? <><Square className="w-3.5 h-3.5 fill-current" /> إيقاف</> : <><Play className="w-3.5 h-3.5" /> تشغيل الكل</>}
              </button>
            ) : (
              <button onClick={handlePlayAudio} disabled={!previewAyah}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs px-4 py-2 rounded-full disabled:opacity-40 transition">
                {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {isPlaying ? "إيقاف" : "استماع"}
              </button>
            )}
            {segmentList.length > 1 && currentSegment && (
              <span className="text-xs text-white/40">
                آية {toArabicDigits(currentSegment.ayahNum)}
                {currentSegment.totalSegs > 1 && <> · جزء {toArabicDigits(currentSegment.segIdx + 1)}/{toArabicDigits(currentSegment.totalSegs)}</>}
                <span className="text-white/25"> ({toArabicDigits(previewAyahIndex + 1)}/{toArabicDigits(segmentList.length)})</span>
              </span>
            )}
            <span className="text-xs text-white/30">1080 × 1920 • 9:16</span>
          </div>
        </main>

        {/* ── Left sidebar ─── القالب والخلفية + إعدادات الخط ─────────── */}
        <aside className={`
          absolute top-0 left-0 h-full z-30 lg:static lg:z-auto
          w-72 bg-[#111] border-r border-white/10 overflow-y-auto flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileTab === "design" ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>

          {/* ٢. القالب والخلفية — Accordion */}
          <div className="border-b border-white/8">
            <button onClick={() => setDesignOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#c9a84c] tracking-wider">٢. القالب والخلفية</h3>
                {bgImages.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#c9a84c]/20 text-[#c9a84c]">
                    {toArabicDigits(bgImages.length)} صور
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-[#c9a84c]/70 transition-transform ${designOpen ? "rotate-180" : ""}`} />
            </button>

            {designOpen && (
              <div className="px-4 pb-4 space-y-4">

                {/* القالب */}
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">القالب</label>
                  <div className="relative">
                    <select
                      value={selectedTheme}
                      onChange={e => applyTheme(e.target.value)}
                      className="w-full bg-[#1a1a2e] border border-[#c9a84c]/40 rounded-xl px-3 py-2.5 text-white text-sm font-bold appearance-none cursor-pointer focus:outline-none focus:border-[#c9a84c] transition-colors pr-8"
                      style={{ direction: "rtl" }}
                    >
                      <option value="" disabled className="bg-[#1a1a2e] text-white/40">— اختر قالباً —</option>
                      {TEMPLATES.map(t => (
                        <option key={t.id} value={t.id} className="bg-[#1a1a2e] text-white font-bold">
                          {t.emoji}  {t.name}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#c9a84c] text-xs">▼</span>
                  </div>
                </div>

                {/* نمط الزخرفة */}
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">نمط الزخرفة</label>
                  <div className="relative">
                    <select
                      value={patternType}
                      onChange={e => setPatternType(e.target.value)}
                      className="w-full bg-[#1a1a2e] border border-[#c9a84c]/40 rounded-xl px-3 py-2.5 text-white text-sm font-bold appearance-none cursor-pointer focus:outline-none focus:border-[#c9a84c] transition-colors pr-8"
                      style={{ direction: "rtl" }}
                    >
                      {PATTERNS.map(p => (
                        <option key={p.id} value={p.id} className="bg-[#1a1a2e] text-white font-bold">
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#c9a84c] text-xs">▼</span>
                  </div>
                </div>

                {/* صور الخلفية */}
                <div>
                  <label className="text-xs text-white/50 mb-2 block">صور الخلفية</label>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagesUpload} />

                  {bgImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {bgImages.map((entry, idx) => (
                        <div key={idx}
                          className={`relative rounded-lg overflow-hidden border-2 transition ${animBgIdx === idx ? "border-[#c9a84c]" : "border-white/15"}`}
                          style={{ aspectRatio: "9/16" }}>
                          <img src={entry.objUrl} alt="" className="w-full h-full object-cover" />
                          <div className="absolute top-0.5 right-0.5 bg-black/60 rounded-full text-[9px] text-[#c9a84c] font-bold w-4 h-4 flex items-center justify-center">
                            {idx + 1}
                          </div>
                          <button onClick={() => removeImage(idx)}
                            className="absolute top-0.5 left-0.5 bg-black/60 hover:bg-red-600 rounded-full p-0.5 transition">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                      {bgImages.length < MAX_BG_IMAGES && (
                        <button onClick={() => fileInputRef.current?.click()}
                          className="rounded-lg border-2 border-dashed border-white/20 hover:border-[#c9a84c]/50 flex items-center justify-center bg-white/3 hover:bg-white/8 transition"
                          style={{ aspectRatio: "9/16" }}>
                          <Plus className="w-5 h-5 text-white/30" />
                        </button>
                      )}
                    </div>
                  )}

                  {bgImages.length === 0 && (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-[#c9a84c]/50 rounded-lg px-3 py-2.5 text-white/50 text-xs transition mb-3">
                      <Upload className="w-4 h-4" />
                      رفع صور خلفية (حتى {MAX_BG_IMAGES} صور)
                    </button>
                  )}

                  {/* نوع الأنيميشن */}
                  {bgImages.length > 0 && (
                    <div className="mb-3">
                      <label className="text-xs text-white/50 mb-1.5 block">حركة الصورة</label>
                      <select value={bgAnimType} onChange={e => setBgAnimType(e.target.value)}
                        className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:border-[#c9a84c]/60 focus:outline-none">
                        {BG_ANIMATIONS.map(a => (
                          <option key={a.id} value={a.id} className="bg-[#1a1a1a]">{a.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {bgImages.length > 1 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-white/50">مدة كل صورة</label>
                        <span className="text-xs text-[#c9a84c] font-bold">{imageDuration}ث</span>
                      </div>
                      <input type="range" min={2} max={15} step={1} value={imageDuration}
                        onChange={e => setImageDuration(Number(e.target.value))}
                        className="w-full accent-[#c9a84c]" />
                      <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
                        <span>٢ث</span><span>١٥ث</span>
                      </div>
                    </div>
                  )}

                  {/* ألوان الخلفية */}
                  <div className="space-y-2">
                    {/* خلفية 1 */}
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">خلفية 1</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={bgColor1}
                          onChange={e => {
                            const v = e.target.value;
                            setBgColor1(v.startsWith("#") ? v : "#" + v);
                          }}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-right focus:outline-none focus:border-[#c9a84c]/50 transition font-mono"
                          maxLength={7}
                          dir="ltr"
                        />
                        <label className="relative cursor-pointer flex-shrink-0">
                          <input type="color" value={bgColor1} onChange={e => setBgColor1(e.target.value)}
                            className="sr-only" />
                          <div className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-inner transition hover:border-[#c9a84c]/60"
                            style={{ backgroundColor: bgColor1 }} />
                        </label>
                      </div>
                    </div>

                    {/* خلفية 2 */}
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">خلفية 2</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={bgColor2}
                          onChange={e => {
                            const v = e.target.value;
                            setBgColor2(v.startsWith("#") ? v : "#" + v);
                          }}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-right focus:outline-none focus:border-[#c9a84c]/50 transition font-mono"
                          maxLength={7}
                          dir="ltr"
                        />
                        <label className="relative cursor-pointer flex-shrink-0">
                          <input type="color" value={bgColor2} onChange={e => setBgColor2(e.target.value)}
                            className="sr-only" />
                          <div className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-inner transition hover:border-[#c9a84c]/60"
                            style={{ backgroundColor: bgColor2 }} />
                        </label>
                      </div>
                    </div>

                    {/* إظهار + كثافة الزخرفة */}
                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                        <div onClick={() => setShowBgOverlay(p => !p)}
                          className={`relative w-9 h-5 rounded-full transition-colors ${showBgOverlay ? "bg-[#c9a84c]" : "bg-white/10"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showBgOverlay ? "right-0.5" : "left-0.5"}`} />
                        </div>
                        <span className="text-xs text-white/70">إظهار</span>
                      </label>
                      <div className="flex-1 flex items-center gap-2">
                        <input type="range" min={0} max={100} step={1} value={bgOpacity}
                          onChange={e => setBgOpacity(Number(e.target.value))}
                          disabled={!showBgOverlay}
                          className="flex-1 accent-[#c9a84c] disabled:opacity-30" />
                        <span className="text-xs text-[#c9a84c] font-bold w-9 text-left flex-shrink-0">
                          {bgOpacity}%
                        </span>
                        <span className="text-xs text-white/40 flex-shrink-0">كثافة الزخرفة</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* ٥. إعدادات العرض — Left sidebar */}
          <div className="border-b border-white/8">
            <button onClick={() => setDisplayOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition">
              <h3 className="text-xs font-bold text-[#c9a84c] tracking-wider">٥. إعدادات العرض</h3>
              <ChevronDown className={`w-4 h-4 text-[#c9a84c]/70 transition-transform ${displayOpen ? "rotate-180" : ""}`} />
            </button>
            {displayOpen && (
              <div className="px-4 pb-4 space-y-3">
                {/* Toggle rows */}
                {([
                  ["اسم السورة بالعربي",  showSurahName,   setShowSurahName],
                  ["اسم القارئ",          showReciterName, setShowReciterName],
                  ["رقم الآية (الدائرة)", showBadge,       setShowBadge],
                ] as [string, boolean, (v: boolean) => void][]).map(([label, val, set]) => (
                  <label key={label} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-white/70 group-hover:text-white/90 transition">{label}</span>
                    <div onClick={() => set(!val)}
                      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${val ? "bg-[#c9a84c]" : "bg-white/10"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${val ? "right-0.5" : "left-0.5"}`} />
                    </div>
                  </label>
                ))}

                {/* Watermark */}
                <div className="pt-1 border-t border-white/8 space-y-2">
                  <label className="block text-[10px] text-white/50">توقيع / علامة مائية</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={e => setWatermarkText(e.target.value)}
                    placeholder="مثال: @قرآني.reels"
                    dir="rtl"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ٦. التصدير — Left sidebar */}
          <div className="border-b border-white/8">
            <button onClick={() => setExportOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition">
              <h3 className="text-xs font-bold text-[#c9a84c] tracking-wider">٦. التصدير</h3>
              <ChevronDown className={`w-4 h-4 text-[#c9a84c]/70 transition-transform ${exportOpen ? "rotate-180" : ""}`} />
            </button>
            {exportOpen && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-[11px] text-white/40 leading-relaxed">
                  PNG للصورة الثابتة · MP4 فيديو مع التلاوة
                </p>

                {/* Quality + FPS side by side */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1.5">جودة الفيديو</label>
                    <select
                      value={videoQuality}
                      onChange={e => setVideoQuality(e.target.value as typeof videoQuality)}
                      className="w-full bg-white/8 border border-white/12 text-white text-xs font-bold rounded-xl px-2.5 py-2 appearance-none cursor-pointer focus:outline-none focus:border-[#c9a84c]/60 hover:border-white/20 transition"
                      style={{ direction: "rtl" }}>
                      {VIDEO_QUALITY_OPTIONS.map(q => (
                        <option key={q.id} value={q.id} className="bg-[#1a1a2e]">
                          {q.label} — {q.sublabel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 mb-1.5">معدل الإطارات</label>
                    <select
                      value={videoFps}
                      onChange={e => setVideoFps(e.target.value as typeof videoFps)}
                      className="w-full bg-white/8 border border-white/12 text-white text-xs font-bold rounded-xl px-2.5 py-2 appearance-none cursor-pointer focus:outline-none focus:border-[#c9a84c]/60 hover:border-white/20 transition"
                      style={{ direction: "rtl" }}>
                      {FPS_OPTIONS.map(f => (
                        <option key={f.id} value={f.id} className="bg-[#1a1a2e]">
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleExportImage}
                  disabled={!previewAyah || isExporting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 border-[#c9a84c]/60 bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 text-[#c9a84c] transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <ImageIcon className="w-4 h-4" />
                  تصدير PNG
                </button>
                <button
                  onClick={handleExportMP4}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <Film className="w-4 h-4" />
                  تصدير MP4
                  <span className="text-[10px] text-white/40 font-normal">مع تلاوة</span>
                </button>
                {isExporting && (
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <div className="w-3 h-3 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
                    {exportStep}… {exportProgress > 0 && `${exportProgress}%`}
                  </div>
                )}
              </div>
            )}
          </div>

        </aside>

      </div>


      {/* ── Export Modal ────────────────────────────────────────────────── */}
      {(isExporting || exportStep === "done" || exportError) && (() => {
        const RADIUS = 52, CIRC = 2 * Math.PI * RADIUS;
        const dash = CIRC - (exportProgress / 100) * CIRC;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md" dir="rtl">
            <div className={`relative bg-[#111] border border-white/12 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] ${exportStep === "done" ? "p-5 w-[360px] max-h-[90vh] overflow-y-auto" : "p-8 w-[340px] text-center"}`}>

              {/* error state */}
              {exportError ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">حدث خطأ</h3>
                  <p className="text-red-400/80 text-sm leading-relaxed mb-6">{exportError}</p>
                  <button onClick={() => setExportError(null)}
                    className="px-8 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-bold transition">
                    إغلاق
                  </button>
                </>

              /* done state */
              ) : exportStep === "done" ? (
                <div className="w-full" dir="rtl">
                  {/* Header */}
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎬</div>
                    <h3 className="text-white font-bold text-xl leading-tight">
                      {exportedType === "mp4" ? "الفيديو جاهز! ✨" : "الصورة جاهزة! ✨"}
                    </h3>
                    {exportedBlob && (
                      <p className="text-white/40 text-xs mt-1">
                        {formatBytes(exportedBlob.size)} &nbsp;·&nbsp; {exportedType === "mp4" ? "MP4" : "PNG"}
                      </p>
                    )}
                  </div>

                  {/* Media preview */}
                  {exportedUrl && exportedType === "mp4" && (
                    <video
                      src={exportedUrl}
                      controls
                      playsInline
                      className="w-full rounded-2xl bg-black mb-4 max-h-52 object-contain"
                    />
                  )}
                  {exportedUrl && exportedType === "png" && (
                    <img
                      src={exportedUrl}
                      alt="preview"
                      className="w-full rounded-2xl mb-4 max-h-52 object-contain bg-black"
                    />
                  )}

                  {/* Save / Share primary button */}
                  <button
                    onClick={() => handleShare()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-base transition mb-4 shadow-lg shadow-green-900/40">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
                    </svg>
                    حفظ / مشاركة
                  </button>

                  {/* Social share row */}
                  <p className="text-white/35 text-xs text-center mb-2.5">شارك على</p>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {/* Instagram */}
                    <button onClick={() => handleShare("instagram")}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-[#e1306c]/12 hover:bg-[#e1306c]/25 border border-[#e1306c]/25 transition group">
                      <svg className="w-5 h-5 text-[#e1306c]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span className="text-[10px] text-white/60">انستجرام</span>
                    </button>
                    {/* Facebook */}
                    <button onClick={() => handleShare("facebook")}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-[#1877f2]/12 hover:bg-[#1877f2]/25 border border-[#1877f2]/25 transition">
                      <svg className="w-5 h-5 text-[#1877f2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="text-[10px] text-white/60">فيسبوك</span>
                    </button>
                    {/* Telegram */}
                    <button onClick={() => handleShare("telegram")}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-[#0088cc]/12 hover:bg-[#0088cc]/25 border border-[#0088cc]/25 transition">
                      <svg className="w-5 h-5 text-[#0088cc]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      <span className="text-[10px] text-white/60">تيليجرام</span>
                    </button>
                    {/* WhatsApp */}
                    <button onClick={() => handleShare("whatsapp")}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-[#25d366]/12 hover:bg-[#25d366]/25 border border-[#25d366]/25 transition">
                      <svg className="w-5 h-5 text-[#25d366]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span className="text-[10px] text-white/60">واتساب</span>
                    </button>
                  </div>

                  {/* Open in new tab */}
                  {exportedUrl && (
                    <a href={exportedUrl} target="_blank" rel="noopener noreferrer"
                      className="block w-full text-center text-[#c9a84c] hover:text-[#d4b660] text-sm font-bold py-2.5 rounded-xl border border-[#c9a84c]/20 hover:border-[#c9a84c]/40 transition mb-3">
                      ↗ فتح في تبويب جديد
                    </a>
                  )}

                  {/* Close */}
                  <button onClick={handleExportClose}
                    className="w-full py-2.5 rounded-xl border border-white/12 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-bold transition">
                    إغلاق
                  </button>
                </div>

              /* progress state */
              ) : (() => {
                void exportTick; // causes re-render every second via the tick state
                const elapsed = (Date.now() - exportStartRef.current) / 1000;
                const remaining = exportProgress > 3
                  ? Math.max(0, Math.round((elapsed / exportProgress) * (100 - exportProgress)))
                  : null;
                const fmtTime = (s: number) =>
                  s >= 60 ? `${Math.floor(s / 60)}د ${s % 60}ث` : `${s}ث`;
                const stepLabel =
                  exportStep === "rendering" ? "تصيير الإطارات" :
                  exportStep === "uploading"  ? "رفع الملفات" :
                  exportStep === "encoding"   ? "معالجة FFmpeg" : "جاري التصدير";
                return (
                  <>
                    {/* circular progress */}
                    <div className="relative w-36 h-36 mx-auto mb-5">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                        <circle cx="60" cy="60" r={RADIUS} fill="none"
                          stroke="#c9a84c" strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={CIRC}
                          strokeDashoffset={dash}
                          style={{ transition: "stroke-dashoffset 0.6s ease" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Film className="w-5 h-5 text-[#c9a84c] mb-1" />
                        <span className="text-2xl font-extrabold text-white leading-none">{Math.round(exportProgress)}%</span>
                      </div>
                    </div>

                    {/* step + remaining */}
                    <h3 className="text-white font-bold text-base mb-1">{stepLabel}</h3>
                    {remaining !== null && (
                      <p className="text-[#c9a84c]/80 text-sm font-bold mb-1">
                        الوقت المتبقي: {fmtTime(remaining)}
                      </p>
                    )}
                    {exportDetail && (
                      <p className="text-white/40 text-xs mb-5 px-4 leading-relaxed">{exportDetail}</p>
                    )}
                    {!exportDetail && (
                      <p className="text-white/40 text-xs mb-5">
                        {exportStep === "rendering" ? "يتم رسم الإطارات…" : "يتم المعالجة بالخادم…"}
                      </p>
                    )}

                    {/* progress bar */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-5">
                      <div className="h-full bg-[#c9a84c] rounded-full transition-all duration-500"
                        style={{ width: `${exportProgress}%` }} />
                    </div>

                    {/* animated dots */}
                    <div className="flex justify-center gap-1.5 mb-5">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-[#c9a84c]/60"
                          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>

                    {/* cancel */}
                    <button onClick={handleStop}
                      className="flex items-center gap-2 mx-auto px-6 py-2 bg-white/8 hover:bg-red-600/30 border border-white/15 hover:border-red-500/40 text-white/60 hover:text-red-400 rounded-xl text-xs font-bold transition">
                      <Square className="w-3 h-3" /> إلغاء التصدير
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* ══════════════ SYNC MODAL ════════════════════════════════════════ */}
      {syncModalOpen && (() => {
        const isCdnMode = !customAudioFile;
        const activeCdnTime = syncCdnCurrentTime;
        const activeCustomTime = audioCurrentTime;
        const activeDuration = customAudioFile ? audioDuration : 0;
        const activeTime = isCdnMode ? activeCdnTime : activeCustomTime;

        return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3" dir="rtl"
          style={{ fontFamily: "Cairo, sans-serif" }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={closeSyncModal} />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-4xl flex flex-col overflow-hidden rounded-2xl shadow-2xl"
            style={{ maxHeight: "92vh", background: "linear-gradient(160deg,#16161f 0%,#0e0e18 100%)", border: "1px solid rgba(201,168,76,0.18)" }}>

            {/* ── Gold top accent line ── */}
            <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg,transparent,#c9a84c,transparent)" }} />

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)" }}>
                  <span className="text-lg">🎛️</span>
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white tracking-wide">مزامنة الآيات يدوياً</h2>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    {isCdnMode
                      ? `صوت القارئ: ${selectedReciter.replace(/_/g," ") || "مختار"} • ${toArabicDigits(ayahRange.length)} آية`
                      : `ملف صوتي مخصص • ${toArabicDigits(ayahRange.length)} آية`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mr-1">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)" }}>
                    {toArabicDigits(syncDraft.filter(v => v !== undefined).length)} / {toArabicDigits(totalSyncPoints)}
                  </span>
                  {syncPhase === "running" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                      ● يُسجَّل
                    </span>
                  )}
                </div>
              </div>
              <button onClick={closeSyncModal}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <X className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden min-h-0">

              {/* ── Left: main panel ── */}
              <div className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto">

                {/* Audio source info banner */}
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px]"
                  style={{ background: isCdnMode ? "rgba(99,179,237,0.08)" : "rgba(201,168,76,0.08)", border: `1px solid ${isCdnMode ? "rgba(99,179,237,0.2)" : "rgba(201,168,76,0.2)"}` }}>
                  <span className="text-base flex-shrink-0">{isCdnMode ? "🌐" : "🎵"}</span>
                  <div>
                    <span className={`font-bold ${isCdnMode ? "text-blue-300" : "text-[#c9a84c]"}`}>
                      {isCdnMode ? "وضع صوت القارئ" : "وضع الملف المخصص"}
                    </span>
                    <span className="text-white/40 mr-2">
                      {isCdnMode
                        ? "يُشغَّل صوت كل آية تلقائياً — اضغط التالي عند الانتقال"
                        : "استمع للتسجيل واضغط التالي عند كل آية"}
                    </span>
                  </div>
                </div>

                {/* Audio mini-player (custom) */}
                {!isCdnMode && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <button onClick={toggleCustomAudioPlay}
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition"
                      style={{ background: "rgba(201,168,76,0.18)", border: "1px solid rgba(201,168,76,0.4)" }}>
                      {isAudioPlaying
                        ? <Pause className="w-3.5 h-3.5 text-[#c9a84c]" />
                        : <Play className="w-3.5 h-3.5 text-[#c9a84c]" />}
                    </button>
                    <div className="flex-1 relative h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: activeDuration ? `${(activeCustomTime / activeDuration) * 100}%` : "0%", background: "linear-gradient(90deg,#c9a84c,#e2c068)" }} />
                      {syncDraft.map((pt, idx) => pt !== undefined && (
                        <div key={idx} className="absolute top-1/2 w-1.5 h-1.5 rounded-full bg-green-400"
                          style={{ left: `${activeDuration ? (pt / activeDuration) * 100 : 0}%`, transform: "translate(-50%,-50%)", boxShadow: "0 0 4px #4ade80" }} />
                      ))}
                    </div>
                    <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {formatTime(activeCustomTime)} / {formatTime(activeDuration)}
                    </span>
                  </div>
                )}

                {/* CDN audio: current ayah status */}
                {isCdnMode && syncPhase === "running" && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(99,179,237,0.06)", border: "1px solid rgba(99,179,237,0.18)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse"
                      style={{ background: "rgba(99,179,237,0.2)", border: "1px solid rgba(99,179,237,0.4)" }}>
                      <span className="text-xs">🔊</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-blue-300 font-bold">
                        يُشغَّل: آية {toArabicDigits(syncCdnAyahIdx + 1)} من {toArabicDigits(ayahRange.length)}
                        {syncSegments[syncCursor]?.totalParts > 1 &&
                          ` — جزء ${toArabicDigits(syncSegments[syncCursor]?.partIdx + 1)}/${toArabicDigits(syncSegments[syncCursor]?.totalParts)}`}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">الوقت الكلي: {formatTime(activeCdnTime)}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-blue-300"
                      style={{ background: "rgba(99,179,237,0.12)" }}>
                      يعمل تلقائياً
                    </span>
                  </div>
                )}

                {/* Main ayah display */}
                <div className="flex-1 flex flex-col items-center justify-center rounded-2xl p-6 text-center min-h-[180px]"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {syncPhase === "idle" ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}>
                        <Play className="w-6 h-6 text-[#c9a84c]" />
                      </div>
                      <p className="text-white/30 text-sm">اضغط "ابدأ المزامنة" للبدء</p>
                      <p className="text-white/18 text-[10px]">
                        {isCdnMode ? "سيبدأ تشغيل الآيات تلقائياً" : "سيشتغل الصوت من البداية"}
                      </p>
                    </div>
                  ) : syncPhase === "done" ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)" }}>
                        <span className="text-2xl">✓</span>
                      </div>
                      <p className="text-green-400 font-extrabold text-base">اكتملت المزامنة!</p>
                      <p className="text-white/35 text-[11px]">
                        {toArabicDigits(syncDraft.filter(v => v !== undefined).length)} نقطة مسجَّلة — احفظ لتطبيق التوقيتات
                      </p>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-4">
                      {(() => {
                        const isEnd = syncCursor >= syncSegments.length;
                        const seg   = isEnd ? null : syncSegments[syncCursor];
                        return isEnd ? (
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-[#c9a84c] text-2xl">◀</span>
                            <p className="text-white/60 text-sm font-bold">حدِّد نهاية آخر مقطع</p>
                          </div>
                        ) : (
                          <>
                            {/* Segment label */}
                            <div className="flex items-center gap-2">
                              <div className="px-3 py-1 rounded-full text-[10px] font-bold"
                                style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)" }}>
                                آية {toArabicDigits(seg!.ayahNum)}
                                {seg!.totalParts > 1 && ` — جزء ${toArabicDigits(seg!.partIdx + 1)} / ${toArabicDigits(seg!.totalParts)}`}
                              </div>
                              <div className="text-[9px] text-white/30">
                                مقطع {toArabicDigits(syncCursor + 1)} / {toArabicDigits(totalSyncPoints)}
                              </div>
                            </div>
                            {/* Segment text */}
                            <p className="text-white leading-loose text-center" dir="rtl"
                              style={{ fontFamily: `${fontFamily}, sans-serif`, fontSize: "clamp(15px,2.2vw,21px)", lineHeight: 2.2 }}>
                              {seg!.text}
                            </p>
                            {/* "Next part" preview if multi-part */}
                            {seg!.totalParts > 1 && !seg!.isLast && (() => {
                              const nextSeg = syncSegments[syncCursor + 1];
                              return nextSeg && nextSeg.ayahIdx === seg!.ayahIdx ? (
                                <p className="text-[9px] text-white/20 text-center" dir="rtl"
                                  style={{ fontFamily: `${fontFamily}, sans-serif` }}>
                                  التالي: {nextSeg.text.split(/\s+/).slice(0, 5).join(" ")}…
                                </p>
                              ) : null;
                            })()}
                          </>
                        );
                      })()}
                      {/* Progress dots */}
                      <div className="flex flex-wrap justify-center gap-1 mt-1">
                        {[...Array(Math.min(totalSyncPoints, 24))].map((_, i) => {
                          const seg = syncSegments[i];
                          const isAyahStart = seg && seg.partIdx === 0;
                          return (
                            <div key={i} className="rounded-full transition-all duration-200"
                              style={{
                                width: i === syncCursor ? 20 : isAyahStart ? 10 : 7,
                                height: i === syncCursor ? 8 : isAyahStart ? 8 : 6,
                                background: i < syncCursor ? "#4ade80" : i === syncCursor ? "#c9a84c" : isAyahStart ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"
                              }} />
                          );
                        })}
                        {totalSyncPoints > 24 && (
                          <span className="text-[9px] text-white/25">+{toArabicDigits(totalSyncPoints - 24)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  {/* ── Auto-sync button (idle + done phases, CDN mode only) ── */}
                  {(syncPhase === "idle" || syncPhase === "done") && !customAudioFile && (
                    <button
                      onClick={handleAutoSync}
                      disabled={autoSyncLoading}
                      className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-extrabold text-base transition-all active:scale-98 select-none disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg,#1a56a0,#2272d8)", color: "#fff", boxShadow: "0 4px 20px rgba(34,114,216,0.35)" }}>
                      {autoSyncLoading ? (
                        <>
                          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          جارٍ جلب التوقيتات…
                        </>
                      ) : (
                        <>⚡ مزامنة تلقائية</>
                      )}
                    </button>
                  )}
                  {/* ── Auto-sync error ── */}
                  {autoSyncError && (
                    <p className="text-center text-xs text-red-400 px-2 leading-tight">{autoSyncError}</p>
                  )}
                  {/* ── Manual sync start (idle phase) ── */}
                  {syncPhase === "idle" && (
                    <button onClick={startSync}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-98 select-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.75)" }}>
                      <Play className="w-4 h-4" /> مزامنة يدوية
                    </button>
                  )}
                  {syncPhase === "running" && (
                    <button onClick={syncNext}
                      className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-extrabold text-lg transition-all active:scale-95 select-none"
                      style={{ background: "linear-gradient(135deg,#c9a84c,#d4b660)", color: "#0a0a0a", boxShadow: "0 4px 20px rgba(201,168,76,0.35)" }}>
                      التالي ←
                    </button>
                  )}
                  {syncPhase === "running" && (
                    <p className="text-center text-[10px] text-white/25">
                      اضغط "التالي" أو مفتاح المسافة (Space) مع كل انتقال للآية التالية
                    </p>
                  )}
                  {syncPhase === "done" && (
                    <button onClick={startSync}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
                      <RotateCcw className="w-4 h-4" /> إعادة المزامنة يدوياً
                    </button>
                  )}
                </div>
              </div>

              {/* ── Right: ayah list ── */}
              <div className="w-52 overflow-y-auto flex flex-col flex-shrink-0"
                style={{ borderRight: "1px solid rgba(255,255,255,0.07)", background: "rgba(10,10,20,0.6)" }}>
                <div className="px-3 py-2.5 sticky top-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,20,0.9)", backdropFilter: "blur(8px)" }}>
                  <p className="text-[10px] font-bold text-white/30 tracking-wider">قائمة الآيات</p>
                </div>
                {syncSegments.map((seg, idx) => {
                  const hasPoint   = syncDraft[idx] !== undefined;
                  const isCurrent  = syncPhase === "running" && syncCursor === idx;
                  const cdnPlaying = isCdnMode && syncCdnAyahIdx === seg.ayahIdx && syncPhase === "running";
                  return (
                    <div key={`${seg.ayahNum}-${seg.partIdx}`}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        background: isCurrent ? "rgba(201,168,76,0.08)" : "transparent",
                        borderRight: isCurrent ? "2px solid #c9a84c" : cdnPlaying && seg.partIdx === seg.totalParts - 1 ? "2px solid #63b3ed" : "2px solid transparent"
                      }}>
                      <div className="px-3 py-2">
                        <div className="flex items-center justify-between mb-0.5">
                          {/* Label: "آية N" or "آية N جزء M/T" */}
                          <span className="text-[9px] font-extrabold leading-tight"
                            style={{ color: isCurrent ? "#c9a84c" : "rgba(255,255,255,0.4)" }}>
                            آية {toArabicDigits(seg.ayahNum)}
                            {seg.totalParts > 1 && (
                              <span style={{ color: isCurrent ? "#c9a84c80" : "rgba(255,255,255,0.22)" }}>
                                {` ${toArabicDigits(seg.partIdx + 1)}/${toArabicDigits(seg.totalParts)}`}
                              </span>
                            )}
                          </span>
                          {hasPoint ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-green-400"
                              style={{ background: "rgba(74,222,128,0.1)" }}>
                              {formatTime(syncDraft[idx])}
                            </span>
                          ) : cdnPlaying ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-blue-300 animate-pulse"
                              style={{ background: "rgba(99,179,237,0.1)" }}>
                              ● يُشغَّل
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-white/18 px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(255,255,255,0.04)" }}>
                              —
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] leading-relaxed line-clamp-1 text-right" dir="rtl"
                          style={{ color: "rgba(255,255,255,0.28)" }}>
                          {seg.text.slice(0, 32)}…
                        </p>
                      </div>
                    </div>
                  );
                })}
                {/* End marker */}
                <div style={{
                  background: syncPhase === "running" && syncCursor === syncSegments.length ? "rgba(201,168,76,0.08)" : "transparent",
                  borderRight: syncPhase === "running" && syncCursor === syncSegments.length ? "2px solid #c9a84c" : "2px solid transparent"
                }}>
                  <div className="px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold" style={{ color: syncPhase === "running" && syncCursor === syncSegments.length ? "#c9a84c" : "rgba(255,255,255,0.22)" }}>
                        نهاية ◀
                      </span>
                      {syncDraft[syncSegments.length] !== undefined ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-green-400"
                          style={{ background: "rgba(74,222,128,0.1)" }}>
                          {formatTime(syncDraft[syncSegments.length])}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white/18"
                          style={{ background: "rgba(255,255,255,0.04)" }}>—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/8"
              style={{ background: "rgba(10,10,18,0.8)" }}>
              <button onClick={closeSyncModal}
                className="text-xs font-medium transition"
                style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                إلغاء
              </button>
              <div className="flex items-center gap-2">
                <button onClick={resetSyncDraft}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}>
                  <RotateCcw className="w-3 h-3" /> إعادة ضبط الكل
                </button>
                <button onClick={saveSyncModal}
                  disabled={syncDraft.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold transition"
                  style={{ background: syncDraft.length > 0 ? "linear-gradient(135deg,#c9a84c,#d4b660)" : "rgba(201,168,76,0.2)", color: syncDraft.length > 0 ? "#0a0a0a" : "rgba(201,168,76,0.4)", boxShadow: syncDraft.length > 0 ? "0 2px 12px rgba(201,168,76,0.25)" : "none", cursor: syncDraft.length > 0 ? "pointer" : "not-allowed" }}>
                  حفظ المزامنة
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── Mobile Bottom Navigation ──────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0d]/95 border-t border-white/10 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex h-14 relative">
          {([
            { id: "surah",   icon: <BookOpen className="w-5 h-5" />,           label: "السورة" },
            { id: "design",  icon: <Palette className="w-5 h-5" />,            label: "التصميم" },
            { id: "preview", icon: <Monitor className="w-5 h-5" />,            label: "المعاينة" },
            { id: "audio",   icon: <SlidersHorizontal className="w-5 h-5" />,  label: "الصوت" },
          ] as { id: "surah"|"design"|"preview"|"audio"; icon: React.ReactNode; label: string }[]).map(tab => {
            const active = mobileTab === tab.id;
            return (
              <button key={tab.id}
                onClick={() => setMobileTab(active ? "preview" : tab.id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative"
                style={{ color: active ? "#c9a84c" : "rgba(255,255,255,0.35)" }}>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#c9a84c]" />
                )}
                {tab.icon}
                <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Audio Editor Modal */}
      {showAudioEditor && customAudioFile && (
        <AudioEditorModal
          file={customAudioFile}
          onApply={handleAudioEditorApply}
          onCancel={() => setShowAudioEditor(false)}
        />
      )}

    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/8 p-4">
      <h3 className="text-xs font-bold text-[#c9a84c] mb-3 tracking-wider">{label}</h3>
      {children}
    </div>
  );
}
