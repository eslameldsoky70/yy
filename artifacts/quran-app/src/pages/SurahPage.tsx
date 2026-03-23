import { useParams, Link } from "wouter";
import { useGetSurah } from "@workspace/api-client-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { toArabicDigits, getRevelationTypeArabic } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronRight, Info } from "lucide-react";

export default function SurahPage() {
  const params = useParams();
  const surahNumber = Number(params.number);
  const { data: surah, isLoading, isError } = useGetSurah(surahNumber);

  if (isLoading) return <LoadingSpinner size={64} className="min-h-[70vh]" />;
  if (isError || !surah) return (
    <div className="text-center py-20">
      <p className="text-destructive font-bold text-xl">حدث خطأ أو أن السورة غير موجودة.</p>
      <Link href="/" className="text-primary hover:underline mt-4 inline-block">العودة للرئيسية</Link>
    </div>
  );

  const showBismillah = surah.number !== 1 && surah.number !== 9;
  
  // Surah 1 includes Bismillah as the first ayah. For others, it's usually omitted from the API data
  // but displayed structurally at the top.

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-12 pb-24"
    >
      {/* Surah Header */}
      <div className="bg-card rounded-3xl p-8 md:p-12 shadow-xl shadow-primary/5 border border-border relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        
        <Link href="/" className="absolute top-6 right-6 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-bold text-sm bg-muted px-4 py-2 rounded-xl">
          <ChevronRight className="w-4 h-4" />
          الفهرس
        </Link>

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent font-bold text-2xl mb-6 border-4 border-background shadow-sm">
          {toArabicDigits(surah.number)}
        </div>

        <h1 className="text-5xl md:text-7xl font-amiri font-bold text-primary mb-6 leading-tight">
          {surah.name}
        </h1>
        
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold">
          <span className="bg-muted text-foreground px-4 py-2 rounded-xl flex items-center gap-2">
            <Info className="w-4 h-4 text-accent" />
            {getRevelationTypeArabic(surah.revelationType)}
          </span>
          <span className="bg-muted text-foreground px-4 py-2 rounded-xl">
            آياتها: {toArabicDigits(surah.numberOfAyahs)}
          </span>
          <span className="bg-muted text-foreground px-4 py-2 rounded-xl" dir="ltr">
            {surah.englishName}
          </span>
        </div>
      </div>

      {/* Reading Container */}
      <div className="bg-card rounded-3xl p-6 md:p-12 shadow-2xl shadow-black/5 border border-border">
        {showBismillah && (
          <div className="flex justify-center mb-16 border-b border-border/50 pb-12">
            <img 
              src={`${import.meta.env.BASE_URL}images/bismillah.png`} 
              alt="Bismillah" 
              className="w-full max-w-sm opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
        )}

        <div 
          className="font-amiri text-[2rem] md:text-[2.5rem] leading-[2.6] md:leading-[3] text-justify text-foreground"
          dir="rtl"
        >
          {surah.ayahs.map((ayah) => {
            // For Surah 1, if it's the first ayah, sometimes apps treat it differently, 
            // but we render exactly what the API provides.
            return (
              <span key={ayah.number} className="relative inline hover:bg-accent/5 transition-colors rounded-lg">
                {ayah.text}
                <span className="ayah-marker">
                  {toArabicDigits(ayah.numberInSurah)}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
