"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ShieldCheck,
  Star,
  MapPin,
  Calendar,
  Share2,
  Heart,
  Car,
  Bike,
  Compass,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { PhotoGallery } from "@/components/domain/PhotoGallery";
import { VehicleOverview } from "@/components/domain/VehicleOverview";
import { SellerCard } from "@/components/domain/SellerCard";
import { VideoWalkaround } from "@/components/domain/VideoWalkaround";
import { SafetyBox } from "@/components/domain/SafetyBox";
import { ReviewModal } from "@/components/domain/ReviewModal";
import { ReportModal } from "@/components/domain/ReportModal";
import { ListingCard } from "@/components/domain/ListingCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { checkFavoriteStatus, getListingById, getSellerReviews, toggleFavorite } from "@/lib/api";
import { Listing, Review, SellerReviewSummary } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const DEMO_LISTING: Listing = {
  id: "f1a2b3c4-0001-4000-8000-000000000001",
  seller_id: "s1111111-1111-1111-1111-111111111111",
  seller_name: "Karthik Raja",
  seller_type: "individual",
  seller_whatsapp: "+919876543210",
  category: "cars",
  title: "2021 Hyundai i20 Asta 1.2 MT (Single Owner)",
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
  description: `Immaculate single-owner Hyundai i20 Asta manual petrol in Fiery Red color.
  
Key Highlights:
- Complete company service history at Hyundai OMR Chennai
- Brand new Michelin tyres installed at 25,000 km
- 10.25 inch HD touchscreen with Apple CarPlay / Android Auto
- Bose 7-speaker premium audio system
- Electric sunroof, wireless charging, and push-button start
- Zero insurance claims, 100% bumper-to-bumper valid till Nov 2026
- All original keys, owner manual, and invoice copy available

Reason for sale: Upgrading to 7-seater SUV for family travel. Serious buyers please inspect on weekend.`,
  status: "active",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  media: [
    {
      id: "m1",
      kind: "photo",
      storage_key: "p1",
      position: 0,
      url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "m2",
      kind: "photo",
      storage_key: "p2",
      position: 1,
      url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "m3",
      kind: "photo",
      storage_key: "p3",
      position: 2,
      url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    },
  ],
  promo_video: {
    id: "v1",
    link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    method: "link",
    status: "approved",
  },
};

const SAMPLE_REVIEWS: Review[] = [
  {
    id: "r1",
    seller_id: "s1111111-1111-1111-1111-111111111111",
    buyer_id: "b1",
    buyer_name: "Venkatesh S.",
    rating: 5,
    text: "Very transparent seller. He showed the complete Hyundai service booklet and let me do an OBD scanner test. Car condition is exactly as pictured.",
    status: "visible",
    created_at: "2026-09-15T10:00:00Z",
  },
  {
    id: "r2",
    seller_id: "s1111111-1111-1111-1111-111111111111",
    buyer_id: "b2",
    buyer_name: "Anand M.",
    rating: 5,
    text: "Quick response on WhatsApp and gave clean directions to his residence for daytime inspection. Highly recommended honest seller.",
    status: "visible",
    created_at: "2026-08-20T14:30:00Z",
  },
];

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, openSignInModal } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [reviewsSummary, setReviewsSummary] = useState<SellerReviewSummary | null>(null);

  // Modals state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getListingById(resolvedParams.id);
        setListing(data);

        // Load reviews
        try {
          const revs = await getSellerReviews(data.seller_id);
          setReviewsSummary(revs);
        } catch {
          setReviewsSummary({
            seller_id: data.seller_id,
            average_rating: 4.9,
            total_reviews: 2,
            reviews: SAMPLE_REVIEWS,
          });
        }
      } catch {
        // Fallback demo listing
        setListing({ ...DEMO_LISTING, id: resolvedParams.id });
        setReviewsSummary({
          seller_id: DEMO_LISTING.seller_id,
          average_rating: 5.0,
          total_reviews: 2,
          reviews: SAMPLE_REVIEWS,
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (user && listing) {
      checkFavoriteStatus(listing.id)
        .then((res) => setIsFav(res.is_favorite))
        .catch(() => {});
    }
  }, [user, listing]);

  const handleToggleFavorite = async () => {
    if (!user) {
      openSignInModal();
      return;
    }
    if (!listing) return;
    try {
      const res = await toggleFavorite(listing.id);
      setIsFav(res.is_favorite);
    } catch {
      setIsFav(!isFav);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-6 w-64 rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="aspect-16/10 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-ink-900">Listing not found</h2>
        <Link href="/search" className="text-accent-600 text-sm font-semibold underline mt-2 inline-block">
          Return to search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-ink-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-ink-400" />
          <Link href={`/search?category=${listing.category}`} className="hover:text-ink-900 capitalize transition-colors">
            {listing.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-ink-400" />
          <Link href={`/search?city=${encodeURIComponent(listing.city)}`} className="hover:text-ink-900 transition-colors">
            {listing.city}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-ink-400" />
          <span className="text-ink-900 font-semibold truncate max-w-[200px] sm:max-w-xs">
            {listing.title}
          </span>
        </div>

        <button
          onClick={handleToggleFavorite}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all w-fit ${
            isFav
              ? "border-danger text-danger bg-danger/10"
              : "border-border text-ink-700 bg-paper hover:bg-surface"
          }`}
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-danger" : ""}`} />
          <span>{isFav ? "Saved to Favorites" : "Save Listing"}</span>
        </button>
      </div>

      {/* Main Content Layout: Photos & Specs (Left) + Seller & CTA (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          {/* Photo Gallery with Fullscreen Zoom */}
          <PhotoGallery media={listing.media || []} title={listing.title} />

          {/* Vehicle Specifications & Description */}
          <VehicleOverview listing={listing} />

          {/* Video Walkaround Section (if available) */}
          {listing.promo_video && listing.promo_video.link && (
            <VideoWalkaround videoLink={listing.promo_video.link} />
          )}

          {/* Seller Customer Reviews Section */}
          <div className="bg-paper border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-ink-900">
                  Seller Ratings & Reviews
                </h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Verified reviews from buyers who contacted on WhatsApp
                </p>
              </div>

              {reviewsSummary && (
                <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-border">
                  <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                  <span className="font-heading font-bold text-sm text-ink-900">
                    {reviewsSummary.average_rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-ink-500">
                    ({reviewsSummary.total_reviews} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Reviews List */}
            {reviewsSummary && reviewsSummary.reviews.length > 0 ? (
              <div className="space-y-4">
                {reviewsSummary.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-surface/60 border border-border/70 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-ink-900 text-paper text-xs font-bold flex items-center justify-center">
                          {rev.buyer_name ? rev.buyer_name[0] : "B"}
                        </div>
                        <span className="text-xs font-semibold text-ink-900">
                          {rev.buyer_name || "Verified Buyer"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-accent-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-accent-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-ink-700 leading-relaxed">{rev.text}</p>
                    <span className="text-[10px] text-ink-400 block">
                      Reviewed on {new Date(rev.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-ink-500">
                No reviews yet for this seller. Contact them via WhatsApp to be the first to review!
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Column (4 cols / 5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-20">
          {/* Seller Card & WhatsApp CTA */}
          <SellerCard
            listing={listing}
            onOpenReviewModal={() => setIsReviewModalOpen(true)}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />

          {/* Safety Box & Buyer Tips */}
          <SafetyBox />
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        sellerId={listing.seller_id}
        sellerName={listing.seller_name}
        onReviewSubmitted={() => {
          // refresh reviews
          getSellerReviews(listing.seller_id)
            .then(setReviewsSummary)
            .catch(() => {});
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        listingId={listing.id}
        listingTitle={listing.title}
      />
    </div>
  );
}
