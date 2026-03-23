import { Link, useLocation } from "wouter";
import { useGetSurahs } from "@workspace/api-client-react";
import { Book, Search, Library, Film } from "lucide-react";
import { cn, toArabicDigits } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function Sidebar() {
  const [location] = useLocation();
  const { data: surahs, isLoading } = useGetSurahs();

  return (
    <aside className="w-80 border-l border-border bg-sidebar h-screen sticky top-0 hidden lg:flex flex-col shadow-xl shadow-black/5 z-20">
      <div className="p-6 border-b border-border bg-sidebar/50 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:shadow-primary/30 group-hover:-translate-y-0.5 transition-all duration-300">
            <Book className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-amiri font-bold text-primary">القرآن الكريم</h1>
            <p className="text-xs text-muted-foreground font-medium">قراءة وبحث</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2">
        <div className="mb-4 space-y-1">
          <Link 
            href="/search"
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              location === "/search" 
                ? "bg-accent/10 text-accent-foreground font-bold" 
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground"
            )}
          >
            <Search className="w-5 h-5" />
            <span>البحث المتقدم</span>
          </Link>
          <Link 
            href="/reel"
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              location === "/reel" 
                ? "bg-accent/10 text-accent-foreground font-bold" 
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground"
            )}
          >
            <Film className="w-5 h-5" />
            <span>صانع الريلز</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 mb-2 text-primary font-bold">
          <Library className="w-5 h-5" />
          <span>فهرس السور</span>
        </div>

        {isLoading ? (
          <LoadingSpinner size={24} />
        ) : (
          surahs?.map((surah) => {
            const isActive = location === `/surah/${surah.number}`;
            return (
              <Link
                key={surah.number}
                href={`/surah/${surah.number}`}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "hover:bg-sidebar-accent text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    isActive ? "bg-primary-foreground/20" : "bg-accent/10 text-accent-foreground group-hover:bg-accent/20"
                  )}>
                    {toArabicDigits(surah.number)}
                  </span>
                  <span className="font-amiri text-lg pt-1">{surah.name}</span>
                </div>
                <span className={cn(
                  "text-xs",
                  isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {toArabicDigits(surah.numberOfAyahs)} آية
                </span>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
