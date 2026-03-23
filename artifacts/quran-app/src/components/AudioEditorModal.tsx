import { useState, useRef, useEffect, useCallback } from "react";
import { X, Zap, RotateCcw } from "lucide-react";

interface AudioEditorModalProps {
  file: File;
  onApply: (processedFile: File) => void;
  onCancel: () => void;
}

type Preset = "natural" | "clear" | "studio" | "mosque";
type Tab = "echo" | "reverb" | "eq" | "adv";

interface AudioSettings {
  preset: Preset;
  echoEnabled: boolean;
  echoDelay: number;
  echoFeedback: number;
  echoMix: number;
  reverbEnabled: boolean;
  reverbSize: number;
  reverbMix: number;
  gain: number;
  compEnabled: boolean;
  eqGains: number[];
}

const EQ_BANDS = [
  { freq: 60,    type: "lowshelf"  as BiquadFilterType, label: "60Hz"  },
  { freq: 250,   type: "peaking"   as BiquadFilterType, label: "250Hz" },
  { freq: 1000,  type: "peaking"   as BiquadFilterType, label: "1kHz"  },
  { freq: 4000,  type: "peaking"   as BiquadFilterType, label: "4kHz"  },
  { freq: 12000, type: "highshelf" as BiquadFilterType, label: "12kHz" },
];

const PRESETS: Record<Preset, AudioSettings> = {
  natural: { preset:"natural", echoEnabled:false, echoDelay:0.25, echoFeedback:0.3,  echoMix:0.3,  reverbEnabled:false, reverbSize:1.5, reverbMix:0.25, gain:1,   compEnabled:false, eqGains:[0,0,0,0,0]    },
  clear:   { preset:"clear",   echoEnabled:false, echoDelay:0.2,  echoFeedback:0.2,  echoMix:0.2,  reverbEnabled:false, reverbSize:1.0, reverbMix:0.15, gain:1.2, compEnabled:true,  eqGains:[0,-2,2,3,1]   },
  studio:  { preset:"studio",  echoEnabled:false, echoDelay:0.2,  echoFeedback:0.25, echoMix:0.25, reverbEnabled:true,  reverbSize:1.2, reverbMix:0.2,  gain:1,   compEnabled:true,  eqGains:[2,1,0,1,2]    },
  mosque:  { preset:"mosque",  echoEnabled:false, echoDelay:0.35, echoFeedback:0.45, echoMix:0.45, reverbEnabled:true,  reverbSize:3.5, reverbMix:0.5,  gain:1,   compEnabled:false, eqGains:[3,1,-1,0,1]   },
};

const DEFAULT: AudioSettings = { ...PRESETS.natural };

const GOLD = "#c9a84c";
const GOLD_DIM = "rgba(201,168,76,0.15)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const BG_MAIN = "#0d0520";
const BG_PANEL = "rgba(255,255,255,0.04)";
const BG_DEEP = "#080215";
const TEXT_MID = "rgba(255,255,255,0.55)";
const TEXT_DIM = "rgba(255,255,255,0.28)";
const BORDER_SUB = "rgba(255,255,255,0.07)";

function fmt(s: number) {
  const m = Math.floor(s / 60), sc = Math.floor(s % 60);
  return `${m}:${sc.toString().padStart(2, "0")}`;
}

function writeStr(view: DataView, off: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
}

function bufToWav(buffer: AudioBuffer): ArrayBuffer {
  const nc = buffer.numberOfChannels, sr = buffer.sampleRate, ns = buffer.length;
  const ba = nc * 2, ds = ns * ba;
  const ab = new ArrayBuffer(44 + ds); const v = new DataView(ab);
  writeStr(v, 0, "RIFF"); v.setUint32(4, 36 + ds, true);
  writeStr(v, 8, "WAVE"); writeStr(v, 12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, nc, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * ba, true); v.setUint16(32, ba, true);
  v.setUint16(34, 16, true); writeStr(v, 36, "data"); v.setUint32(40, ds, true);
  let o = 44;
  for (let i = 0; i < ns; i++) for (let ch = 0; ch < nc; ch++) {
    const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2;
  }
  return ab;
}

function mkIR(ctx: AudioContext | OfflineAudioContext, sec: number) {
  const sr = ctx.sampleRate, len = Math.floor(sr * sec);
  const ir = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
  }
  return ir;
}

function buildChain(ctx: AudioContext | OfflineAudioContext, s: AudioSettings, dest: AudioNode): AudioNode {
  const gn = ctx.createGain(); gn.gain.value = s.gain;
  let node: AudioNode = gn;
  EQ_BANDS.forEach((band, i) => {
    const f = ctx.createBiquadFilter();
    f.type = band.type; f.frequency.value = band.freq; f.gain.value = s.eqGains[i]; f.Q.value = 1;
    node.connect(f); node = f;
  });
  if (s.compEnabled) {
    const cp = ctx.createDynamicsCompressor();
    cp.threshold.value = -24; cp.knee.value = 10; cp.ratio.value = 4; cp.attack.value = 0.003; cp.release.value = 0.25;
    node.connect(cp); node = cp;
  }
  if (!s.echoEnabled && !s.reverbEnabled) { node.connect(dest); }
  else {
    node.connect(dest);
    if (s.echoEnabled) {
      const dly = ctx.createDelay(3); dly.delayTime.value = s.echoDelay;
      const fb = ctx.createGain(); fb.gain.value = Math.min(s.echoFeedback, 0.88);
      const wt = ctx.createGain(); wt.gain.value = s.echoMix;
      node.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wt); wt.connect(dest);
    }
    if (s.reverbEnabled) {
      const conv = ctx.createConvolver(); conv.buffer = mkIR(ctx, s.reverbSize);
      const rw = ctx.createGain(); rw.gain.value = s.reverbMix;
      node.connect(conv); conv.connect(rw); rw.connect(dest);
    }
  }
  return gn;
}

export default function AudioEditorModal({ file, onApply, onCancel }: AudioEditorModalProps) {
  const [settings, setSettings] = useState<AudioSettings>({ ...DEFAULT });
  const [tab, setTab] = useState<Tab>("echo");
  const [playing, setPlaying] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [notice, setNotice] = useState("جاري التحميل...");

  const waveWrapRef = useRef<HTMLDivElement>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufRef = useRef<AudioBuffer | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const offsetRef = useRef(0);
  const startTRef = useRef(0);
  const playingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const settingsRef = useRef(settings);
  const comparingRef = useRef(comparing);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { comparingRef.current = comparing; }, [comparing]);

  useEffect(() => {
    let closed = false;
    file.arrayBuffer().then(ab => {
      if (closed) return;
      const ctx = new AudioContext(); audioCtxRef.current = ctx;
      ctx.decodeAudioData(ab.slice(0), decoded => {
        if (closed) return;
        bufRef.current = decoded; setDuration(decoded.duration); setNotice(""); drawWave(decoded);
      }, err => { if (!closed) setNotice("⚠ فشل فك الترميز: " + err); });
    }).catch(() => { if (!closed) setNotice("⚠ خطأ في قراءة الملف"); });
    return () => { closed = true; stopPlayback(); audioCtxRef.current?.close().catch(() => {}); };
  }, [file]);

  function drawWave(buf: AudioBuffer) {
    const wrap = waveWrapRef.current, cv = waveCanvasRef.current;
    if (!wrap || !cv) return;
    cv.width = wrap.clientWidth || 360; cv.height = wrap.clientHeight || 64;
    const cx = cv.getContext("2d"); if (!cx) return;
    const data = buf.getChannelData(0), W = cv.width, H = cv.height;
    const step = Math.ceil(data.length / W), amp = H / 2;
    cx.fillStyle = BG_DEEP; cx.fillRect(0, 0, W, H);
    const gr = cx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "rgba(201,168,76,0.9)");
    gr.addColorStop(0.5, "rgba(201,168,76,0.45)");
    gr.addColorStop(1, "rgba(201,168,76,0.9)");
    cx.strokeStyle = gr; cx.lineWidth = 1; cx.beginPath();
    for (let i = 0; i < W; i++) {
      let mn = 1, mx = -1;
      for (let j = 0; j < step; j++) { const d = data[i * step + j] ?? 0; if (d < mn) mn = d; if (d > mx) mx = d; }
      cx.moveTo(i, (1 + mn) * amp); cx.lineTo(i, (1 + mx) * amp);
    }
    cx.stroke();
  }

  function updCursor(t: number) {
    const d = bufRef.current?.duration || 1;
    if (cursorRef.current) cursorRef.current.style.left = `${(t / d) * 100}%`;
    setCurTime(t);
  }

  const stopPlayback = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (playingRef.current && audioCtxRef.current)
      offsetRef.current = Math.min(audioCtxRef.current.currentTime - startTRef.current, bufRef.current?.duration ?? 0);
    if (srcRef.current) { try { srcRef.current.stop(); } catch {} srcRef.current = null; }
    playingRef.current = false; setPlaying(false);
  }, []);

  function doPlay() {
    const ctx = audioCtxRef.current, buf = bufRef.current;
    if (!ctx || !buf) return;
    stopPlayback();
    if (offsetRef.current >= buf.duration - 0.05) offsetRef.current = 0;
    if (ctx.state === "suspended") ctx.resume();
    const src = ctx.createBufferSource(); src.buffer = buf;
    if (comparingRef.current) { src.connect(ctx.destination); }
    else { const first = buildChain(ctx, settingsRef.current, ctx.destination); src.connect(first); }
    const delay = ctx.state === "running" ? 0 : 0.1;
    src.start(delay, offsetRef.current);
    startTRef.current = ctx.currentTime - offsetRef.current + delay;
    srcRef.current = src; playingRef.current = true; setPlaying(true);
    src.onended = () => { if (playingRef.current) { playingRef.current = false; offsetRef.current = 0; setPlaying(false); updCursor(0); } };
    const loop = () => {
      if (!playingRef.current || !audioCtxRef.current) return;
      updCursor(Math.min(audioCtxRef.current.currentTime - startTRef.current, buf.duration));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  const togglePlay = () => { if (!bufRef.current) return; playingRef.current ? stopPlayback() : doPlay(); };
  const rewind = () => { stopPlayback(); offsetRef.current = 0; updCursor(0); };

  const seekBar = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bufRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    offsetRef.current = Math.max(0, Math.min((e.clientX - r.left) / r.width * bufRef.current.duration, bufRef.current.duration));
    if (playingRef.current) doPlay(); else updCursor(offsetRef.current);
  };

  const seekWave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bufRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    offsetRef.current = Math.max(0, Math.min((e.clientX - r.left) / r.width * bufRef.current.duration, bufRef.current.duration));
    if (playingRef.current) doPlay(); else updCursor(offsetRef.current);
  };

  const setCompare = (on: boolean) => {
    setComparing(on); comparingRef.current = on; if (playingRef.current) doPlay();
  };

  const applyPreset = (preset: Preset) => {
    stopPlayback(); const p = { ...PRESETS[preset] }; setSettings(p); settingsRef.current = p;
  };

  const upd = (patch: Partial<AudioSettings>) => {
    setSettings(s => { const n = { ...s, ...patch }; settingsRef.current = n; if (playingRef.current) setTimeout(doPlay, 0); return n; });
  };
  const updEQ = (i: number, v: number) => {
    setSettings(s => { const g = [...s.eqGains]; g[i] = v; const n = { ...s, eqGains: g }; settingsRef.current = n; if (playingRef.current) setTimeout(doPlay, 0); return n; });
  };
  const reset = () => { stopPlayback(); setSettings({ ...DEFAULT }); settingsRef.current = { ...DEFAULT }; };

  async function handleApply() {
    if (!bufRef.current) return;
    setProcessing(true); stopPlayback();
    try {
      const buf = bufRef.current;
      const off = new OfflineAudioContext(buf.numberOfChannels, buf.length, buf.sampleRate);
      const src = off.createBufferSource(); src.buffer = buf;
      const first = buildChain(off, settings, off.destination); src.connect(first); src.start(0);
      const rendered = await off.startRendering();
      const wav = bufToWav(rendered);
      const blob = new Blob([wav], { type: "audio/wav" });
      onApply(new File([blob], file.name.replace(/\.[^.]+$/, "_edited.wav"), { type: "audio/wav" }));
    } catch (e) { console.error(e); } finally { setProcessing(false); }
  }

  const PRESETS_UI = [
    { id: "natural" as Preset, emoji: "🌿", label: "طبيعي"   },
    { id: "clear"   as Preset, emoji: "✨", label: "واضح"    },
    { id: "studio"  as Preset, emoji: "🎙", label: "استوديو" },
    { id: "mosque"  as Preset, emoji: "🕌", label: "مسجد"    },
  ];

  const TABS: { id: Tab; label: string }[] = [
    { id: "echo",  label: "صدى"   },
    { id: "reverb",label: "رنين"  },
    { id: "eq",    label: "معادل" },
    { id: "adv",   label: "متقدم" },
  ];

  const pct = duration ? curTime / duration : 0;

  return (
    <div
      className="fixed inset-0 z-[7000] flex items-end justify-center"
      style={{ background: "rgba(4,1,15,0.92)", backdropFilter: "blur(20px)", direction: "rtl" }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full overflow-y-auto"
        style={{
          background: "linear-gradient(180deg,#150a30 0%,#0d0520 100%)",
          border: "1px solid " + GOLD_BORDER,
          borderBottom: "none",
          borderRadius: "24px 24px 0 0",
          maxWidth: 480,
          maxHeight: "92vh",
          boxShadow: "0 -24px 64px rgba(0,0,0,0.8), 0 -1px 0 rgba(201,168,76,0.1) inset",
        }}
      >
        {/* Top gold line */}
        <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${GOLD},transparent)`, borderRadius: "24px 24px 0 0" }} />

        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: "rgba(201,168,76,0.2)", borderRadius: 4, margin: "10px auto 0" }} />

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px 12px",
          borderBottom: "1px solid " + BORDER_SUB,
          position: "sticky", top: 0,
          background: "linear-gradient(180deg,#150a30,#120828)",
          zIndex: 2,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, fontSize: 15,
              background: `linear-gradient(135deg,${GOLD_DIM},rgba(201,168,76,0.08))`,
              border: "1px solid " + GOLD_BORDER,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(201,168,76,0.1)",
            }}>✂️</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: GOLD, lineHeight: 1.2 }}>تحرير الصوت</div>
              <div style={{ fontSize: 10, color: TEXT_DIM, lineHeight: 1 }}>{file.name}</div>
            </div>
          </div>
          <button onClick={onCancel} style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.4)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ padding: "16px 16px 20px" }}>

          {/* Notice */}
          {notice && (
            <div style={{
              fontSize: 11, color: GOLD,
              background: GOLD_DIM, border: "1px solid " + GOLD_BORDER,
              borderRadius: 10, padding: "9px 13px", marginBottom: 12,
            }}>{notice}</div>
          )}

          {/* Waveform */}
          <div
            ref={waveWrapRef} onClick={seekWave}
            style={{
              background: BG_DEEP, border: "1px solid " + GOLD_BORDER,
              borderRadius: 12, height: 64, marginBottom: 12,
              position: "relative", overflow: "hidden", cursor: "pointer",
              boxShadow: "inset 0 1px 8px rgba(0,0,0,0.4)",
            }}
          >
            <canvas ref={waveCanvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
            <div ref={cursorRef} style={{
              position: "absolute", top: 0, bottom: 0, width: 2,
              left: `${pct * 100}%`,
              background: `linear-gradient(180deg,transparent,${GOLD},transparent)`,
              pointerEvents: "none",
            }} />
          </div>

          {/* Player row */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <button onClick={rewind} style={{
              width: 32, height: 32, borderRadius: "50%",
              background: BG_PANEL, border: "1px solid " + BORDER_SUB,
              color: TEXT_MID, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <RotateCcw size={13} />
            </button>
            <button onClick={togglePlay} style={{
              width: 42, height: 42, borderRadius: "50%",
              background: `linear-gradient(135deg,${GOLD},#e4c96a)`,
              border: "none", color: "#0d0520",
              cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
              boxShadow: `0 4px 16px rgba(201,168,76,0.3)`,
            }}>
              {playing ? "⏸" : "▶"}
            </button>
            {/* Progress */}
            <div onClick={seekBar} style={{
              flex: 1, height: 5, background: "rgba(255,255,255,0.08)",
              borderRadius: 5, cursor: "pointer", position: "relative",
            }}>
              <div style={{
                height: "100%", width: `${pct * 100}%`, borderRadius: 5,
                background: `linear-gradient(90deg,${GOLD},#e4c96a)`,
                boxShadow: `0 0 6px rgba(201,168,76,0.4)`,
              }} />
            </div>
            <span style={{ fontSize: 10, color: TEXT_DIM, direction: "ltr", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
              {fmt(curTime)} / {fmt(duration)}
            </span>
          </div>

          {/* Compare toggle */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 12px", marginBottom: 16,
            background: BG_PANEL, border: "1px solid " + BORDER_SUB,
            borderRadius: 10,
          }}>
            <span style={{ fontSize: 11, color: TEXT_MID }}>بدون تأثيرات (مقارنة)</span>
            <GoldToggle on={comparing} onChange={setCompare} />
          </div>

          {/* Presets label */}
          <div style={{ fontSize: 10, color: "rgba(201,168,76,0.5)", letterSpacing: 2, marginBottom: 8 }}>
            ⚡ إعدادات سريعة
          </div>

          {/* Presets */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: 18 }}>
            {PRESETS_UI.map(p => {
              const active = settings.preset === p.id;
              return (
                <button key={p.id} onClick={() => applyPreset(p.id)} style={{
                  background: active ? GOLD_DIM : BG_PANEL,
                  border: `1px solid ${active ? GOLD_BORDER : BORDER_SUB}`,
                  borderRadius: 12, cursor: "pointer", padding: "10px 4px",
                  textAlign: "center",
                  color: active ? GOLD : TEXT_MID,
                  fontFamily: "Cairo, sans-serif", fontSize: 11, fontWeight: 700,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  transition: "all 0.2s",
                  boxShadow: active ? `0 2px 10px rgba(201,168,76,0.15)` : "none",
                }}>
                  <span style={{ fontSize: 20 }}>{p.emoji}</span>
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", background: BG_DEEP,
            border: "1px solid " + BORDER_SUB,
            borderRadius: 12, padding: 4, marginBottom: 16,
          }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: "7px 2px",
                background: tab === t.id ? GOLD_DIM : "none",
                border: `1px solid ${tab === t.id ? GOLD_BORDER : "transparent"}`,
                color: tab === t.id ? GOLD : TEXT_DIM,
                fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700,
                borderRadius: 9, cursor: "pointer", transition: "all 0.2s",
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Echo ── */}
          {tab === "echo" && (
            <div>
              <ToggleRow label="تفعيل الصدى" on={settings.echoEnabled} onChange={v => upd({ echoEnabled: v })} />
              <SlRow label="التأخير" min={0.05} max={0.8} step={0.01} value={settings.echoDelay}
                disp={v => v.toFixed(2) + "s"} onChange={v => upd({ echoDelay: v })} />
              <SlRow label="التكرار" min={0} max={0.85} step={0.01} value={settings.echoFeedback}
                disp={v => Math.round(v * 100) + "%"} onChange={v => upd({ echoFeedback: v })} />
              <SlRow label="المزج" min={0} max={1} step={0.01} value={settings.echoMix}
                disp={v => Math.round(v * 100) + "%"} onChange={v => upd({ echoMix: v })} />
            </div>
          )}

          {/* ── Reverb ── */}
          {tab === "reverb" && (
            <div>
              <ToggleRow label="تفعيل الرنين" on={settings.reverbEnabled} onChange={v => upd({ reverbEnabled: v })} />
              <SlRow label="الحجم" min={0.2} max={5} step={0.1} value={settings.reverbSize}
                disp={v => v.toFixed(1) + "s"} onChange={v => upd({ reverbSize: v })} />
              <SlRow label="المزج" min={0} max={1} step={0.01} value={settings.reverbMix}
                disp={v => Math.round(v * 100) + "%"} onChange={v => upd({ reverbMix: v })} />
            </div>
          )}

          {/* ── EQ ── */}
          {tab === "eq" && (
            <div>
              <div style={{ fontSize: 10, color: TEXT_DIM, textAlign: "center", marginBottom: 14 }}>
                اسحب للضبط ( +12 / −12 dB )
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 14 }}>
                {EQ_BANDS.map((band, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: settings.eqGains[i] !== 0 ? GOLD : TEXT_DIM, minHeight: 12, fontWeight: 700 }}>
                      {settings.eqGains[i] > 0 ? "+" : ""}{settings.eqGains[i].toFixed(0)}
                    </span>
                    <input
                      type="range" min={-12} max={12} step={1} value={settings.eqGains[i]}
                      onChange={e => updEQ(i, +e.target.value)}
                      className="accent-[#c9a84c]"
                      style={{
                        writingMode: "vertical-lr", direction: "rtl",
                        width: 24, height: 88,
                        background: "transparent", cursor: "pointer", outline: "none",
                        WebkitAppearance: "slider-vertical",
                      } as React.CSSProperties}
                    />
                    <span style={{ fontSize: 9, color: TEXT_DIM }}>{band.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Advanced ── */}
          {tab === "adv" && (
            <div>
              <SlRow label="الصوت" min={0.1} max={3} step={0.05} value={settings.gain}
                disp={v => v.toFixed(2) + "x"} onChange={v => upd({ gain: v })} />
              <div style={{ height: 1, background: BORDER_SUB, margin: "12px 0" }} />
              <ToggleRow label="ضغط الديناميكية" on={settings.compEnabled} onChange={v => upd({ compEnabled: v })} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 8, padding: "0 16px 24px" }}>
          <button onClick={handleApply} disabled={processing} style={{
            flex: 1, height: 44,
            background: processing ? "rgba(201,168,76,0.3)" : `linear-gradient(135deg,${GOLD},#e4c96a)`,
            border: "none", borderRadius: 12,
            color: "#0d0520", fontFamily: "Cairo,sans-serif", fontWeight: 900,
            fontSize: 14, cursor: processing ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            boxShadow: processing ? "none" : `0 4px 20px rgba(201,168,76,0.35)`,
            transition: "all 0.2s",
          }}>
            {processing
              ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span> معالجة...</>
              : <><Zap size={15} /> تطبيق التأثيرات</>}
          </button>
          <button onClick={reset} title="إعادة ضبط" style={{
            width: 44, height: 44, border: "1px solid " + BORDER_SUB, borderRadius: 12,
            background: BG_PANEL, color: TEXT_DIM, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <RotateCcw size={15} />
          </button>
          <button onClick={onCancel} style={{
            width: 60, height: 44, border: "1px solid " + BORDER_SUB, borderRadius: 12,
            background: BG_PANEL, color: TEXT_MID, cursor: "pointer",
            fontFamily: "Cairo,sans-serif", fontSize: 12,
          }}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

function GoldToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      position: "relative", width: 38, height: 20, borderRadius: 20,
      background: on ? GOLD : "rgba(255,255,255,0.1)",
      cursor: "pointer", transition: "background 0.25s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", width: 14, height: 14, borderRadius: "50%", top: 3,
        right: on ? 3 : "auto", left: on ? "auto" : 3,
        background: on ? "#0d0520" : "rgba(255,255,255,0.5)",
        transition: "all 0.25s",
      }} />
    </div>
  );
}

function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 13px", marginBottom: 12,
      background: BG_PANEL, border: "1px solid " + BORDER_SUB,
      borderRadius: 10, fontSize: 12, color: TEXT_MID,
    }}>
      <span>{label}</span>
      <GoldToggle on={on} onChange={onChange} />
    </div>
  );
}

function SlRow({ label, min, max, step, value, disp, onChange }: {
  label: string; min: number; max: number; step: number;
  value: number; disp: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 11, color: TEXT_DIM, width: 54, flexShrink: 0, textAlign: "right" }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        className="accent-[#c9a84c]"
        style={{ flex: 1, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.1)", outline: "none", cursor: "pointer" }}
      />
      <span style={{ fontSize: 10, color: GOLD, width: 38, direction: "ltr", textAlign: "left", fontWeight: 700 }}>
        {disp(value)}
      </span>
    </div>
  );
}
