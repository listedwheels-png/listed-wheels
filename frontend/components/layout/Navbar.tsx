"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Car,
  Bike,
  Compass,
  Heart,
  PlusCircle,
  Search,
  User,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Menu,
  X,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SignInModal } from "@/components/ui/SignInModal";
import { Button } from "@/components/ui/Button";

const POPULAR_CITIES = [
  "All India",
  "Chennai",
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Coimbatore",
  "Kochi",
];

export function Navbar() {
  const router = useRouter();
  const { user, signOut, isSignInModalOpen, openSignInModal, closeSignInModal } = useAuth();
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("All India");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setIsCityOpen(false);
    if (city === "All India") {
      router.push("/search");
    } else {
      router.push(`/search?city=${encodeURIComponent(city)}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-paper/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center text-ink-900 shadow-sm group-hover:scale-105 transition-transform duration-200">
                  <Car className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-xl tracking-tight text-ink-900 leading-none">
                    Listed<span className="text-accent-500">Wheels</span>
                  </span>
                  <span className="text-[10px] text-ink-500 tracking-wider uppercase font-medium mt-0.5">
                    Verified Direct Marketplace
                  </span>
                </div>
              </Link>

              {/* City Selector Dropdown */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsCityOpen(!isCityOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink-700 bg-surface hover:bg-surface-elevated border border-border rounded-lg transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-accent-500" />
                  <span>{selectedCity}</span>
                  <ChevronDown className="w-3 h-3 text-ink-400" />
                </button>

                {isCityOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-paper border border-border rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95">
                    {POPULAR_CITIES.map((city) => (
                      <button
                        key={city}
                        onClick={() => handleCitySelect(city)}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-surface flex items-center justify-between ${
                          selectedCity === city ? "font-semibold text-accent-500 bg-surface/50" : "text-ink-700"
                        }`}
                      >
                        {city}
                        {selectedCity === city && <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Search Bar */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md relative">
              <input
                type="text"
                placeholder="Search cars, bikes, cycles (e.g. Swift, Thar, Royal Enfield)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border focus:border-accent-500 focus:bg-paper text-ink-900 placeholder:text-ink-400 text-xs rounded-xl pl-9 pr-4 py-2 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5 pointer-events-none" />
            </form>

            {/* Right Action Icons & CTA */}
            <div className="flex items-center gap-3">
              {/* Category Quick Links (Desktop) */}
              <nav className="hidden xl:flex items-center gap-1 text-xs font-medium text-ink-700 mr-2">
                <Link href="/search?category=cars" className="px-3 py-1.5 rounded-lg hover:bg-surface hover:text-ink-900 transition-colors">
                  Cars
                </Link>
                <Link href="/search?category=bikes" className="px-3 py-1.5 rounded-lg hover:bg-surface hover:text-ink-900 transition-colors">
                  Bikes
                </Link>
                <Link href="/search?category=cycles" className="px-3 py-1.5 rounded-lg hover:bg-surface hover:text-ink-900 transition-colors">
                  Cycles
                </Link>
              </nav>

              {/* Favorites Link */}
              <Link
                href="/favorites"
                className="hidden sm:flex p-2 text-ink-600 hover:text-ink-900 hover:bg-surface rounded-lg transition-colors relative"
                title="Saved Listings"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Post Ad Button (Saffron #F5A524) */}
              <Link href="/sell">
                <button className="flex items-center gap-1.5 bg-accent-500 hover:bg-accent-600 text-ink-900 font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Sell Vehicle</span>
                </button>
              </Link>

              {/* User Menu / Sign In */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl border border-border hover:bg-surface transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-ink-900 text-paper text-xs font-bold flex items-center justify-center">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                    <span className="hidden md:inline text-xs font-medium text-ink-800 max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-ink-400 hidden md:block" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-paper border border-border rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-xs font-semibold text-ink-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-ink-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-surface text-ink-700">
                          {user.role}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-ink-700 hover:bg-surface hover:text-ink-900"
                        >
                          <LayoutDashboard className="w-4 h-4 text-ink-400" />
                          Seller Dashboard
                        </Link>
                        <Link
                          href="/favorites"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-ink-700 hover:bg-surface hover:text-ink-900"
                        >
                          <Heart className="w-4 h-4 text-ink-400" />
                          Saved Listings
                        </Link>
                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-accent-600 font-medium hover:bg-surface"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Admin Moderation Portal
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-border pt-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            signOut();
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-danger hover:bg-surface"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={openSignInModal}
                  className="text-xs font-semibold text-ink-800 hover:text-ink-900 bg-surface hover:bg-surface-elevated border border-border px-3.5 py-2 rounded-xl transition-colors"
                >
                  Sign In
                </button>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-ink-700 hover:bg-surface rounded-lg lg:hidden"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Collapsible Search & Category Bar */}
          {isMobileMenuOpen && (
            <div className="lg:hidden pb-4 pt-2 border-t border-border space-y-3">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search cars, bikes, cycles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface border border-border text-ink-900 text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none"
                />
                <Search className="w-4 h-4 text-ink-400 absolute left-3 top-3 pointer-events-none" />
              </form>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <Link
                  href="/search?category=cars"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-surface rounded-xl flex flex-col items-center gap-1 text-ink-800"
                >
                  <Car className="w-4 h-4 text-accent-500" />
                  <span>Cars</span>
                </Link>
                <Link
                  href="/search?category=bikes"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-surface rounded-xl flex flex-col items-center gap-1 text-ink-800"
                >
                  <Bike className="w-4 h-4 text-accent-500" />
                  <span>Bikes</span>
                </Link>
                <Link
                  href="/search?category=cycles"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-surface rounded-xl flex flex-col items-center gap-1 text-ink-800"
                >
                  <Compass className="w-4 h-4 text-accent-500" />
                  <span>Cycles</span>
                </Link>
                <Link
                  href="/search?category=other"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-surface rounded-xl flex flex-col items-center gap-1 text-ink-800"
                >
                  <PlusCircle className="w-4 h-4 text-accent-500" />
                  <span>Other</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Global SignIn Modal */}
      <SignInModal isOpen={isSignInModalOpen} onClose={closeSignInModal} />
    </>
  );
}
