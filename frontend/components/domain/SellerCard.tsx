"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Listing } from "@/lib/types";
import { getListingContact } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  ShieldCheck,
  Star,
  MessageCircle,
  Flag,
  Share2,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

interface SellerCardProps {
  listing: Listing;
  onOpenReviewModal: () => void;
  onOpenReportModal: () => void;
}

export function SellerCard({ listing, onOpenReviewModal, onOpenReportModal }: SellerCardProps) {
  const { user, openSignInModal } = useAuth();
  const [isContacting, setIsContacting] = useState(false);
  const [contacted, setContacted] = useState(false);

  const handleWhatsAppContact = async () => {
    if (!user) {
      openSignInModal();
      return;
    }

    setIsContacting(true);
    try {
      const contactInfo = await getListingContact(listing.id);
      setContacted(true);

      // Clean phone number (strip spaces/symbols)
      const cleanPhone = contactInfo.whatsapp_number.replace(/[^0-9]/g, "");
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(contactInfo.prefilled_message)}`;
      
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      alert(err.message || "Failed to initiate WhatsApp contact");
    } finally {
      setIsContacting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: `Check out this ${listing.title} on ListedWheels for ${formatINR(listing.price_paise, true)}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Listing URL copied to clipboard!");
    }
  };

  return (
    <div className="bg-paper border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Price Header */}
      <div className="border-b border-border pb-4">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-500">
          Listed Price
        </span>
        <div className="flex items-baseline justify-between mt-0.5">
          <span className="font-mono font-bold text-2xl sm:text-3xl text-ink-900 tracking-tight">
            {formatINR(listing.price_paise, true)}
          </span>
          <span className="text-xs text-ink-500 font-medium bg-surface px-2 py-0.5 rounded">
            Fixed Price
          </span>
        </div>
      </div>

      {/* Seller Details */}
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-ink-900 text-paper text-base font-bold flex items-center justify-center shrink-0">
          {listing.seller_name ? listing.seller_name[0].toUpperCase() : "S"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-heading font-semibold text-sm sm:text-base text-ink-900 truncate">
              {listing.seller_name || "Verified Seller"}
            </h4>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-0.5">
            {listing.seller_type === "dealer" ? "Verified Dealership" : "Individual Seller"} • {listing.city}
          </p>
        </div>
      </div>

      {/* Primary WhatsApp Action (Direct WhatsApp Connect) */}
      <div className="space-y-2">
        <button
          onClick={handleWhatsAppContact}
          disabled={isContacting}
          className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm sm:text-base py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          <MessageCircle className="w-5 h-5 fill-white stroke-none" />
          <span>{isContacting ? "Connecting..." : "Chat with Seller on WhatsApp"}</span>
        </button>

        <p className="text-[11px] text-ink-500 text-center flex items-center justify-center gap-1">
          <Lock className="w-3 h-3 text-ink-400" />
          <span>Direct chat • Zero brokerage fees • Safe connection</span>
        </p>
      </div>

      {/* Action Buttons: Review & Report & Share */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-ink-600">
        <button
          onClick={onOpenReviewModal}
          className="flex items-center gap-1.5 hover:text-ink-900 transition-colors py-1"
        >
          <Star className="w-4 h-4 text-accent-500 fill-accent-500/30" />
          <span>Write Review</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 hover:text-ink-900 transition-colors py-1"
        >
          <Share2 className="w-4 h-4 text-ink-500" />
          <span>Share</span>
        </button>

        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 hover:text-danger text-ink-500 transition-colors py-1"
        >
          <Flag className="w-4 h-4" />
          <span>Report</span>
        </button>
      </div>
    </div>
  );
}
