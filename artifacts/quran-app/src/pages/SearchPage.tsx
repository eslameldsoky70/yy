import { useSearch } from "wouter";
import { useSearchQuran } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Search, ChevronLeft, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { toArabicDigits } from "@/lib/utils";
import { motion } from "framer-motion";

export default function SearchPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const q = params.get("q") || "";

  const { data: results, isLoading, isError } = useSearchQuran(
    { q },
    { query: { enabled: q.length > 2 } }
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-primary text-primary-foreground rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/hero-bg.png')] bg-cover mix-blend-overlay" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-background/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">نتائج البحث</h1>
            <p className="text-primary-foreground/80 font-medium">
              {q ? `جاري البحث عن: "${q}"` : "أدخل كلمة للبحث في آيات القرآن الكريم (3 أحرف على الأقل)"}
            </p>
          </div>
        </div>
      </div>

      {isLoading && q.length > 2 && (
        <LoadingSpinner size={48} className="py-20" />
      )}

      {isError && (
        <div className="bg-destructive/10 text-destructive p-6 rounded-2xl flex items-center gap-4">
          <AlertCircle className="w-8 h-8" />
          <p className="font-bold text-lg">حدث خطأ أثناء البحث. يرجى المحاولة بكلمة أخرى.</p>
        </div>
      )}

      {!isLoading && !isError && results && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-xl font-bold text-foreground">
              تم العثور على <span className="text-accent">{toArabicDigits(results.length)}</span> نتيجة
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-xl font-bold text-muted-foreground">لا توجد نتائج مطابقة لبحثك</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {results.map((result, i) => (
                <motion.div
                  key={`${result.surahNumber}-${result.ayahNumber}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link 
                    href={`/surah/${result.surahNumber}`}
                    className="block bg-card hover:bg-accent/5 p-6 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-accent/40 transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-xl text-sm font-bold flex items-center gap-2">
                          سورة {result.surahName}
                        </span>
                        <span className="bg-muted text-muted-foreground px-4 py-1.5 rounded-xl text-sm font-bold">
                          آية {toArabicDigits(result.ayahNumber)}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                         <ChevronLeft className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <p className="font-amiri text-2xl leading-loose text-foreground">
                      {/* Optional: We could highlight the matched text here if the exact query was known and simple, 
                          but displaying the beautiful font is good enough for a reliable result */}
                      {result.text}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
