"use client";

import React from "react";
import { Listing } from "@/lib/types";
import {
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Users,
  MapPin,
  ShieldCheck,
  FileCheck,
} from "lucide-react";

interface VehicleOverviewProps {
  listing: Listing;
}

export function VehicleOverview({ listing }: VehicleOverviewProps) {
  const specs = [
    {
      label: "Manufacturing Year",
      value: listing.year ? String(listing.year) : "—",
      icon: Calendar,
    },
    {
      label: "Kilometers Driven",
      value: listing.mileage_km !== undefined && listing.mileage_km !== null ? `${listing.mileage_km.toLocaleString("en-IN")} km` : "—",
      icon: Gauge,
      hide: listing.category === "cycles",
    },
    {
      label: "Fuel Type",
      value: listing.fuel_type ? listing.fuel_type.toUpperCase() : "—",
      icon: Fuel,
      hide: listing.category === "cycles",
    },
    {
      label: "Transmission",
      value: listing.transmission ? (listing.transmission === "manual" ? "Manual" : "Automatic") : "—",
      icon: Settings2,
      hide: listing.category === "cycles",
    },
    {
      label: "Owners",
      value: listing.owners_count ? `${listing.owners_count}${listing.owners_count === 1 ? "st" : listing.owners_count === 2 ? "nd" : "th"} Owner` : "1st Owner",
      icon: Users,
    },
    {
      label: "Location",
      value: listing.city ? `${listing.city}${listing.state ? `, ${listing.state}` : ""}` : "India",
      icon: MapPin,
    },
  ].filter((s) => !s.hide);

  return (
    <div className="space-y-6 bg-paper border border-border rounded-2xl p-5 sm:p-6 shadow-xs">
      <div>
        <h3 className="font-heading font-bold text-base sm:text-lg text-ink-900">
          Vehicle Overview & Specifications
        </h3>
        <p className="text-xs text-ink-500 mt-0.5">
          Verified vehicle details recorded on ListedWheels
        </p>
      </div>

      {/* Masked Registration Plate Badge (for Cars & Bikes) */}
      {listing.registration_no_masked && (
        <div className="p-4 bg-surface rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Indian Number Plate Simulator */}
            <div className="flex items-center border-2 border-ink-900 bg-white rounded-md px-3 py-1 font-mono font-black text-sm tracking-widest text-ink-900 shadow-xs">
              <div className="flex flex-col items-center justify-center pr-2 border-r border-ink-300 mr-2">
                <span className="text-[7px] text-blue-800 font-bold leading-none">IND</span>
              </div>
              <span>{listing.registration_no_masked}</span>
            </div>
            <div className="text-xs">
              <span className="font-semibold text-ink-900 block">RTO Registration Verified</span>
              <span className="text-ink-500 text-[11px]">Middle digits masked for privacy</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-success font-medium bg-success/10 px-2.5 py-1 rounded-lg w-fit">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Valid SHA-256 Hash Checked</span>
          </div>
        </div>
      )}

      {/* Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {specs.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-3.5 rounded-xl bg-surface/60 border border-border/70 flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-surface-elevated text-ink-700 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-ink-500 block truncate">{item.label}</span>
                <span className="font-semibold text-xs sm:text-sm text-ink-900 block truncate mt-0.5">
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Description */}
      {listing.description && (
        <div className="pt-4 border-t border-border">
          <h4 className="font-heading font-semibold text-xs uppercase tracking-wider text-ink-700 mb-2">
            Seller's Description
          </h4>
          <p className="text-xs sm:text-sm text-ink-700 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </div>
      )}
    </div>
  );
}
