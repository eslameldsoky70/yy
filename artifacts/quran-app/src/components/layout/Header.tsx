import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, Book } from "lucide-react";

export function Header() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        {/* Mobile Logo & Menu */}
        <div className="flex items-center gap-3 lg:hidden">
          <button className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Book className="w-5 h-5" />
            </div>
            <span className="font-amiri text-xl font-bold text-primary">القرآن</span>
          </Link>
        </div>

        {/* Desktop Title / Empty Space for alignment */}
        <div className="hidden lg:block">
           <p className="text-muted-foreground text-sm font-medium">بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ</p>
        </div>

        {/* Search Form */}
        <div className="flex-1 max-w-xl mx-4 lg:mx-0">
          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              placeholder="ابحث في آيات القرآن الكريم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border-2 border-border text-foreground px-12 py-3 rounded-2xl outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all duration-300 placeholder:text-muted-foreground shadow-sm group-hover:shadow-md"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-accent" />
            <button 
              type="submit"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
            >
              بحث
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
