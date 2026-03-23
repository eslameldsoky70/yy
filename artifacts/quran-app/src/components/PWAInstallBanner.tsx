import { useState, useEffect } from "react";
import { X, Download, Smartphone, Zap, WifiOff } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = (window.navigator as any).standalone;
    if (ios && !standalone && !sessionStorage.getItem("pwa-ios-dismissed")) {
      setIsIOS(true); setShowIOS(true);
      setTimeout(() => setVisible(true), 1200);
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 1200);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") { setPrompt(null); setDismissed(true); }
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => setDismissed(true), 350);
    if (isIOS) sessionStorage.setItem("pwa-ios-dismissed", "1");
  };

  if (dismissed || (window.navigator as any).standalone) return null;
  if (!prompt && !showIOS) return null;

  const FEATURES = [
    { icon: <Zap size={13} />,     text: "تشغيل فوري بدون تحميل"  },
    { icon: <WifiOff size={13} />, text: "يعمل بدون إنترنت"         },
    { icon: <Smartphone size={13}/>,text: "تجربة تطبيق أصيلة"       },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(4,1,15,0.75)",
          backdropFilter: "blur(12px)",
          transition: "opacity 0.35s",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "all" : "none",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed", bottom: 0, left: "50%", zIndex: 9001,
          transform: `translateX(-50%) translateY(${visible ? "0" : "100%"})`,
          transition: "transform 0.4s cubic-bezier(0.32,1.1,0.52,1)",
          width: "100%", maxWidth: 420,
          background: "linear-gradient(180deg,#1a0d3d 0%,#0d0520 100%)",
          border: "1px solid rgba(201,168,76,0.28)",
          borderBottom: "none",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -24px 64px rgba(0,0,0,0.9), 0 -1px 0 rgba(201,168,76,0.12) inset",
          direction: "rtl",
        }}
      >
        {/* Gold top bar */}
        <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#c9a84c,transparent)", borderRadius: "24px 24px 0 0" }} />

        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: "rgba(201,168,76,0.2)", borderRadius: 4, margin: "10px auto 0" }} />

        {/* Close */}
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute", top: 14, left: 14,
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.4)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={13} />
        </button>

        <div style={{ padding: "20px 20px 28px" }}>

          {/* App identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 58, height: 58, borderRadius: 16,
              background: "linear-gradient(135deg,#1e0a44,#3a1878)",
              border: "2px solid rgba(201,168,76,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
              boxShadow: "0 4px 20px rgba(201,168,76,0.2)",
              flexShrink: 0,
            }}>
              ☪️
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#c9a84c", lineHeight: 1.2 }}>إسلام ريلز</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>
                {isIOS ? "أضف إلى الشاشة الرئيسية" : "ثبِّت التطبيق مجاناً"}
              </div>
            </div>
          </div>

          {/* Features */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "12px 14px", marginBottom: 20,
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "6px 0",
                borderBottom: i < FEATURES.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: "rgba(201,168,76,0.12)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#c9a84c", flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* iOS instructions */}
          {isIOS && (
            <div style={{
              background: "rgba(201,168,76,0.06)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: 12, padding: "12px 14px", marginBottom: 18,
            }}>
              <div style={{ fontSize: 11, color: "rgba(201,168,76,0.8)", fontWeight: 700, marginBottom: 8 }}>
                خطوات الإضافة:
              </div>
              {[
                { n: 1, text: "اضغط زر المشاركة", icon: "⬆️" },
                { n: 2, text: "اختر «إضافة إلى الشاشة الرئيسية»", icon: "➕" },
                { n: 3, text: "اضغط «إضافة» للتأكيد", icon: "✅" },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: s.n < 3 ? 7 : 0 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(201,168,76,0.2)", border: "1px solid rgba(201,168,76,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 900, color: "#c9a84c", flexShrink: 0,
                  }}>{s.n}</div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                    {s.text} {s.icon}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {!isIOS && (
              <button
                onClick={handleInstall}
                style={{
                  flex: 1, height: 48,
                  background: "linear-gradient(135deg,#c9a84c,#e4c96a)",
                  border: "none", borderRadius: 14,
                  color: "#0d0520", fontFamily: "Cairo,sans-serif",
                  fontWeight: 900, fontSize: 15, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 4px 20px rgba(201,168,76,0.4)",
                }}
              >
                <Download size={17} />
                تثبيت الآن
              </button>
            )}
            <button
              onClick={handleDismiss}
              style={{
                width: isIOS ? "100%" : 80, height: 48,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, color: "rgba(255,255,255,0.45)",
                fontFamily: "Cairo,sans-serif", fontSize: 13, cursor: "pointer",
                flex: isIOS ? 1 : undefined,
              }}
            >
              {isIOS ? "حسناً، شكراً" : "لاحقاً"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
