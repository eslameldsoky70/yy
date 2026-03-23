import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const TICKER_VERSES = [
  "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
  "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا",
  "وَإِذَا قُرِئَ الْقُرْآنُ فَاسْتَمِعُوا لَهُ وَأَنصِتُوا",
  "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ",
  "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ",
  "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ",
];

const FEATURES = [
  {
    icon: "🎙️",
    title: "تلاوات بأجمل الأصوات",
    desc: "استمع لكبار القرّاء — الشيخ مشاري، ياسر الدوسري، وأكثر من ٧ قارئاً مع إضافة المزيد",
  },
  {
    icon: "🎬",
    title: "تصدير ريلز احترافي",
    desc: "أنشئ ريلز قرآنية جاهزة للنشر على يوتيوب وانستغرام وتيك توك بضغطة واحدة",
  },
  {
    icon: "🖼️",
    title: "خلفيات إسلامية فاخرة",
    desc: "مجموعة ضخمة من الخلفيات والتصاميم الإسلامية الاحترافية لتزيين ريلزك",
  },
];

const STATS = [
  { value: "+١٠٠٠", label: "ريل قرآني" },
  { value: "١١٤", label: "سورة كاملة" },
  { value: "+٥٠K", label: "متابع" },
];

const SOCIAL = [
  {
    name: "فيسبوك",
    href: "https://www.facebook.com/esllam.eldsoky/",
    hoverBg: "hover:bg-[#1877f2]/20",
    hoverBorder: "hover:border-[#1877f2]/50",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: "انستغرام",
    href: "https://www.instagram.com/e_ro25",
    hoverBg: "hover:bg-[#e1306c]/20",
    hoverBorder: "hover:border-[#e1306c]/50",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "لينكدإن",
    href: "https://www.linkedin.com/in/eslam-eldsoky/",
    hoverBg: "hover:bg-[#0077b5]/20",
    hoverBorder: "hover:border-[#0077b5]/50",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    name: "واتساب",
    href: "https://wa.me/201032561729",
    hoverBg: "hover:bg-[#25d366]/20",
    hoverBorder: "hover:border-[#25d366]/50",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.531 5.845L.057 23.882l6.186-1.453A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.056-1.397l-.361-.214-3.742.879.936-3.639-.235-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
      </svg>
    ),
  },
];

function Navbar({ onNavigate }: { onNavigate: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      dir="rtl"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#080c0a]/95 backdrop-blur-md border-b border-white/8 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          : "bg-[#080c0a]/80 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">

        {/* ── Logo (right in RTL) ── */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a4a2a] to-[#0f2d18] border border-[#c9a84c]/25 flex items-center justify-center text-lg shadow-[0_2px_8px_rgba(201,168,76,0.15)]">
            ☪️
          </div>
          <div className="leading-none">
            <div className="font-extrabold text-base text-white tracking-wide" style={{ fontFamily: "'Cairo', sans-serif" }}>
              Islam Reels
            </div>
            <div className="text-[10px] text-white/30 tracking-widest">نور في كل لحظة</div>
          </div>
        </div>

        {/* ── Desktop nav (center) ── */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: "المميزات", id: "features" },
            { label: "تواصل معنا", id: "contact" },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-sm font-semibold text-white/65 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* ── CTA (left in RTL) ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigate}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a7a3a] hover:bg-[#1f9044] active:scale-95 text-white font-bold text-sm transition-all duration-200 shadow-[0_2px_12px_rgba(26,122,58,0.4)] hover:shadow-[0_2px_18px_rgba(26,122,58,0.6)]"
          >
            <span>اذخل للتطبيق</span>
            <span className="text-base">🚀</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/5 transition"
            aria-label="القائمة"
          >
            <span className={`block h-0.5 bg-white/70 transition-all duration-300 ${menuOpen ? "w-5 rotate-45 translate-y-2" : "w-5"}`} />
            <span className={`block h-0.5 bg-white/70 transition-all duration-300 ${menuOpen ? "opacity-0 w-0" : "w-4"}`} />
            <span className={`block h-0.5 bg-white/70 transition-all duration-300 ${menuOpen ? "w-5 -rotate-45 -translate-y-2" : "w-5"}`} />
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 border-t border-white/6 bg-[#080c0a]/98 ${
          menuOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-4 flex flex-col gap-1">
          {[
            { label: "المميزات", id: "features" },
            { label: "تواصل معنا", id: "contact" },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-right py-3 text-sm font-semibold text-white/65 hover:text-white border-b border-white/5 last:border-0 transition-colors"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => { setMenuOpen(false); onNavigate(); }}
            className="mt-3 w-full py-3 rounded-xl bg-[#1a7a3a] hover:bg-[#1f9044] text-white font-bold text-sm transition"
          >
            🚀 اذخل للتطبيق
          </button>
        </div>
      </div>
    </header>
  );
}

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div dir="rtl" className="min-h-screen bg-[#080c0a] text-white overflow-x-hidden" style={{ fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Sticky Navbar ─────────────────────────────────────────────── */}
      <Navbar onNavigate={() => navigate("/reel")} />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center pt-16">

        {/* background radial glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#1a4a2a]/40 blur-[140px]" />
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-[#c9a84c]/5 blur-[100px]" />
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={`${import.meta.env.BASE_URL}icon-192.png`}
            alt="إسلام ريلز"
            className="w-24 h-24 rounded-[22px] shadow-[0_0_60px_#c9a84c30] mb-3"
          />
          <p className="text-[#c9a84c] font-extrabold text-2xl tracking-wide" style={{ fontFamily: "'Cairo', sans-serif" }}>
            إسلام ريلز
          </p>
          <p className="text-white/30 text-xs tracking-[4px] uppercase">Islam Reels</p>
        </div>

        {/* Basmala */}
        <p className="text-[#c9a84c]/60 text-base mb-1" style={{ fontFamily: "'Amiri', serif" }}>
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>
        <div className="flex items-center gap-3 text-[#c9a84c]/30 text-sm mb-7">
          <span>✦</span><span>✦</span><span>✦</span>
        </div>

        {/* badge */}
        <span className="mb-6 px-5 py-2 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/8 text-[#c9a84c] text-sm font-bold">
          ✨ &nbsp;ريلز قرآنية يومية
        </span>

        {/* headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-6 max-w-2xl">
          هذا العمل صدقة جارية للمسلمين
          <br />
          <span className="text-[#c9a84c]">فالدال على الخير كفاعله</span>
        </h1>

        {/* verse */}
        <div className="mb-8 max-w-lg">
          <p className="text-white/75 text-xl leading-loose" style={{ fontFamily: "'Amiri', serif" }}>
            ﴿ إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ ﴾
          </p>
          <p className="text-white/35 text-sm mt-1">— سورة الإسراء: ٩</p>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/reel")}
          className="group mb-4 px-10 py-4 rounded-2xl bg-[#c9a84c] hover:bg-[#d4b660] text-black font-extrabold text-lg transition-all shadow-[0_0_50px_#c9a84c35] hover:shadow-[0_0_70px_#c9a84c55]"
        >
          📖 ادخل وابدأ الاستماع
          <span className="mr-2 inline-block transition-transform group-hover:-translate-x-1">←</span>
        </button>
        <p className="text-white/30 text-xs tracking-wider">
          مجاناً &nbsp;·&nbsp; بدون تسجيل &nbsp;·&nbsp; ابدأ فوراً
        </p>

        {/* scroll hint */}
        <div className="absolute bottom-8 flex flex-col items-center gap-1 text-white/20 text-xs animate-bounce">
          <span>اكتشف المميزات</span>
          <span>↓</span>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="py-14 border-y border-white/6 bg-white/[0.015]">
        <div className="max-w-3xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#c9a84c]">{s.value}</p>
              <p className="text-white/45 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ticker ────────────────────────────────────────────────────── */}
      <div className="py-5 overflow-hidden border-b border-white/6 bg-[#0a0f0c]">
        <div
          className="flex gap-12 whitespace-nowrap"
          style={{ animation: "ticker 30s linear infinite" }}
        >
          {[...TICKER_VERSES, ...TICKER_VERSES].map((v, i) => (
            <span key={i} className="text-white/25 text-sm" style={{ fontFamily: "'Amiri', serif" }}>
              {v} &nbsp;✦
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-24">
        <p className="text-center text-[#c9a84c] text-sm font-bold mb-3 tracking-widest">لماذا تختارنا</p>
        <h2 className="text-center text-3xl sm:text-4xl font-extrabold mb-14">
          مميزات تجعل التدبر <span className="text-[#c9a84c]">أسهل</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-white/[0.03] border border-white/8 rounded-2xl p-7 hover:border-[#c9a84c]/35 hover:bg-white/[0.05] transition-all text-center"
            >
              <div className="text-4xl mb-5">{f.icon}</div>
              <h3 className="font-extrabold text-base mb-3">{f.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-16 text-center px-6 border-t border-white/6">
        <p className="text-[#c9a84c]/60 text-sm mb-3 tracking-widest">ابدأ رحلتك القرآنية</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-6">
          جاهز لإنشاء أول ريل قرآني؟
        </h2>
        <button
          onClick={() => navigate("/reel")}
          className="px-10 py-4 rounded-2xl bg-[#c9a84c] hover:bg-[#d4b660] text-black font-extrabold text-lg transition-all shadow-[0_0_40px_#c9a84c30]"
        >
          ابدأ الآن ←
        </button>
      </section>

      {/* ── Social ────────────────────────────────────────────────────── */}
      <section id="contact" className="px-6 py-20 border-t border-white/6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-[#c9a84c] text-sm font-bold mb-3 tracking-widest">تواصل معنا</p>
          <h2 className="text-center text-3xl sm:text-4xl font-extrabold mb-10">
            تابعنا على <span className="text-[#c9a84c]">منصاتنا</span>
          </h2>
          <div className="border border-white/10 rounded-2xl p-8 bg-white/[0.03]">
            <p className="text-center text-white/45 text-sm mb-8 leading-relaxed">
              كن جزءاً من مجتمعنا الإيماني — تابع جديد الريلز القرآنية وشارك في نشر كلام الله
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {SOCIAL.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl border border-white/15 bg-white/5 ${s.hoverBg} ${s.hoverBorder} text-white/75 hover:text-white font-bold text-sm transition-all`}
                >
                  {s.icon}
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/6 py-8 text-center">
        <p className="text-[#c9a84c]/50 text-sm mb-1" style={{ fontFamily: "'Amiri', serif" }}>
          إسلام ريلز ✨
        </p>
        <p className="text-white/20 text-xs">Islam Reels • مجاني بالكامل • لا تنسونا من دعاءكم 🤍</p>
      </footer>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
