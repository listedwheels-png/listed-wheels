import React from "react";
import Image from "next/image";
import { MapPin, Gauge, Fuel, Calendar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/utils";

export interface ListingCardProps {
  id: string;
  title: string;
  pricePaise: number;
  imageUrl?: string;
  year: number;
  mileageKm?: number;
  fuelType?: string;
  transmission?: string;
  registrationMasked?: string;
  city: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  category: "cars" | "bikes" | "cycles" | "other";
  onClick?: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  title,
  pricePaise,
  imageUrl,
  year,
  mileageKm,
  fuelType,
  transmission,
  registrationMasked,
  city,
  isVerified = false,
  isFeatured = false,
  category,
  onClick,
}) => {
  return (
    <Card
      hoverable
      interactive={Boolean(onClick)}
      onClick={onClick}
      className="group flex flex-col h-full bg-surface"
    >
      {/* 4:3 Photo Container with inner border and bottom gradient */}
      <div className="relative aspect-[4/3] w-full bg-ink-200/50 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-500 text-xs font-medium bg-ink-200/30">
            No Photo Available
          </div>
        )}

        {/* Inner light border & bottom dark gradient for readable badges */}
        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-ink-900/40 to-transparent pointer-events-none" />

        {/* Badges on photo overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {isVerified && <Badge variant="verified">Verified</Badge>}
          {isFeatured && <Badge variant="featured">Featured</Badge>}
        </div>

        {/* City tag bottom right */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-ink-900/80 text-surface backdrop-blur-sm">
            <MapPin className="w-3 h-3 text-accent-500" />
            {city}
          </span>
        </div>
      </div>

      {/* Listing Information */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Price formatted in Sora typography */}
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-display font-bold text-xl sm:text-2xl text-ink-900 tabular-nums">
              {formatINR(pricePaise, true)}
            </span>
          </div>

          {/* Vehicle Title */}
          <h4 className="font-medium text-sm text-ink-900 line-clamp-2 group-hover:text-accent-600 transition-colors mb-3">
            {title}
          </h4>
        </div>

        {/* Attribute Chips: Year, KM, Fuel */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink-200/50 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1 bg-paper px-2 py-0.5 rounded text-[11px] font-medium text-ink-700">
            <Calendar className="w-3 h-3 text-ink-500" />
            {year}
          </span>

          {mileageKm !== undefined && category !== "cycles" && (
            <span className="inline-flex items-center gap-1 bg-paper px-2 py-0.5 rounded text-[11px] font-medium text-ink-700 tabular-nums">
              <Gauge className="w-3 h-3 text-ink-500" />
              {mileageKm.toLocaleString("en-IN")} km
            </span>
          )}

          {fuelType && category !== "cycles" && (
            <span className="inline-flex items-center gap-1 bg-paper px-2 py-0.5 rounded text-[11px] font-medium text-ink-700">
              <Fuel className="w-3 h-3 text-ink-500" />
              {fuelType}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
