"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  Bike,
  Compass,
  PlusCircle,
  Search,
  ShieldCheck,
  MessageCircle,
  Camera,
  MapPin,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Lock,
  BadgeCheck,
} from "lucide-react";
import { ListingCard } from "@/components/domain/ListingCard";

const SAMPLE_FEATURED_LISTINGS = [
  {
    id: "f1a2b3c4-0001-4000-8000-000000000001",
    title: "2021 Hyundai i20 Asta 1.2 MT",
    category: "cars" as const,
    year: 2021,
    pricePaise: 82500000,
    city: "Chennai",
    registrationMasked: "TN 09 ** 1234",
    mileageKm: 28400,
    fuelType: "petrol",
    transmission: "manual",
    imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
    isVerified: true,
  },
  {
    id: "f1a2b3c4-0002-4000-8000-000000000002",
    title: "2022 Royal Enfield Classic 350 Stealth Black",
    category: "bikes" as const,
    year: 2022,
    pricePaise: 18500000,
    city: "Bengaluru",
    registrationMasked: "KA 05 ** 5678",
    mileageKm: 9800,
    fuelType: "petrol",
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
    isVerified: true,
  },
  {
    id: "f1a2b3c4-0003-4000-8000-000000000003",
    title: "2020 Maruti Suzuki Swift ZXi AMT",
    category: "cars" as const,
    year: 2020,
    pricePaise: 64000000,
    city: "Mumbai",
    registrationMasked: "MH 02 ** 9012",
    mileageKm: 34000,
    fuelType: "petrol",
    transmission: "automatic",
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
    isVerified: true,
  },
  {
    id: "f1a2b3c4-0004-4000-8000-000000000004",
    title: "2023 Trek Marlin 7 Gen 3 Mountain Bike",
    category: "cycles" as const,
    year: 2023,
    pricePaise: 5200000,
    city: "Chennai",
    imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80",
    isVerified: true,
  },
];

const POPULAR_CITIES = [
  { name: "Chennai", state: "Tamil Nadu", count: "1,420+ vehicles" },
  { name: "Bengaluru", state: "Karnataka", count: "2,180+ vehicles" },
  { name: "Mumbai", state: "Maharashtra", count: "1,890+ vehicles" },
  { name: "Delhi NCR", state: "Delhi", count: "2,450+ vehicles" },
  { name: "Hyderabad", state: "Telangana", count: "1,260+ vehicles" },
  { name: "Pune", state: "Maharashtra", count: "980+ vehicles" },
  { name: "Coimbatore", state: "Tamil Nadu", count: "640+ vehicles" },
  { name: "Kochi", state: "Kerala", count: "590+ vehicles" },
];

export default function HomePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<"cars" | "bikes" | "cycles">("cars");
  const [city, setCity] = useState("All Cities");
  const [searchQuery, setSearchQuery] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (activeCategory) params.append("category", activeCategory);
    if (city !== "All Cities") params.append("city", city);
    if (searchQuery.trim()) params.append("q", searchQuery.trim());
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface via-surface/60 to-paper pt-8 pb-16 border-b border-border">
        {/* Background ambient accents */}
        <div className="absolute top-0 right-1/4 -z-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-10 -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-2xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-100 border border-accent-200 text-accent-800 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-accent-600" />
              <span>India's Verified Direct Vehicle Marketplace</span>
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl text-ink-900 tracking-tight leading-tight">
              Buy & Sell Pre-Owned Wheels with <span className="text-accent-600">100% Trust.</span>
            </h1>

            <p className="text-sm sm:text-base text-ink-600 max-w-2xl mx-auto leading-relaxed">
              Connect directly with verified vehicle owners on WhatsApp. RTO registration checks,
              zero spam calls, and full 1-year listing validity.
            </p>
          </div>

          {/* Interactive Hero Search Box */}
          <div className="mt-8 max-w-4xl mx-auto bg-paper border border-border rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            {/* Category Selectors */}
            <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
              {[
                { id: "cars", label: "Cars", icon: Car },
                { id: "bikes", label: "Bikes & Scooters", icon: Bike },
                { id: "cycles", label: "Bicycles & MTBs", icon: Compass },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                      isSelected
                        ? "bg-accent-500 text-ink-900 shadow-sm"
                        : "text-ink-600 hover:text-ink-900 hover:bg-surface"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Inputs & Search CTA */}
            <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* City selector */}
              <div className="sm:col-span-4 relative">
                <label className="text-[10px] uppercase font-bold text-ink-500 block mb-1">
                  Location
                </label>
                <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2.5">
                  <MapPin className="w-4 h-4 text-accent-500 shrink-0" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-ink-900 font-medium outline-none cursor-pointer"
                  >
                    <option value="All Cities">All India</option>
                    <option value="Chennai">Chennai, TN</option>
                    <option value="Bengaluru">Bengaluru, KA</option>
                    <option value="Mumbai">Mumbai, MH</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Hyderabad">Hyderabad, TS</option>
                    <option value="Pune">Pune, MH</option>
                    <option value="Coimbatore">Coimbatore, TN</option>
                    <option value="Kochi">Kochi, KL</option>
                  </select>
                </div>
              </div>

              {/* Keyword / Model input */}
              <div className="sm:col-span-5 relative">
                <label className="text-[10px] uppercase font-bold text-ink-500 block mb-1">
                  Model or Brand
                </label>
                <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2.5">
                  <Search className="w-4 h-4 text-ink-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. Swift, Thar, Creta, Classic 350..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-ink-900 placeholder:text-ink-400 outline-none"
                  />
                </div>
              </div>

              {/* Search Button (Saffron) */}
              <div className="sm:col-span-3 sm:pt-4">
                <button
                  type="submit"
                  className="w-full bg-accent-500 hover:bg-accent-600 text-ink-900 font-bold text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Search Wheels</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Category Browse Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-ink-900">
              Browse by Vehicle Category
            </h2>
            <p className="text-xs sm:text-sm text-ink-500 mt-1">
              Explore verified second-hand listings across all vehicle classes
            </p>
          </div>
          <Link
            href="/search"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-accent-600 hover:text-accent-700"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: "Used Cars",
              category: "cars",
              count: "4,850+ Verified",
              icon: Car,
              bg: "bg-blue-50 text-blue-600",
            },
            {
              title: "Bikes & Scooters",
              category: "bikes",
              count: "3,200+ Verified",
              icon: Bike,
              bg: "bg-emerald-50 text-emerald-600",
            },
            {
              title: "Bicycles & MTBs",
              category: "cycles",
              count: "1,140+ Verified",
              icon: Compass,
              bg: "bg-amber-50 text-amber-600",
            },
            {
              title: "Commercial & Other",
              category: "other",
              count: "480+ Verified",
              icon: PlusCircle,
              bg: "bg-purple-50 text-purple-600",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.category}
                href={`/search?category=${item.category}`}
                className="p-5 bg-paper hover:bg-surface border border-border hover:border-accent-500/50 rounded-2xl transition-all group shadow-xs hover:shadow-md"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${item.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-semibold text-sm sm:text-base text-ink-900">
                  {item.title}
                </h3>
                <p className="text-xs text-ink-500 mt-0.5">{item.count}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Verified Vehicles Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-success mb-1">
              <BadgeCheck className="w-4 h-4" />
              <span>Verified Direct Listings</span>
            </div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-ink-900">
              Fresh Verified Arrivals
            </h2>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-1 text-xs font-semibold text-accent-600 hover:text-accent-700"
          >
            <span>Explore All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SAMPLE_FEATURED_LISTINGS.map((listing) => (
            <ListingCard
              key={listing.id}
              id={listing.id}
              title={listing.title}
              category={listing.category}
              year={listing.year}
              pricePaise={listing.pricePaise}
              city={listing.city}
              registrationMasked={listing.registrationMasked}
              mileageKm={listing.mileageKm}
              fuelType={listing.fuelType}
              transmission={listing.transmission}
              imageUrl={listing.imageUrl}
              isVerified={listing.isVerified}
              onClick={() => router.push(`/listings/${listing.id}`)}
            />
          ))}
        </div>
      </section>

      {/* Trust & Safety Section (Why ListedWheels) */}
      <section className="bg-surface border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink-900">
              Why Buyers & Sellers Prefer ListedWheels
            </h2>
            <p className="text-xs sm:text-sm text-ink-600 mt-2">
              Built from the ground up for trust, privacy, and frictionless peer-to-peer vehicle trade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-paper p-6 rounded-2xl border border-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-sm sm:text-base text-ink-900">
                1 Active Ad per Vehicle
              </h3>
              <p className="text-xs text-ink-600 leading-relaxed">
                SHA-256 hashed registration index enforces one active listing per vehicle, eliminating duplicate scam ads.
              </p>
            </div>

            <div className="bg-paper p-6 rounded-2xl border border-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-success/15 text-success flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-sm sm:text-base text-ink-900">
                Direct WhatsApp Connect
              </h3>
              <p className="text-xs text-ink-600 leading-relaxed">
                Chat directly with sellers without middleman telecallers or brokers taking unwanted commissions.
              </p>
            </div>

            <div className="bg-paper p-6 rounded-2xl border border-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-sm sm:text-base text-ink-900">
                EXIF Stripped Media
              </h3>
              <p className="text-xs text-ink-600 leading-relaxed">
                All photos are stripped of GPS location data and converted to WebP before CDN delivery to safeguard your privacy.
              </p>
            </div>

            <div className="bg-paper p-6 rounded-2xl border border-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-sm sm:text-base text-ink-900">
                365-Day Listing Validity
              </h3>
              <p className="text-xs text-ink-600 leading-relaxed">
                No monthly re-listing fees. Transparent flat listing plans with full GST tax invoice compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Cities in India Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-ink-900">
            Explore Wheels in Top Indian Cities
          </h2>
          <p className="text-xs sm:text-sm text-ink-500 mt-1">
            Find pre-owned cars, bikes, and bicycles nearby
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {POPULAR_CITIES.map((c) => (
            <Link
              key={c.name}
              href={`/search?city=${encodeURIComponent(c.name)}`}
              className="p-4 bg-paper hover:bg-surface border border-border rounded-xl transition-all flex items-center justify-between group"
            >
              <div>
                <span className="font-semibold text-xs sm:text-sm text-ink-900 block group-hover:text-accent-600 transition-colors">
                  {c.name}
                </span>
                <span className="text-[11px] text-ink-500 block">{c.count}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </section>

      {/* Post Ad Saffron CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-accent-500 to-amber-500 rounded-3xl p-8 sm:p-12 text-ink-900 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-ink-900 tracking-tight">
              Ready to Sell Your Vehicle?
            </h2>
            <p className="text-xs sm:text-sm font-medium text-ink-800 max-w-lg">
              Post your vehicle in less than 2 minutes. Get verified direct buyer inquiries on WhatsApp.
            </p>
          </div>

          <Link href="/sell">
            <button className="bg-ink-900 hover:bg-ink-800 text-paper font-bold text-sm sm:text-base py-3.5 px-7 rounded-2xl shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shrink-0">
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              <span>Post Your Vehicle Ad</span>
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
