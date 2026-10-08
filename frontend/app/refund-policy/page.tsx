"use client";

import React from "react";
import { RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-accent-700">
          <RotateCcw className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Billing & Returns</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl text-ink-900">
          Cancellation & Refund Policy
        </h1>
        <p className="text-xs text-ink-500">
          Last updated: October 8, 2026
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-ink-800 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-heading font-bold text-lg text-ink-900">1. Listing Activation Services</h2>
          <p className="text-xs sm:text-sm text-ink-700">
            ListedWheels provides digital vehicle publishing, image processing, EXIF stripping, and listing distribution
            services. Once a listing fee order is paid and the listing is approved and published live to the directory,
            the digital service is deemed fully delivered.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-bold text-lg text-ink-900">2. Rejection & Full Refund Policy</h2>
          <p className="text-xs sm:text-sm text-ink-700">
            If your listing is rejected by our compliance team due to an invalid registration format or duplicate hash
            conflict that cannot be resolved, you are entitled to an immediate 100% refund or credit note to your original
            payment source within 5-7 business days.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-bold text-lg text-ink-900">3. Voluntary Vehicle Sale</h2>
          <p className="text-xs sm:text-sm text-ink-700">
            If you sell your vehicle prior to the expiration of the 365-day listing validity, you may mark the listing as
            "Sold" in your Seller Dashboard. No partial pro-rata refunds are issued for early sales.
          </p>
        </section>
      </div>
    </div>
  );
}
