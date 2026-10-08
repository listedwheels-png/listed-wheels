"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, Heart, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const pathname = usePathname();
  const { user, openSignInModal } = useAuth();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Browse", href: "/search", icon: Search },
    { label: "Sell", href: "/sell", icon: PlusCircle, isSpecial: true },
    { label: "Saved", href: "/favorites", icon: Heart },
    {
      label: "Account",
      href: user ? "/dashboard" : "#",
      icon: User,
      onClick: user ? undefined : openSignInModal,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-lg border-t border-border sm:hidden shadow-lg">
      <div className="grid grid-cols-5 h-14 max-w-md mx-auto items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-4 group"
              >
                <div className="w-11 h-11 rounded-full bg-accent-500 flex items-center justify-center text-ink-900 shadow-md group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-semibold text-accent-600 mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          }

          if (item.onClick) {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center py-1 text-ink-500 hover:text-ink-900 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive ? "text-accent-600 font-semibold" : "text-ink-500 hover:text-ink-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
