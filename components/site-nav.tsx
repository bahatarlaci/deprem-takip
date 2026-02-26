"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/depremler", label: "Depremler" },
  { href: "/harita", label: "Harita" },
  { href: "/risk", label: "Risk" },
  { href: "/bildirimler", label: "Bildirimler" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 rounded-2xl border border-border/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md md:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">AFAD Earthquake API</p>
          <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Deprem Takip Platformu</h1>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Ana gezinme">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white text-muted-foreground hover:border-primary/45 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
