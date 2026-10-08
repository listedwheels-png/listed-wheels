"use client";

import React from "react";
import Link from "next/link";
import { Tag, CheckCircle2, ShieldCheck, FileText, ArrowRight } from "lucide-react";

export default function PricingTermsPage() {
  const plans = [
    {
      category: "Bicycles & MTBs",
      price: "₹99",
      duration: "365 Days",
      features: [
        "1 full year active listing",
        "Up to 10 high-res WebP photos",
        "Direct WhatsApp seller chat",
        "Zero brokerage commissions",
        "Automated GST invoice",
      ],
    },
    {
      category: "Bikes & Scooters",
      price: "₹999",
      duration: "365 Days",
      popular: true,
      features: [
        "1 full year active listing",
        "RTO registration SHA-256 hash check",
        "Masked plate privacy protection",
        "Direct WhatsApp seller connect",
        "Optional YouTube walkaround embed",
        "Automated GSTR-1 invoice",
      ],
    },
    {
      category: "Used Cars",
      price: "₹1,999",
      duration: "365 Days",
      features: [
        "1 full year active listing",
        "1-active-listing anti-scam protection",
        "EXIF-stripped high-resolution gallery",
        "Video walkaround & exhaust sound embed",
        "Verified seller trust badge",
        "Compliant tax invoice with CGST/SGST/IGST breakdown",
      ],
    },
    {
      category: "Commercial & Other",
      price: "₹2,499",
      duration: "365 Days",
      features: [
        "1 full year active listing",
        "Heavy & commercial vehicle support",
        "Priority buyer search placement",
        "Dedicated compliance review",
        "Full GST credit invoice",
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-700 bg-accent-100 px-3 py-1 rounded-full">
          <Tag className="w-3.5 h-3.5" />
          <span>Transparent Listing Fees</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink-900">
          Flat 365-Day Plans. Zero Brokerage.
        </h1>
        <p className="text-xs sm:text-sm text-ink-600">
          No monthly renewal traps. Pay once and keep your vehicle active until it sells.
        </p>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => (
          <div
            key={p.category}
            className={`bg-paper rounded-3xl p-6 border flex flex-col justify-between space-y-6 transition-all ${
              p.popular
                ? "border-accent-500 ring-2 ring-accent-500/20 shadow-md relative"
                : "border-border shadow-xs hover:border-ink-300"
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-500 text-ink-900 font-bold text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                Most Popular
              </span>
            )}

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  {p.category}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-heading font-extrabold text-3xl text-ink-900">{p.price}</span>
                  <span className="text-xs text-ink-500 font-medium">+ 18% GST</span>
                </div>
                <span className="text-[11px] text-accent-700 font-semibold block mt-0.5">
                  Valid for {p.duration}
                </span>
              </div>

              <div className="border-t border-border pt-4 space-y-2.5 text-xs text-ink-700">
                {p.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/sell">
              <button
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  p.popular
                    ? "bg-accent-500 hover:bg-accent-600 text-ink-900 shadow-xs"
                    : "bg-surface hover:bg-surface-elevated text-ink-900 border border-border"
                }`}
              >
                Post in {p.category}
              </button>
            </Link>
          </div>
        ))}
      </div>

      {/* GST Compliance Section */}
      <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-ink-900">
          <FileText className="w-5 h-5 text-accent-600" />
          <h3 className="font-heading font-bold text-base sm:text-lg">
            Goods & Services Tax (GST) Compliance
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-ink-600 leading-relaxed max-w-3xl">
          ListedWheels operates strictly under Indian GST regulations (SAC code 998413 - Internet advertising space).
          For sellers registered in Tamil Nadu (Place of Supply: TN), GST is invoiced as <strong>9% CGST + 9% SGST</strong>.
          For sellers in all other Indian states and union territories, GST is invoiced as <strong>18% IGST</strong>.
          Tax invoices with sequential numbering (<code>INV-YYYYMM-XXXX</code>) are instantly generated and downloadable
          from your Seller Dashboard for input tax credit (ITC) claims.
        </p>
      </div>
    </div>
  );
}
