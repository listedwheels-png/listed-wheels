"use client";

import React from "react";
import Link from "next/link";
import { FileText, ShieldCheck, Scale, AlertCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-accent-700">
          <Scale className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Legal Terms & Compliance</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl text-ink-900">
          Terms of Service
        </h1>
        <p className="text-xs text-ink-500">
          Last updated: October 8, 2026 • Version 1.0 (Clickwrap Standard)
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-ink-800 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-heading font-bold text-lg text-ink-900">1. Acceptance of Terms</h2>
          <p className="text-xs sm:text-sm text-ink-700">
            By accessing, browsing, or listing any vehicle on ListedWheels (the "Platform"), you agree to be bound
            by these Terms of Service in compliance with the Information Technology Act, 2000 and applicable Indian laws.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-bold text-lg text-ink-900">2. Listing Rules & Vehicle Authenticity</h2>
          <p className="text-xs sm:text-sm text-ink-700">
            Every seller warrants and represents that:
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-ink-700 space-y-1.5">
            <li>They are the rightful owner or an authorized dealer of the listed vehicle.</li>
            <li>All registration numbers provided are valid Indian RTO registrations.</li>
            <li>Only <strong>1 active listing per vehicle</strong> is permitted across the entire platform. SHA-256 hash duplication algorithms will automatically reject duplicate listings.</li>
            <li>Vehicle specifications, odometer readings, and condition descriptions are genuine and accurate.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-bold text-lg text-ink-900">3. Direct Peer-to-Peer Communication</h2>
          <p className="text-xs sm:text-sm text-ink-700">
            ListedWheels facilitates direct communication between buyers and sellers via WhatsApp. ListedWheels is an
            intermediary platform and does not hold custody of vehicles, handle escrow payments, or charge transaction brokerage.
            Buyers must physically inspect vehicles and verify original documents before releasing funds.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-bold text-lg text-ink-900">4. Listing Plans & 365-Day Expiry</h2>
          <p className="text-xs sm:text-sm text-ink-700">
            Approved listings remain active for a maximum duration of 365 calendar days from the date of approval.
            Listing fees are non-refundable once approved, as digital publishing and verification services are delivered immediately.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-bold text-lg text-ink-900">5. Moderation & Blacklisting</h2>
          <p className="text-xs sm:text-sm text-ink-700">
            ListedWheels reserves the right to immediately suspend or permanently ban any user or vehicle found to be
            involved in fraud, stolen property, meter tampering, or abusive conduct. Banned hashes are permanently recorded in
            compliance databases.
          </p>
        </section>
      </div>
    </div>
  );
}
