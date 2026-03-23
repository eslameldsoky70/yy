import { useGetSurahs } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toArabicDigits, getRevelationTypeArabic } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BookOpen } from "lucide-react";

export default function HomePage() {
  const { data: surahs, isLoading, isError } = useGetSurahs();

  if (isLoading) return <LoadingSpinner size={48} className="min-h-[60vh]" />;
  if (isError) return (
    <div className="text-center py-20">
      <p className="text-destructive font-bold text-xl">حدث خطأ أثناء تحميل السور. يرجى المحاولة لاحقاً.</p>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20 p-8 md:p-16 flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-bg.png')] bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        <div className="relative z-10 flex flex-col items-center">
          <img 
            src={`${import.meta.env.BASE_URL}images/bismillah.png`} 
            alt="Bismillah" 
            className="w-full max-w-sm md:max-w-lg object-contain mb-8 drop-shadow-2xl brightness-0 invert"
          />
          <p className="text-lg md:text-2xl text-primary-foreground/90 max-w-2xl font-medium leading-relaxed">
            كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ وَلِيَتَذَكَّرَ أُولُو الْأَلْبَابِ
          </p>
        </div>
      </section>

      {/* Surah Grid */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-8 h-8 text-accent" />
          <h2 className="text-3xl font-bold text-foreground">سور القرآن الكريم</h2>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.05 }}
        >
          {surahs?.map((surah, i) => (
            <motion.div
              key={surah.number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Link 
                href={`/surah/${surah.number}`}
                className="group block bg-card rounded-2xl p-6 border-2 border-border/50 shadow-lg shadow-black/5 hover:shadow-xl hover:border-accent/60 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full -z-10 group-hover:bg-accent/10 transition-colors" />
                
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-background border-2 border-accent/20 flex items-center justify-center text-accent font-bold text-lg group-hover:bg-accent group-hover:text-accent-foreground transition-colors shadow-inner">
                    {toArabicDigits(surah.number)}
                  </div>
                  <div className="text-left" dir="ltr">
                    <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">{surah.englishName}</h3>
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]" title={surah.englishNameTranslation}>
                      {surah.englishNameTranslation}
                    </p>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-muted text-muted-foreground rounded-lg text-xs font-bold mb-2">
                      {getRevelationTypeArabic(surah.revelationType)}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {toArabicDigits(surah.numberOfAyahs)} آيات
                    </p>
                  </div>
                  <h2 className="text-3xl font-amiri font-bold text-primary group-hover:text-accent transition-colors">
                    {surah.name}
                  </h2>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
