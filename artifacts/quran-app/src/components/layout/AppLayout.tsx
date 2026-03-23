import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background selection:bg-accent/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[url('/images/hero-bg.png')] bg-fixed bg-cover bg-center">
        <div className="min-h-screen bg-background/95 backdrop-blur-[2px] flex flex-col">
          <Header />
          <main className="flex-1 overflow-x-hidden">
            <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
