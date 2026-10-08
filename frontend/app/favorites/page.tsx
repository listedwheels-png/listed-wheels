"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft, Trash2, ExternalLink } from "lucide-react";
import { ListingCard } from "@/components/domain/ListingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyFavorites, toggleFavorite } from "@/lib/api";
import { Listing } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

const SAMPLE_FAVORITES: Listing[] = [
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
];

export default function FavoritesPage() {
  const router = useRouter();
  const { user, openSignInModal } = useAuth();
  const [favorites, setFavorites] = useState<Listing[]>(SAMPLE_FAVORITES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getMyFavorites()
        .then((res) => {
          if (res.items && res.items.length > 0) {
            setFavorites(res.items);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleRemoveFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFavorite(id);
      setFavorites((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setFavorites((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-danger/10 text-danger">
            <Heart className="w-6 h-6 fill-danger" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-ink-900">
              Saved Vehicles
            </h1>
            <p className="text-xs text-ink-500 mt-0.5">
              {favorites.length} vehicles bookmarked in your private wishlist
            </p>
          </div>
        </div>

        <Link href="/search">
          <button className="text-xs font-semibold text-accent-700 bg-accent-100 hover:bg-accent-200 px-3.5 py-2 rounded-xl transition-colors">
            + Browse More Wheels
          </button>
        </Link>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((listing) => {
            const firstPhoto =
              listing.media && listing.media.length > 0
                ? listing.media[0].url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"
                : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80";

            return (
              <div key={listing.id} className="relative group">
                <ListingCard
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
                <button
                  onClick={(e) => handleRemoveFavorite(listing.id, e)}
                  title="Remove from favorites"
                  className="absolute top-3 right-3 p-2 rounded-full bg-paper/90 backdrop-blur-sm text-danger hover:bg-danger hover:text-white transition-all shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-paper border border-border rounded-3xl p-12 text-center">
          <EmptyState
            title="No Saved Vehicles Yet"
            description="Explore our verified listings and click the heart icon to save your favorite vehicles here."
            actionLabel="Explore Vehicles Now"
            onAction={() => router.push("/search")}
          />
        </div>
      )}
    </div>
  );
}
