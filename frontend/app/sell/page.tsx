"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  Bike,
  Compass,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Video,
  Sparkles,
  Tag,
  ShieldCheck,
  CreditCard,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  createListing,
  createPaymentOrder,
  getPhotoUploadUrl,
  linkVideoWalkaround,
  registerUploadedPhoto,
  validatePromoCode,
} from "@/lib/api";
import { ListingCreatePayload, VehicleCategory } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const PLAN_FEES: Record<string, { inr: number; paise: number; label: string }> = {
  cycles: { inr: 99, paise: 9900, label: "₹99 / 365 days" },
  bikes: { inr: 999, paise: 99900, label: "₹999 / 365 days" },
  cars: { inr: 1999, paise: 199900, label: "₹1,999 / 365 days" },
  other: { inr: 2499, paise: 249900, label: "₹2,499 / 365 days" },
};

export default function SellVehiclePage() {
  const router = useRouter();
  const { user, openSignInModal } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [category, setCategory] = useState<VehicleCategory>("cars");
  const [title, setTitle] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number>(2021);
  const [priceInr, setPriceInr] = useState<number>(750000);
  const [registrationNo, setRegistrationNo] = useState("");
  const [mileageKm, setMileageKm] = useState<number>(30000);
  const [fuelType, setFuelType] = useState("petrol");
  const [transmission, setTransmission] = useState("manual");
  const [ownersCount, setOwnersCount] = useState<number>(1);
  const [city, setCity] = useState("Chennai");
  const [stateCode, setStateCode] = useState("TN");
  const [description, setDescription] = useState("");

  // Photos & Video
  const [photos, setPhotos] = useState<{ id: string; url: string; file?: File }[]>([
    {
      id: "p1",
      url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
    },
  ]);
  const [videoUrl, setVideoUrl] = useState("");

  // Promo & Checkout State
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    type: string;
    value: number;
    discountInr: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentPlan = PLAN_FEES[category] || PLAN_FEES.cars;
  const baseFeeInr = currentPlan.inr;
  const discountInr = appliedPromo ? appliedPromo.discountInr : 0;
  const discountedBaseInr = Math.max(0, baseFeeInr - discountInr);
  const isTN = stateCode === "TN";
  const gstRate = 0.18;
  const gstInr = Math.round(discountedBaseInr * gstRate);
  const totalInr = discountedBaseInr + gstInr;

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setIsApplyingPromo(true);
    setPromoError(null);
    try {
      const res = await validatePromoCode(promoCodeInput.trim(), category, stateCode);
      if (res.is_valid) {
        const discInr = Math.round(res.breakdown.discount_paise / 100);
        setAppliedPromo({
          code: promoCodeInput.trim().toUpperCase(),
          type: res.type,
          value: res.value,
          discountInr: discInr,
        });
      }
    } catch (err: any) {
      setPromoError(err.message || "Invalid or expired promo code");
      setAppliedPromo(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleAddPhotoMock = () => {
    const mockUrls = [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
    ];
    const nextUrl = mockUrls[photos.length % mockUrls.length];
    setPhotos([...photos, { id: `photo-${Date.now()}`, url: nextUrl }]);
  };

  const handleCompletePosting = async () => {
    if (!user) {
      openSignInModal();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: ListingCreatePayload = {
        category,
        title: title || `${year} ${make} ${model}`,
        make,
        model,
        year: Number(year),
        price_paise: priceInr * 100,
        city,
        state: stateCode === "TN" ? "Tamil Nadu" : "Karnataka",
        registration_no: category !== "cycles" ? registrationNo : undefined,
        mileage_km: category !== "cycles" ? Number(mileageKm) : undefined,
        fuel_type: category !== "cycles" ? fuelType : undefined,
        transmission: category !== "cycles" ? transmission : undefined,
        owners_count: Number(ownersCount),
        description,
      };

      const created = await createListing(payload);
      setCreatedListingId(created.id);

      // Register uploaded photos
      for (let i = 0; i < photos.length; i++) {
        await registerUploadedPhoto(created.id, `media/${created.id}/photo_${i}.webp`, i).catch(() => {});
      }

      // Link video if provided
      if (videoUrl.trim()) {
        await linkVideoWalkaround(created.id, videoUrl.trim()).catch(() => {});
      }

      // Create Payment Order & Activate
      await createPaymentOrder(
        created.id,
        category,
        stateCode,
        appliedPromo ? appliedPromo.code : undefined
      );

      setSubmissionSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to publish listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Wizard Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-700 bg-accent-100 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Post Ad in 5 Easy Steps</span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink-900">
          Sell Your Vehicle on ListedWheels
        </h1>
        <p className="text-xs sm:text-sm text-ink-500">
          Direct WhatsApp inquiries • RTO hash check • 365 days active listing
        </p>
      </div>

      {/* Progress Steps Indicator */}
      <div className="grid grid-cols-5 gap-2 border-b border-border pb-4">
        {[
          { num: 1, label: "Specs" },
          { num: 2, label: "Details" },
          { num: 3, label: "Media" },
          { num: 4, label: "Plan" },
          { num: 5, label: "Checkout" },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => {
              if (s.num < step) setStep(s.num as any);
            }}
            className={`flex flex-col items-center cursor-pointer transition-all ${
              step === s.num
                ? "text-accent-600 font-bold"
                : step > s.num
                ? "text-success font-semibold"
                : "text-ink-400 font-medium"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mb-1 font-bold ${
                step === s.num
                  ? "bg-accent-500 text-ink-900 shadow-sm"
                  : step > s.num
                  ? "bg-success/15 text-success"
                  : "bg-surface text-ink-400 border border-border"
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span className="text-[11px] hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Success Confirmation Card */}
      {submissionSuccess ? (
        <div className="bg-paper border border-border rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-heading font-black text-2xl text-ink-900">
              Vehicle Listing Published Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-ink-600 max-w-md mx-auto leading-relaxed">
              Your vehicle is now live on ListedWheels for 365 days. Buyers can connect with you directly on WhatsApp.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href={`/listings/${createdListingId || "f1a2b3c4-0001-4000-8000-000000000001"}`}>
              <button className="w-full sm:w-auto bg-accent-500 hover:bg-accent-600 text-ink-900 font-bold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-xs transition-all">
                View Live Listing Page
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="w-full sm:w-auto bg-surface hover:bg-surface-elevated text-ink-800 border border-border font-semibold text-xs sm:text-sm py-3 px-6 rounded-xl transition-all">
                Go to Seller Dashboard
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-paper border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {errorMessage && (
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl text-xs text-danger flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Basic Vehicle Specs */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="font-heading font-bold text-lg text-ink-900">
                Step 1: Vehicle Category & Specifications
              </h3>

              {/* Category Choice */}
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-2">
                  Select Category
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "cars", label: "Cars", icon: Car },
                    { id: "bikes", label: "Bikes & Scooters", icon: Bike },
                    { id: "cycles", label: "Bicycles", icon: Compass },
                  ].map((c) => {
                    const Icon = c.icon;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id as any)}
                        className={`p-4 rounded-2xl border text-left flex flex-col items-center gap-2 transition-all ${
                          category === c.id
                            ? "border-accent-500 bg-accent-500/10 font-bold text-ink-900 ring-2 ring-accent-500/20"
                            : "border-border hover:bg-surface text-ink-700"
                        }`}
                      >
                        <Icon className="w-6 h-6 text-accent-600" />
                        <span className="text-xs sm:text-sm">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Make & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-ink-700 block mb-1">Make / Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maruti Suzuki, Hyundai, Royal Enfield"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full p-3 bg-surface border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm text-ink-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-700 block mb-1">Model & Variant *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swift ZXi AMT, Classic 350"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-3 bg-surface border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm text-ink-900 outline-none"
                  />
                </div>
              </div>

              {/* Year & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-ink-700 block mb-1">Manufacturing Year *</label>
                  <input
                    type="number"
                    min={1990}
                    max={2026}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full p-3 bg-surface border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm text-ink-900 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-700 block mb-1">Asking Price (₹) *</label>
                  <input
                    type="number"
                    min={100}
                    value={priceInr}
                    onChange={(e) => setPriceInr(Number(e.target.value))}
                    className="w-full p-3 bg-surface border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm text-ink-900 outline-none font-mono"
                  />
                  <span className="text-[11px] text-ink-500 mt-1 block">
                    Formatted: {formatINR(priceInr)}
                  </span>
                </div>
              </div>

              {/* Registration Number & Mileage (Only Cars / Bikes) */}
              {category !== "cycles" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface/60 border border-border rounded-2xl">
                  <div>
                    <label className="text-xs font-semibold text-ink-700 block mb-1">
                      Vehicle Registration Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TN-09-AB-1234 or KA-05-MM-9999"
                      value={registrationNo}
                      onChange={(e) => setRegistrationNo(e.target.value.toUpperCase())}
                      className="w-full p-3 bg-paper border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm text-ink-900 font-mono tracking-wider uppercase outline-none"
                    />
                    <span className="text-[10px] text-ink-500 mt-1 block">
                      Validated for state code & hashed for 1-active-listing rule.
                    </span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-700 block mb-1">
                      Kilometers Driven (km) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={mileageKm}
                      onChange={(e) => setMileageKm(Number(e.target.value))}
                      className="w-full p-3 bg-paper border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm text-ink-900 outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Fuel & Transmission (Cars / Bikes) */}
              {category !== "cycles" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-ink-700 block mb-1">Fuel Type</label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full p-3 bg-surface border border-border rounded-xl text-xs sm:text-sm text-ink-900 outline-none"
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric (EV)</option>
                      <option value="cng">CNG</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-700 block mb-1">Transmission</label>
                    <select
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      className="w-full p-3 bg-surface border border-border rounded-xl text-xs sm:text-sm text-ink-900 outline-none"
                    >
                      <option value="manual">Manual</option>
                      <option value="automatic">Automatic</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!make.trim() || !model.trim()) {
                      alert("Please fill in Make and Model.");
                      return;
                    }
                    if (category !== "cycles" && !registrationNo.trim()) {
                      alert("Please provide the vehicle registration number.");
                      return;
                    }
                    setStep(2);
                  }}
                  className="bg-accent-500 hover:bg-accent-600 text-ink-900 font-semibold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-xs flex items-center gap-2"
                >
                  <span>Next: Details & Location</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Details & Description */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="font-heading font-bold text-lg text-ink-900">
                Step 2: Ownership, Location & Description
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-ink-700 block mb-1">Owners Count</label>
                  <select
                    value={ownersCount}
                    onChange={(e) => setOwnersCount(Number(e.target.value))}
                    className="w-full p-3 bg-surface border border-border rounded-xl text-xs sm:text-sm text-ink-900 outline-none"
                  >
                    <option value={1}>1st Owner</option>
                    <option value={2}>2nd Owner</option>
                    <option value={3}>3rd Owner</option>
                    <option value={4}>4th+ Owner</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai, Bengaluru, Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-3 bg-surface border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm text-ink-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">State for GST Place of Supply</label>
                <select
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  className="w-full p-3 bg-surface border border-border rounded-xl text-xs sm:text-sm text-ink-900 outline-none"
                >
                  <option value="TN">Tamil Nadu (CGST 9% + SGST 9%)</option>
                  <option value="KA">Karnataka (IGST 18%)</option>
                  <option value="MH">Maharashtra (IGST 18%)</option>
                  <option value="DL">Delhi (IGST 18%)</option>
                  <option value="TS">Telangana (IGST 18%)</option>
                  <option value="KL">Kerala (IGST 18%)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe service records, insurance validity, modifications, reason for selling..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-surface border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm text-ink-900 outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-ink-600 hover:bg-surface rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-accent-500 hover:bg-accent-600 text-ink-900 font-semibold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-xs flex items-center gap-2"
                >
                  <span>Next: Upload Photos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Photos & Video */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="font-heading font-bold text-lg text-ink-900">
                  Step 3: Vehicle Photos & Walkaround Video
                </h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  All photos are automatically stripped of GPS EXIF data and converted to WebP.
                </p>
              </div>

              {/* Photos Grid */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-ink-700 block">
                  Uploaded Photos ({photos.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photos.map((p, idx) => (
                    <div key={p.id} className="relative aspect-4/3 rounded-xl overflow-hidden border border-border group">
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1 bg-ink-900/80 text-paper text-[10px] px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddPhotoMock}
                    className="aspect-4/3 rounded-xl border-2 border-dashed border-border hover:border-accent-500 hover:bg-surface/60 flex flex-col items-center justify-center gap-1 text-ink-600 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-accent-600" />
                    <span className="text-[11px] font-semibold">+ Add Photo</span>
                  </button>
                </div>
              </div>

              {/* Video Walkaround Link */}
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">
                  Video Walkaround Link (YouTube / Vimeo - Optional)
                </label>
                <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2.5">
                  <Video className="w-4 h-4 text-accent-500 shrink-0" />
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-ink-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-ink-600 hover:bg-surface rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="bg-accent-500 hover:bg-accent-600 text-ink-900 font-semibold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-xs flex items-center gap-2"
                >
                  <span>Next: Choose Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Plan Selection */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="font-heading font-bold text-lg text-ink-900">
                  Step 4: Select Listing Plan
                </h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Fixed transparent fee based on vehicle category. Valid for full 365 days.
                </p>
              </div>

              <div className="p-6 bg-accent-500/10 border-2 border-accent-500 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent-700">
                    {category.toUpperCase()} PLAN
                  </span>
                  <h4 className="font-heading font-extrabold text-2xl text-ink-900">
                    {currentPlan.label}
                  </h4>
                  <p className="text-xs text-ink-600">
                    Includes 365 days active listing, EXIF stripping, direct WhatsApp connect & RTO hash check.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-success bg-success/15 px-3 py-1.5 rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                  <span>100% Verified Ad</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-xs font-semibold text-ink-600 hover:bg-surface rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="bg-accent-500 hover:bg-accent-600 text-ink-900 font-semibold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-xs flex items-center gap-2"
                >
                  <span>Next: Promo & Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Promo Code & Checkout */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="font-heading font-bold text-lg text-ink-900">
                  Step 5: Apply Promo Code & Finalize Listing
                </h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Review GST tax invoice breakdown and activate your vehicle ad.
                </p>
              </div>

              {/* Promo Code Box */}
              <div className="p-4 bg-surface rounded-2xl border border-border space-y-3">
                <label className="text-xs font-semibold text-ink-700 block">
                  Have a Promo Code or Dealer Coupon?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. LAUNCH100, SAVE200)"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 p-2.5 bg-paper border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm font-mono tracking-wider uppercase text-ink-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo || !promoCodeInput.trim()}
                    className="bg-ink-900 hover:bg-ink-800 text-paper px-4 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {isApplyingPromo ? "Applying..." : "Apply"}
                  </button>
                </div>

                {appliedPromo && (
                  <div className="text-xs font-semibold text-success flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Coupon {appliedPromo.code} applied! Saved ₹{appliedPromo.discountInr}</span>
                  </div>
                )}
                {promoError && (
                  <div className="text-xs font-medium text-danger flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>{promoError}</span>
                  </div>
                )}
              </div>

              {/* GST Price Breakdown Card */}
              <div className="p-5 bg-paper border border-border rounded-2xl space-y-3">
                <h4 className="font-heading font-semibold text-xs uppercase tracking-wider text-ink-700">
                  Tax Invoice Summary (Place of Supply: {stateCode})
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-ink-600">
                    <span>Base Listing Fee (365 Days)</span>
                    <span className="font-mono">₹{baseFeeInr}</span>
                  </div>
                  {discountInr > 0 && (
                    <div className="flex justify-between text-success font-semibold">
                      <span>Promo Discount ({appliedPromo?.code})</span>
                      <span className="font-mono">-₹{discountInr}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-ink-600">
                    <span>
                      {isTN ? "CGST (9%) + SGST (9%)" : "IGST (18%)"}
                    </span>
                    <span className="font-mono">₹{gstInr}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-bold text-sm sm:text-base text-ink-900">
                    <span>Total Amount Payable</span>
                    <span className="font-mono text-accent-700">₹{totalInr}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-4 py-2 text-xs font-semibold text-ink-600 hover:bg-surface rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleCompletePosting}
                  disabled={isSubmitting}
                  className="bg-accent-500 hover:bg-accent-600 text-ink-900 font-bold text-xs sm:text-sm py-3 px-8 rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 stroke-[2.5]" />
                  <span>{isSubmitting ? "Processing..." : totalInr === 0 ? "Activate Free Listing" : `Pay ₹${totalInr} & Publish Ad`}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
