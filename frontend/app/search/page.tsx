"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Car,
  Bike,
  Compass,
  Filter,
  ArrowUpDown,
  Search,
  X,
  Sparkles,
} from "lucide-react";
import { FilterBar } from "@/components/domain/FilterBar";
import { ListingCard } from "@/components/domain/ListingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { searchListings } from "@/lib/api";
import { Listing, SearchCategory } from "@/lib/types";

const FALLBACK_LISTINGS: Listing[] = [
  {
    id: "f1a2b3c4-0001-4000-8000-000000000001",
    seller_id: "s1",
    seller_name: "Karthik Raja",
    seller_type: "individual",
    category: "cars",
    title: "2021 Hyundai i20 Asta 1.2 MT",
    make: "Hyundai",
    model: "i20 Asta",
    year: 2021,
    price_paise: 82500000,
    city: "Chennai",
    state: "Tamil Nadu",
    registration_no_masked: "TN 09 ** 1234",
    mileage_km: 28400,
    fuel_type: "petrol",
    transmission: "manual",
    owners_count: 1,
    description: "Single owner well maintained car with full service record.",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    media: [
      {
        id: "m1",
        kind: "photo",
        storage_key: "k1",
        position: 0,
        url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "f1a2b3c4-0002-4000-8000-000000000002",
    seller_id: "s2",
    seller_name: "Apex Motors",
    seller_type: "dealer",
    category: "bikes",
    title: "2022 Royal Enfield Classic 350 Stealth Black",
    make: "Royal Enfield",
    model: "Classic 350",
    year: 2022,
    price_paise: 18500000,
    city: "Bengaluru",
    state: "Karnataka",
    registration_no_masked: "KA 05 ** 5678",
    mileage_km: 9800,
    fuel_type: "petrol",
    transmission: "manual",
    owners_count: 1,
    description: "Mint condition, first owner, dual channel ABS.",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    media: [
      {
        id: "m2",
        kind: "photo",
        storage_key: "k2",
        position: 0,
        url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "f1a2b3c4-0003-4000-8000-000000000003",
    seller_id: "s3",
    seller_name: "Rohit Verma",
    seller_type: "individual",
    category: "cars",
    title: "2020 Maruti Suzuki Swift ZXi AMT",
    make: "Maruti",
    model: "Swift ZXi",
    year: 2020,
    price_paise: 64000000,
    city: "Mumbai",
    state: "Maharashtra",
    registration_no_masked: "MH 02 ** 9012",
    mileage_km: 34000,
    fuel_type: "petrol",
    transmission: "automatic",
    owners_count: 1,
    description: "City driven car, excellent mileage, touch screen infotainment.",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    media: [
      {
        id: "m3",
        kind: "photo",
        storage_key: "k3",
        position: 0,
        url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "f1a2b3c4-0004-4000-8000-000000000004",
    seller_id: "s4",
    seller_name: "Sanjay Cycles",
    seller_type: "dealer",
    category: "cycles",
    title: "2023 Trek Marlin 7 Gen 3 Mountain Bike",
    make: "Trek",
    model: "Marlin 7",
    year: 2023,
    price_paise: 5200000,
    city: "Chennai",
    state: "Tamil Nadu",
    description: "Hydraulic disc brakes, Shimano Deore 1x10 drivetrain.",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    media: [
      {
        id: "m4",
        kind: "photo",
        storage_key: "k4",
        position: 0,
        url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters State
  const categoryParam = (searchParams.get("category") as SearchCategory) || "all";
  const cityParam = searchParams.get("city") || "";
  const queryParam = searchParams.get("q") || "";
  const sortParam = searchParams.get("sort_by") || "latest";

  const [category, setCategory] = useState<SearchCategory>(categoryParam);
  const [city, setCity] = useState(cityParam);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000000]); // in paise
  const [yearRange, setYearRange] = useState<[number, number]>([2010, 2026]);
  const [fuelType, setFuelType] = useState<string>("all");
  const [transmission, setTransmission] = useState<string>("all");

  useEffect(() => {
    setCategory((searchParams.get("category") as SearchCategory) || "all");
    setCity(searchParams.get("city") || "");
    setSearchQuery(searchParams.get("q") || "");
    setSortBy(searchParams.get("sort_by") || "latest");
  }, [searchParams]);

  useEffect(() => {
    async function loadListings() {
      setLoading(true);
      try {
        const res = await searchListings({
          category: category !== "all" ? category : undefined,
          city: city || undefined,
          q: searchQuery || undefined,
          sort_by: sortBy,
          min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
          max_price: priceRange[1] < 500000000 ? priceRange[1] : undefined,
          min_year: yearRange[0],
          max_year: yearRange[1],
          fuel_type: fuelType !== "all" ? fuelType : undefined,
          transmission: transmission !== "all" ? transmission : undefined,
          page,
          page_size: 20,
        });

        if (res.items && res.items.length > 0) {
          setListings(res.items);
          setTotalCount(res.total);
          setPages(res.pages);
        } else {
          // Client-side fallback filter on demo listings
          let filtered = [...FALLBACK_LISTINGS];
          if (category !== "all") {
            filtered = filtered.filter((l) => l.category === category);
          }
          if (city) {
            filtered = filtered.filter((l) => l.city.toLowerCase().includes(city.toLowerCase()));
          }
          if (searchQuery) {
            filtered = filtered.filter(
              (l) =>
                l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.make.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          if (fuelType !== "all") {
            filtered = filtered.filter((l) => l.fuel_type === fuelType);
          }
          if (transmission !== "all") {
            filtered = filtered.filter((l) => l.transmission === transmission);
          }
          setListings(filtered);
          setTotalCount(filtered.length);
          setPages(1);
        }
      } catch {
        // Fallback
        setListings(FALLBACK_LISTINGS);
        setTotalCount(FALLBACK_LISTINGS.length);
      } finally {
        setLoading(false);
      }
    }

    loadListings();
  }, [category, city, searchQuery, sortBy, priceRange, yearRange, fuelType, transmission, page]);

  const resetAllFilters = () => {
    setCategory("all");
    setCity("");
    setSearchQuery("");
    setSortBy("latest");
    setPriceRange([0, 500000000]);
    setYearRange([2010, 2026]);
    setFuelType("all");
    setTransmission("all");
    router.push("/search");
  };

  const hasActiveFilters =
    category !== "all" ||
    Boolean(city) ||
    Boolean(searchQuery) ||
    fuelType !== "all" ||
    transmission !== "all";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Category Pills Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "all", label: "All Vehicles", icon: Sparkles },
          { id: "cars", label: "Cars", icon: Car },
          { id: "bikes", label: "Bikes & Scooters", icon: Bike },
          { id: "cycles", label: "Bicycles", icon: Compass },
        ].map((c) => {
          const Icon = c.icon;
          const isSelected = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                setCategory(c.id as any);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                isSelected
                  ? "bg-ink-900 text-paper shadow-xs"
                  : "bg-surface hover:bg-surface-elevated text-ink-700 border border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Filters Sidebar + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-1">
          <FilterBar
            filters={{
              category,
              city,
              minPrice: priceRange[0] > 0 ? String(priceRange[0] / 100) : "",
              maxPrice: priceRange[1] < 500000000 ? String(priceRange[1] / 100) : "",
              sortBy,
              fuelType,
              transmission,
            }}
            onFilterChange={(newFilters) => {
              if (newFilters.category) setCategory(newFilters.category as any);
              if (newFilters.city !== undefined) setCity(newFilters.city);
              if (newFilters.sortBy) setSortBy(newFilters.sortBy);
              if (newFilters.fuelType) setFuelType(newFilters.fuelType);
              if (newFilters.transmission) setTransmission(newFilters.transmission);
              const minP = newFilters.minPrice ? Number(newFilters.minPrice) * 100 : 0;
              const maxP = newFilters.maxPrice ? Number(newFilters.maxPrice) * 100 : 500000000;
              setPriceRange([minP, maxP]);
              setPage(1);
            }}
            onReset={resetAllFilters}
          />
        </div>

        {/* Right Listings Results */}
        <div className="lg:col-span-3 space-y-5">
          {/* Results Header: Count & Sort */}
          <div className="bg-paper border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <h2 className="font-heading font-bold text-sm sm:text-base text-ink-900">
                {loading ? "Searching vehicles..." : `${totalCount} Verified Vehicles Found`}
              </h2>
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {category !== "all" && (
                    <span className="text-[11px] font-medium bg-surface border border-border px-2 py-0.5 rounded-md text-ink-700 flex items-center gap-1">
                      <span>{category.toUpperCase()}</span>
                      <button onClick={() => setCategory("all")}>
                        <X className="w-3 h-3 text-ink-400 hover:text-ink-900" />
                      </button>
                    </span>
                  )}
                  {city && (
                    <span className="text-[11px] font-medium bg-surface border border-border px-2 py-0.5 rounded-md text-ink-700 flex items-center gap-1">
                      <span>{city}</span>
                      <button onClick={() => setCity("")}>
                        <X className="w-3 h-3 text-ink-400 hover:text-ink-900" />
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="text-[11px] font-medium bg-surface border border-border px-2 py-0.5 rounded-md text-ink-700 flex items-center gap-1">
                      <span>"{searchQuery}"</span>
                      <button onClick={() => setSearchQuery("")}>
                        <X className="w-3 h-3 text-ink-400 hover:text-ink-900" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={resetAllFilters}
                    className="text-[11px] font-semibold text-accent-600 hover:underline ml-1"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-ink-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-surface border border-border text-xs font-semibold text-ink-800 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="latest">Latest Listed</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="mileage_asc">Lowest Kilometers</option>
                <option value="year_desc">Newest Year</option>
              </select>
            </div>
          </div>

          {/* Listings Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-paper border border-border rounded-2xl p-3 space-y-3">
                  <Skeleton className="aspect-16/10 w-full rounded-xl" />
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                  <Skeleton className="h-8 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {listings.map((listing) => {
                const firstPhoto =
                  listing.media && listing.media.length > 0
                    ? listing.media[0].url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"
                    : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80";

                return (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    category={listing.category}
                    year={listing.year}
                    pricePaise={listing.price_paise}
                    city={listing.city}
                    registrationMasked={listing.registration_no_masked}
                    mileageKm={listing.mileage_km}
                    fuelType={listing.fuel_type}
                    transmission={listing.transmission}
                    imageUrl={firstPhoto}
                    isVerified={true}
                    onClick={() => router.push(`/listings/${listing.id}`)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-paper border border-border rounded-2xl p-12 text-center">
              <EmptyState
                title="No Matching Vehicles Found"
                description="Try broadening your search filters, adjusting the price range, or selecting a different city."
                actionLabel="Reset All Filters"
                onAction={resetAllFilters}
              />
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-border bg-paper hover:bg-surface rounded-xl text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-ink-600 font-medium px-2">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-4 py-2 border border-border bg-paper hover:bg-surface rounded-xl text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8"><Skeleton className="h-64 w-full rounded-2xl" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
