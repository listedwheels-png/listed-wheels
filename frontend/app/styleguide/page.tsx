"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Monitor,
  Bell,
  Search,
  Mail,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Modal,
  ToastContainer,
  ToastType,
  Skeleton,
  EmptyState,
} from "@/components/ui";

import { ListingCard, PriceBreakdown, FilterBar, FilterState } from "@/components/domain";

export default function StyleguidePage() {
  // State for interactive demos
  const [modalOpen, setModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; type: ToastType; message: string }>>([]);
  const [isPhonePreview, setIsPhonePreview] = useState(false);
  const [hindiPreview, setHindiPreview] = useState(false);

  // Filters demo state
  const [filters, setFilters] = useState<FilterState>({
    category: "cars",
    city: "chennai",
    minPrice: "100000",
    maxPrice: "800000",
    sortBy: "latest",
  });

  // Price Breakdown demo state
  const [isSameStateGst, setIsSameStateGst] = useState(true);
  const [appliedPromo, setAppliedPromo] = useState(true);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-paper pb-24 text-ink-900">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-ink-200 shadow-sm">
        <div className="max-w-content mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-700 hover:text-ink-900 bg-paper px-2.5 py-1.5 rounded-btn border border-ink-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back Home</span>
            </Link>
            <h1 className="font-display font-bold text-xl text-ink-900">
              ListedWheels <span className="text-accent-500">Design System</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher for Indic typography test */}
            <button
              onClick={() => setHindiPreview(!hindiPreview)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-btn border transition-all ${
                hindiPreview
                  ? "bg-accent-500 text-ink-900 border-accent-600 font-bold"
                  : "bg-surface text-ink-700 border-ink-200 hover:border-ink-500"
              }`}
            >
              {hindiPreview ? "हिंदी (Hindi Active)" : "English (Default)"}
            </button>

            {/* Viewport Width Toggle */}
            <div className="hidden sm:flex items-center bg-paper p-1 rounded-btn border border-ink-200 text-xs font-semibold">
              <button
                onClick={() => setIsPhonePreview(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                  !isPhonePreview ? "bg-surface text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (1200px)</span>
              </button>
              <button
                onClick={() => setIsPhonePreview(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                  isPhonePreview ? "bg-surface text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile (360px)</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main
        className={`mx-auto px-4 sm:px-6 py-10 transition-all duration-300 ${
          isPhonePreview
            ? "max-w-[390px] border-x border-ink-200/80 bg-paper/50 shadow-2xl my-6 rounded-[24px]"
            : "max-w-content"
        }`}
      >
        {/* Intro */}
        <section className="mb-12">
          <div className="p-6 rounded-card bg-ink-900 text-surface shadow-card relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-500/20 text-accent-500 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Phase 1 Component Library
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-surface mb-2">
                {hindiPreview
                  ? "विश्वसनीय और स्वच्छ डिज़ाइन प्रणाली"
                  : "Trust-First, Clean & Premium Design System"}
              </h2>
              <p className="text-ink-200 text-sm max-w-2xl leading-relaxed">
                Every component is built once in <code className="text-accent-500 font-mono">components/ui</code> and{" "}
                <code className="text-accent-500 font-mono">components/domain</code> following strict WCAG AA contrast rules, 8-point spacing, and mobile-first 360px principles.
              </p>
            </div>
          </div>
        </section>

        {/* Section 1: Color Palette Tokens */}
        <section className="mb-14">
          <div className="border-b border-ink-200 pb-3 mb-6">
            <h3 className="font-display font-bold text-xl text-ink-900">1. Color Palette Tokens</h3>
            <p className="text-xs text-ink-500">Deep Navy for trust, Warm Saffron for action, Warm Off-White paper surface.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { token: "ink-900", hex: "#0F1B2D", bg: "bg-ink-900", text: "text-white", desc: "Headings, primary text" },
              { token: "ink-700", hex: "#2A3A52", bg: "bg-ink-700", text: "text-white", desc: "Body text" },
              { token: "ink-500", hex: "#5B6B82", bg: "bg-ink-500", text: "text-white", desc: "Secondary text" },
              { token: "ink-200", hex: "#D9DEE6", bg: "bg-ink-200", text: "text-ink-900", desc: "Borders & dividers" },
              { token: "paper", hex: "#FAF8F4", bg: "bg-paper", text: "text-ink-900", border: true, desc: "Warm off-white bg" },
              { token: "surface", hex: "#FFFFFF", bg: "bg-surface", text: "text-ink-900", border: true, desc: "Card surfaces" },
              { token: "accent-500", hex: "#F5A524", bg: "bg-accent-500", text: "text-ink-900", desc: "Saffron primary action" },
              { token: "accent-600", hex: "#D98A0B", bg: "bg-accent-600", text: "text-ink-900", desc: "Saffron hover" },
              { token: "success", hex: "#1F9D6B", bg: "bg-[#1F9D6B]", text: "text-white", desc: "Verified / live" },
              { token: "warning", hex: "#C98A00", bg: "bg-[#C98A00]", text: "text-white", desc: "Pending / expiring" },
              { token: "danger", hex: "#C0392B", bg: "bg-danger", text: "text-white", desc: "Errors / removals" },
            ].map((c) => (
              <div key={c.token} className="rounded-card border border-ink-200 bg-surface p-3 shadow-sm">
                <div className={`h-16 rounded-btn ${c.bg} ${c.border ? "border border-ink-200" : ""} mb-2.5 flex items-end p-2`}>
                  <span className={`text-[10px] font-mono font-bold ${c.text}`}>{c.hex}</span>
                </div>
                <div className="font-bold text-xs text-ink-900">{c.token}</div>
                <div className="text-[11px] text-ink-500 line-clamp-1">{c.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Typography & Indian Currency */}
        <section className="mb-14">
          <div className="border-b border-ink-200 pb-3 mb-6">
            <h3 className="font-display font-bold text-xl text-ink-900">2. Typography Scale &amp; Price Formatting</h3>
            <p className="text-xs text-ink-500">Sora for geometric headings &amp; prices, Inter for body/UI, Indian rupee number grouping (₹1,99,999).</p>
          </div>

          <div className="bg-surface rounded-card border border-ink-200 p-6 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-ink-200/60 pb-4">
              <div>
                <span className="text-xs font-mono text-ink-500 uppercase">Display (32px / 48px) - Sora 700</span>
                <div className="font-display font-bold text-2xl sm:text-4xl text-ink-900">
                  {hindiPreview ? "सत्यापित वाहन बाज़ार" : "Verified Vehicle Marketplace"}
                </div>
              </div>
              <span className="font-display font-bold text-2xl sm:text-3xl text-ink-900 tabular-nums">
                ₹19,99,000
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono text-ink-500">H1 (26px / 36px) - Sora 700</span>
                  <h1 className="font-display font-bold text-2xl text-ink-900">
                    2021 Hyundai Creta SX (O) Turbo
                  </h1>
                </div>
                <div>
                  <span className="text-xs font-mono text-ink-500">H2 (21px / 28px) - Sora 600</span>
                  <h2 className="font-display font-semibold text-xl text-ink-900">
                    Seller Verification &amp; Documents
                  </h2>
                </div>
                <div>
                  <span className="text-xs font-mono text-ink-500">H3 (18px / 22px) - Sora 600</span>
                  <h3 className="font-display font-semibold text-lg text-ink-900">
                    Pricing Breakdown &amp; GST Details
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono text-ink-500">Body (16px) - Inter 400</span>
                  <p className="text-base text-ink-700 leading-relaxed">
                    Buyers connect with sellers directly on WhatsApp. Every vehicle undergoes document verification by our moderation team before listing.
                  </p>
                </div>
                <div>
                  <span className="text-xs font-mono text-ink-500">Small (14px) - Inter 500</span>
                  <p className="text-sm text-ink-500 leading-normal">
                    Prices include 18% GST. Listing valid for 365 days from the date of approval.
                  </p>
                </div>
                <div>
                  <span className="text-xs font-mono text-ink-500">Indic Fallback - Noto Sans Devanagari</span>
                  <p className="text-sm text-ink-700 font-sans">
                    कार, बाइक और साइकिल के लिए भारत का विश्वसनीय बाज़ार (चेन्नई, बेंगलुरु, मुंबई).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Buttons & States */}
        <section className="mb-14">
          <div className="border-b border-ink-200 pb-3 mb-6">
            <h3 className="font-display font-bold text-xl text-ink-900">3. Button Components &amp; States</h3>
            <p className="text-xs text-ink-500">
              Primary (saffron with navy text for WCAG AA 4.5:1 contrast), Secondary, Ghost, Danger, Dark, 44px touch targets.
            </p>
          </div>

          <div className="space-y-6">
            {/* Variants */}
            <div className="bg-surface rounded-card border border-ink-200 p-6 shadow-card">
              <span className="text-xs font-bold text-ink-900 uppercase tracking-wider block mb-4">
                Button Variants
              </span>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary">Primary (Saffron)</Button>
                <Button variant="secondary">Secondary (Outline)</Button>
                <Button variant="dark">Dark Hero</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
              </div>
            </div>

            {/* Sizes & States */}
            <div className="bg-surface rounded-card border border-ink-200 p-6 shadow-card">
              <span className="text-xs font-bold text-ink-900 uppercase tracking-wider block mb-4">
                Button Sizes &amp; Loading / Disabled States
              </span>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary" size="sm">Small Button</Button>
                <Button variant="primary" size="md">Medium (Default)</Button>
                <Button variant="primary" size="lg">Large Hero</Button>
                <Button variant="primary" isLoading>Submitting</Button>
                <Button variant="primary" disabled>Disabled State</Button>
                <Button variant="secondary" leftIcon={<RotateCcw className="w-4 h-4" />}>
                  With Icon
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Form Controls (Input & Select) */}
        <section className="mb-14">
          <div className="border-b border-ink-200 pb-3 mb-6">
            <h3 className="font-display font-bold text-xl text-ink-900">4. Form Inputs &amp; Validation</h3>
            <p className="text-xs text-ink-500">Visible labels above, helper text below, saffron focus ring, red error messages.</p>
          </div>

          <div className="bg-surface rounded-card border border-ink-200 p-6 shadow-card grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Vehicle Make & Model"
              placeholder="e.g. Maruti Suzuki Swift VXi"
              helperText="Enter the vehicle brand, model and trim level."
              required
            />

            <Input
              label="Registration Number"
              placeholder="e.g. TN09AB1234"
              defaultValue="TN 09 AB"
              error="Enter full registration number without spaces"
              required
            />

            <Select
              label="Fuel Type"
              options={[
                { value: "petrol", label: "Petrol" },
                { value: "diesel", label: "Diesel" },
                { value: "electric", label: "Electric (EV)" },
                { value: "cng", label: "CNG + Petrol" },
              ]}
              helperText="Select engine fuel configuration."
            />

            <Input
              label="Contact Email"
              type="email"
              placeholder="seller@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Used for order confirmation and invoice receipts."
            />
          </div>
        </section>

        {/* Section 5: Badges */}
        <section className="mb-14">
          <div className="border-b border-ink-200 pb-3 mb-6">
            <h3 className="font-display font-bold text-xl text-ink-900">5. Badges &amp; Status Indicators</h3>
            <p className="text-xs text-ink-500">Full round badges with icon and descriptive text for accessibility.</p>
          </div>

          <div className="bg-surface rounded-card border border-ink-200 p-6 shadow-card flex flex-wrap gap-4 items-center">
            <Badge variant="verified">Verified Listing</Badge>
            <Badge variant="featured">Featured</Badge>
            <Badge variant="pending">Pending Verification</Badge>
            <Badge variant="sold">Sold Out</Badge>
            <Badge variant="danger">Rejected</Badge>
            <Badge variant="neutral">Draft</Badge>
            <Badge variant="verified" size="sm">Verified Small</Badge>
          </div>
        </section>

        {/* Section 6: Domain Components (ListingCard, PriceBreakdown, FilterBar) */}
        <section className="mb-14">
          <div className="border-b border-ink-200 pb-3 mb-6">
            <h3 className="font-display font-bold text-xl text-ink-900">6. Domain Components</h3>
            <p className="text-xs text-ink-500">ListingCard with 4:3 photo ratio, PriceBreakdown with 18% GST calculation, FilterBar.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Listing Cards Demo */}
            <div className="lg:col-span-2 space-y-4">
              <span className="text-xs font-bold text-ink-900 uppercase tracking-wider block">
                ListingCard Component (4:3 Ratio, INR Format, Attribute Chips)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ListingCard
                  id="car-1"
                  category="cars"
                  title="2020 Maruti Suzuki Swift ZXi (1.2 Petrol)"
                  pricePaise={64500000} // ₹6,45,000
                  imageUrl="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"
                  year={2020}
                  mileageKm={32000}
                  fuelType="Petrol"
                  city="Chennai"
                  isVerified={true}
                  isFeatured={true}
                  onClick={() => addToast("info", "Clicked Listing: Maruti Swift ZXi")}
                />

                <ListingCard
                  id="bike-1"
                  category="bikes"
                  title="2022 Royal Enfield Classic 350 Stealth Black"
                  pricePaise={18500000} // ₹1,85,000
                  imageUrl="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80"
                  year={2022}
                  mileageKm={8500}
                  fuelType="Petrol"
                  city="Bangalore"
                  isVerified={true}
                  isFeatured={false}
                  onClick={() => addToast("info", "Clicked Listing: Royal Enfield")}
                />
              </div>
            </div>

            {/* Price Breakdown Demo */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-ink-900 uppercase tracking-wider block">
                Price Breakdown &amp; GST (18%)
              </span>

              <PriceBreakdown
                basePaise={199900} // ₹1,999 Car listing
                discountPaise={appliedPromo ? 20000 : 0} // ₹200 promo
                promoCode={appliedPromo ? "LAUNCH200" : undefined}
                isSameState={isSameStateGst}
              />

              <div className="bg-paper p-3 rounded-btn border border-ink-200 text-xs flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-ink-700">
                  <input
                    type="checkbox"
                    checked={appliedPromo}
                    onChange={(e) => setAppliedPromo(e.target.checked)}
                    className="rounded text-accent-500 focus:ring-accent-500"
                  />
                  <span>Apply ₹200 promo code</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-ink-700">
                  <input
                    type="checkbox"
                    checked={isSameStateGst}
                    onChange={(e) => setIsSameStateGst(e.target.checked)}
                    className="rounded text-accent-500 focus:ring-accent-500"
                  />
                  <span>Tamil Nadu Seller (CGST 9% + SGST 9%)</span>
                </label>
              </div>
            </div>
          </div>

          {/* FilterBar Demo */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-ink-900 uppercase tracking-wider block">
              FilterBar (Mobile Horizontal Chips + Desktop Sidebar)
            </span>
            <FilterBar
              filters={filters}
              onFilterChange={(newFilters) => {
                setFilters(newFilters);
                addToast("info", `Filters updated: ${newFilters.category} in ${newFilters.city}`);
              }}
              onReset={() => {
                setFilters({
                  category: "all",
                  city: "all",
                  minPrice: "",
                  maxPrice: "",
                  sortBy: "latest",
                });
                addToast("info", "Filters reset to default");
              }}
            />
          </div>
        </section>

        {/* Section 7: Modals, Toasts & Feedback */}
        <section className="mb-14">
          <div className="border-b border-ink-200 pb-3 mb-6">
            <h3 className="font-display font-bold text-xl text-ink-900">7. Interactive Modals &amp; Toast Messages</h3>
            <p className="text-xs text-ink-500">
              Bottom sheets on phone widths (360px), centered dialogs on desktop, 4-second auto-dismissing toast alerts.
            </p>
          </div>

          <div className="bg-surface rounded-card border border-ink-200 p-6 shadow-card space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <Button
                variant="primary"
                onClick={() => setModalOpen(true)}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Open Responsive Modal
              </Button>

              <Button
                variant="secondary"
                onClick={() => addToast("success", "Listing successfully approved and published!")}
                leftIcon={<CheckCircle2 className="w-4 h-4 text-success" />}
              >
                Trigger Success Toast
              </Button>

              <Button
                variant="secondary"
                onClick={() => addToast("error", "Promo code has expired or reached usage limit")}
                leftIcon={<AlertTriangle className="w-4 h-4 text-danger" />}
              >
                Trigger Error Toast
              </Button>

              <Button
                variant="ghost"
                onClick={() => addToast("info", "WhatsApp number copied to clipboard")}
                leftIcon={<Bell className="w-4 h-4" />}
              >
                Trigger Info Toast
              </Button>
            </div>
          </div>

          {/* Interactive Modal Component */}
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirm Vehicle Listing"
            description="Review details before publishing to live marketplace."
            footer={
              <>
                <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setModalOpen(false);
                    addToast("success", "Vehicle listing submitted for review!");
                  }}
                >
                  Confirm &amp; Proceed
                </Button>
              </>
            }
          >
            <div className="space-y-4 text-sm text-ink-700">
              <div className="p-3.5 rounded-btn bg-paper border border-ink-200 text-xs flex items-center justify-between">
                <span className="text-ink-500">Selected Category:</span>
                <span className="font-bold text-ink-900 uppercase">Cars</span>
              </div>
              <p>
                Your listing will remain in <Badge variant="pending" size="sm">Pending Verification</Badge> status while RC and Aadhaar copies are verified by the admin team.
              </p>
            </div>
          </Modal>
        </section>

        {/* Section 8: Skeletons & Empty State */}
        <section className="mb-14">
          <div className="border-b border-ink-200 pb-3 mb-6">
            <h3 className="font-display font-bold text-xl text-ink-900">8. Skeletons &amp; Empty States</h3>
            <p className="text-xs text-ink-500">Prevent layout shifts during loading and provide clear recovery actions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skeletons Card */}
            <div className="bg-surface rounded-card border border-ink-200 p-6 shadow-card space-y-4">
              <span className="text-xs font-bold text-ink-900 uppercase tracking-wider block">
                Skeleton Loading State
              </span>
              <Skeleton aspectRatio="4/3" className="w-full" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>

            {/* Empty State Card */}
            <EmptyState
              title="No Vehicles Found"
              description="No active listings match your current filters. Try changing city or price budget."
              actionLabel="Reset All Filters"
              onAction={() => {
                setFilters({
                  category: "all",
                  city: "all",
                  minPrice: "",
                  maxPrice: "",
                  sortBy: "latest",
                });
                addToast("info", "Filters reset");
              }}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
