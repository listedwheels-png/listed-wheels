"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Star,
  MessageCircle,
  MapPin,
  ExternalLink,
  Car,
  ChevronRight,
} from "lucide-react";
import { ListingCard } from "@/components/domain/ListingCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { getPublicProfile } from "@/lib/api";
import { Listing, PublicSellerProfile } from "@/lib/types";

const SAMPLE_DEALER_INVENTORY: Listing[] = [
  {
    id: "f1a2b3c4-0001-4000-8000-000000000001",
    seller_id: "s2",
    category: "cars",
    title: "2021 Hyundai i20 Asta 1.2 MT",
    make: "Hyundai",
    model: "i20 Asta",
    year: 2021,
    price_paise: 82500000,
    city: "Chennai",
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
    id: "f1a2b3c4-0003-4000-8000-000000000003",
    seller_id: "s2",
    category: "cars",
    title: "2020 Maruti Suzuki Swift ZXi AMT",
    make: "Maruti",
    model: "Swift ZXi",
    year: 2020,
    price_paise: 64000000,
    city: "Chennai",
    registration_no_masked: "TN 02 ** 9012",
    mileage_km: 34000,
    fuel_type: "petrol",
    transmission: "automatic",
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
];

export default function DealerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<PublicSellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicProfile(resolvedParams.id)
      .then(setProfile)
      .catch(() => {
        setProfile({
          id: resolvedParams.id,
          name: "Apex Luxury Motors",
          role: "dealer",
          seller_type: "dealer",
          shop_name: "Apex Motors Chennai",
          whatsapp: "+919876543210",
          maps_link: "https://maps.google.com/?q=Chennai",
          is_verified: true,
          average_rating: 4.9,
          total_reviews: 14,
          active_listings_count: 2,
          created_at: "2024-01-01T00:00:00Z",
        });
      })
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dealer Header Card */}
      <div className="bg-paper border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-ink-900 text-paper text-2xl font-bold flex items-center justify-center shrink-0">
              {profile?.shop_name ? profile.shop_name[0] : "D"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-bold text-xl sm:text-2xl text-ink-900">
                  {profile?.shop_name || profile?.name || "Verified Dealership"}
                </h1>
                {profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Dealer
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-500">
                Dealer ID: {resolvedParams.id} • Registered Showroom
              </p>

              <div className="flex items-center gap-3 pt-1 text-xs">
                <div className="flex items-center gap-1 text-accent-600 font-bold">
                  <Star className="w-4 h-4 fill-accent-500 text-accent-500" />
                  <span>{profile?.average_rating?.toFixed(1) || "5.0"}</span>
                  <span className="text-ink-500 font-normal">
                    ({profile?.total_reviews || 0} reviews)
                  </span>
                </div>
                <span className="text-ink-300">•</span>
                <span className="text-ink-600 font-medium">
                  {profile?.active_listings_count || 2} Live Vehicles in Stock
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {profile?.whatsapp && (
              <a
                href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-xs flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 fill-white stroke-none" />
                <span>WhatsApp Dealer</span>
              </a>
            )}
            {profile?.maps_link && (
              <a
                href={profile.maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 border border-border bg-surface hover:bg-surface-elevated rounded-xl text-xs font-semibold text-ink-700 flex items-center gap-1.5"
              >
                <MapPin className="w-4 h-4 text-accent-600" />
                <span>Showroom Location</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Dealer Inventory */}
      <div className="space-y-4">
        <h2 className="font-heading font-bold text-xl text-ink-900">
          Current Inventory in Showroom ({SAMPLE_DEALER_INVENTORY.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_DEALER_INVENTORY.map((l) => (
            <ListingCard
              key={l.id}
              id={l.id}
              title={l.title}
              category={l.category}
              year={l.year}
              pricePaise={l.price_paise}
              city={l.city}
              registrationMasked={l.registration_no_masked}
              mileageKm={l.mileage_km}
              fuelType={l.fuel_type}
              transmission={l.transmission}
              imageUrl={l.media?.[0]?.url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"}
              isVerified={true}
              onClick={() => router.push(`/listings/${l.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
