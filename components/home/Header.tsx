"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/#services", label: "Services" },
  { href: "/#contact", label: "Contact" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.includes("#")) return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || isOpen
          ? "bg-background/85 backdrop-blur-md border-b border-border shadow-soft"
          : "bg-background border-b border-transparent"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <img
              src="/logo.png"
              alt="Thayineri Muslim Jama-ath Committee"
              className="h-11 w-auto lg:h-12"
            />
            <div className="pt-1">
              <p className="font-semibold leading-tight text-foreground text-sm sm:text-base">
                THAYINERI MUSLIM
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground tracking-wide">
                JAMA-ATH COMMITTEE
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors relative",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/dashboard">
              <Button size="default" className="h-10 rounded-lg px-5">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            </Link>
          </nav>

          <button
            className="md:hidden p-2 -mr-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-background border-t border-border h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="container mx-auto px-6 py-6 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "py-4 border-b border-border/60 text-base font-medium transition-colors",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-6 pb-8">
              <Link href="/dashboard">
                <Button className="w-full h-12 rounded-lg text-base font-semibold" size="lg">
                  <LogIn className="w-5 h-5 mr-2" />
                  Login
                </Button>
              </Link>
              <p className="mt-6 text-center text-xs text-muted-foreground">
                THAYINERI MUSLIM JAMA-ATH COMMITTEE
              </p>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}