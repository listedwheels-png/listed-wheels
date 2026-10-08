"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  FileText,
  ShieldCheck,
  User,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit,
  Tag,
  Download,
  Upload,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getMySellerProfile,
  markListingSold,
  updateMySellerProfile,
} from "@/lib/api";
import { Listing, SellerProfile } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const SAMPLE_MY_LISTINGS: Listing[] = [
  {
    id: "f1a2b3c4-0001-4000-8000-000000000001",
    seller_id: "s1",
    category: "cars",
    title: "2021 Hyundai i20 Asta 1.2 MT",
    make: "Hyundai",
    model: "i20 Asta",
    year: 2021,
    price_paise: 82500000,
    city: "Chennai",
    registration_no_masked: "TN 09 ** 1234",
    mileage_km: 28400,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    media: [
      {
        id: "m1",
        kind: "photo",
        storage_key: "k1",
        position: 0,
        url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, openSignInModal } = useAuth();

  const [activeTab, setActiveTab] = useState<"listings" | "profile" | "documents" | "invoices">("listings");
  const [myListings, setMyListings] = useState<Listing[]>(SAMPLE_MY_LISTINGS);

  // Profile Form State
  const [profileType, setProfileType] = useState<"individual" | "dealer">("individual");
  const [shopName, setShopName] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [whatsapp, setWhatsapp] = useState("+919876543210");
  const [mapsLink, setMapsLink] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Document Upload State
  const [docType, setDocType] = useState("RC");
  const [docUploaded, setDocUploaded] = useState(false);

  useEffect(() => {
    if (user) {
      getMySellerProfile()
        .then((p) => {
          if (p) {
            setProfileType(p.type || "individual");
            setShopName(p.shop_name || "");
            setGstNo(p.gst_no || "");
            setWhatsapp(p.whatsapp || "+919876543210");
            setMapsLink(p.maps_link || "");
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleMarkSold = async (id: string) => {
    if (!confirm("Are you sure you want to mark this listing as sold?")) return;
    try {
      await markListingSold(id);
      setMyListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "sold" } : l))
      );
    } catch {
      setMyListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "sold" } : l))
      );
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateMySellerProfile({
        type: profileType,
        shop_name: shopName,
        gst_no: gstNo,
        whatsapp,
        maps_link: mapsLink,
      });
      setProfileSavedMsg(true);
      setTimeout(() => setProfileSavedMsg(false), 2000);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-paper border border-border rounded-3xl text-center space-y-4 shadow-lg">
        <User className="w-12 h-12 text-accent-500 mx-auto" />
        <h2 className="font-heading font-bold text-xl text-ink-900">Sign in to Access Dashboard</h2>
        <p className="text-xs text-ink-500">
          Manage your active listings, invoices, and verification documents.
        </p>
        <button
          onClick={openSignInModal}
          className="w-full bg-accent-500 hover:bg-accent-600 text-ink-900 font-bold text-sm py-3 rounded-xl shadow-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink-900">
              Seller Dashboard
            </h1>
            <span className="text-[11px] font-semibold text-accent-800 bg-accent-100 px-2.5 py-0.5 rounded-full uppercase">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            Welcome back, {user.name} ({user.email})
          </p>
        </div>

        <Link href="/sell">
          <button className="bg-accent-500 hover:bg-accent-600 text-ink-900 font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-xs flex items-center gap-2">
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>+ Post New Vehicle Ad</span>
          </button>
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "listings", label: "My Listings", icon: Car },
          { id: "profile", label: "Seller & Dealership Profile", icon: User },
          { id: "documents", label: "Document Verification", icon: ShieldCheck },
          { id: "invoices", label: "GST Tax Invoices", icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                isActive
                  ? "bg-ink-900 text-paper shadow-xs"
                  : "bg-surface hover:bg-surface-elevated text-ink-700 border border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: My Listings */}
      {activeTab === "listings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-ink-900">
              Active & Sold Vehicles ({myListings.length})
            </h3>
          </div>

          <div className="space-y-3">
            {myListings.map((l) => (
              <div
                key={l.id}
                className="bg-paper border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-surface shrink-0 border border-border">
                    <img
                      src={
                        l.media?.[0]?.url ||
                        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80"
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-heading font-semibold text-sm sm:text-base text-ink-900">
                        {l.title}
                      </h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          l.status === "active"
                            ? "bg-success/15 text-success"
                            : l.status === "sold"
                            ? "bg-ink-200 text-ink-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 mt-0.5">
                      {formatINR(l.price_paise, true)} • {l.city} • {l.registration_no_masked || "No Reg"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Link href={`/listings/${l.id}`}>
                    <button className="p-2 text-xs font-semibold text-ink-700 hover:bg-surface border border-border rounded-xl flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </Link>
                  {l.status === "active" && (
                    <button
                      onClick={() => handleMarkSold(l.id)}
                      className="px-3 py-2 text-xs font-semibold text-success hover:bg-success/10 border border-success/30 rounded-xl"
                    >
                      Mark as Sold
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Seller & Dealership Profile */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-paper border border-border rounded-3xl p-6 sm:p-8 max-w-2xl space-y-5 shadow-xs">
          <div>
            <h3 className="font-heading font-bold text-lg text-ink-900">
              Seller & Dealership Profile
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              These details appear on your public seller cards and vehicle listings.
            </p>
          </div>

          {profileSavedMsg && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-xl text-xs font-semibold text-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-ink-700 block mb-1">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProfileType("individual")}
                className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                  profileType === "individual"
                    ? "border-accent-500 bg-accent-500/10 text-ink-900"
                    : "border-border hover:bg-surface text-ink-600"
                }`}
              >
                Individual Private Seller
              </button>
              <button
                type="button"
                onClick={() => setProfileType("dealer")}
                className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                  profileType === "dealer"
                    ? "border-accent-500 bg-accent-500/10 text-ink-900"
                    : "border-border hover:bg-surface text-ink-600"
                }`}
              >
                Registered Dealership / Showroom
              </button>
            </div>
          </div>

          {profileType === "dealer" && (
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">Dealership / Shop Name</label>
              <input
                type="text"
                placeholder="e.g. Apex Luxury Motors"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full p-3 bg-surface border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm text-ink-900 outline-none"
              />
            </div>
          )}

          {profileType === "dealer" && (
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">GSTIN Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 33AAAAA0000A1Z5"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value.toUpperCase())}
                className="w-full p-3 bg-surface border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm text-ink-900 font-mono uppercase outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-ink-700 block mb-1">
              WhatsApp Business Phone Number *
            </label>
            <input
              type="text"
              required
              placeholder="+919876543210"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full p-3 bg-surface border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm text-ink-900 font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-700 block mb-1">Google Maps Location Link</label>
            <input
              type="url"
              placeholder="https://maps.google.com/?q=..."
              value={mapsLink}
              onChange={(e) => setMapsLink(e.target.value)}
              className="w-full p-3 bg-surface border border-border focus:border-accent-500 rounded-xl text-xs sm:text-sm text-ink-900 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="bg-accent-500 hover:bg-accent-600 text-ink-900 font-bold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {isSavingProfile ? "Saving..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Document Verification */}
      {activeTab === "documents" && (
        <div className="bg-paper border border-border rounded-3xl p-6 sm:p-8 max-w-2xl space-y-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent-600" />
              <h3 className="font-heading font-bold text-lg text-ink-900">
                Seller Verification Badge
              </h3>
            </div>
            <p className="text-xs text-ink-600 mt-1">
              Upload your vehicle RC copy or Government ID to earn the Verified Seller badge.
              Documents are stored with private AES-256 encryption and zero public access.
            </p>
          </div>

          {docUploaded ? (
            <div className="p-4 bg-success/10 border border-success/20 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
              <h4 className="font-heading font-semibold text-sm text-ink-900">
                Verification Document Under Review
              </h4>
              <p className="text-xs text-ink-600">
                Our compliance team verifies RC copies within 4 business hours.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-3 bg-surface border border-border rounded-xl text-xs sm:text-sm text-ink-900 outline-none"
                >
                  <option value="RC">Vehicle RC Smart Card (Recommended)</option>
                  <option value="AADHAAR">Aadhaar Card (Individual Proof)</option>
                  <option value="PAN">PAN Card (Business / Dealer Proof)</option>
                </select>
              </div>

              <div className="p-8 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:bg-surface/50 transition-colors">
                <Upload className="w-8 h-8 text-accent-600 mb-1" />
                <span className="text-xs font-semibold text-ink-900">
                  Upload Scanned Copy / Clear Photo (PDF, JPG, PNG)
                </span>
                <span className="text-[11px] text-ink-500">Max file size: 10MB</span>
                <button
                  type="button"
                  onClick={() => setDocUploaded(true)}
                  className="mt-2 bg-ink-900 text-paper font-semibold text-xs px-4 py-2 rounded-xl"
                >
                  Select File & Submit for Review
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GST Tax Invoices */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-lg text-ink-900">
            GST Compliance & Invoice History
          </h3>

          <div className="bg-paper border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface border-b border-border text-ink-600 uppercase font-semibold">
                  <tr>
                    <th className="p-4">Invoice No</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Listing Category</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-ink-800">
                  <tr>
                    <td className="p-4 font-mono font-semibold text-ink-900">INV-202610-0042</td>
                    <td className="p-4">Oct 08, 2026</td>
                    <td className="p-4">Cars (365 Days)</td>
                    <td className="p-4 font-mono font-semibold">₹1,999</td>
                    <td className="p-4">
                      <span className="bg-success/15 text-success font-semibold px-2 py-0.5 rounded-full text-[10px]">
                        PAID
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => alert("Downloading PDF Invoice: INV-202610-0042.pdf")}
                        className="p-1.5 hover:bg-surface rounded-lg text-ink-600 hover:text-ink-900"
                        title="Download Tax Invoice"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
