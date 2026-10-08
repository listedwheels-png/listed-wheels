"use client";

import React from "react";
import Link from "next/link";
import { Car, ShieldCheck, MessageCircle, FileText, CheckCircle2, Award } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-16 pb-16 sm:pb-8">
      {/* Value Trust Bar */}
      <div className="border-b border-border bg-surface-elevated/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-100 flex items-center justify-center text-accent-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-semibold text-sm text-ink-900">Verified Direct Sellers</h4>
                <p className="text-xs text-ink-600 mt-0.5">
                  RTO registration check & document verification for dealers and private sellers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-success/15 flex items-center justify-center text-success shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-semibold text-sm text-ink-900">Direct WhatsApp Connect</h4>
                <p className="text-xs text-ink-600 mt-0.5">
                  Chat directly with owners with no middleman brokerage or fake inquiries.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-semibold text-sm text-ink-900">GST Invoices & Transparent Pricing</h4>
                <p className="text-xs text-ink-600 mt-0.5">
                  Automated GSTR-compliant tax invoices and simple flat listing plans.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Col 1: Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center text-ink-900 font-bold">
                <Car className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-heading font-bold text-lg text-ink-900">
                Listed<span className="text-accent-500">Wheels</span>
              </span>
            </Link>
            <p className="text-xs text-ink-600 mt-3 max-w-sm leading-relaxed">
              India's trust-first marketplace for pre-owned cars, bikes, and bicycles. Verified registrations,
              EXIF-stripped private media, and direct WhatsApp buyer-seller connections.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-accent-700 bg-accent-100/70 px-3 py-1.5 rounded-lg w-fit">
              <Award className="w-4 h-4" />
              <span>Made in India • 100% Verified Community</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h5 className="font-heading font-semibold text-xs text-ink-900 uppercase tracking-wider mb-3">
              Categories
            </h5>
            <ul className="space-y-2 text-xs text-ink-600">
              <li>
                <Link href="/search?category=cars" className="hover:text-accent-600 transition-colors">
                  Used Cars
                </Link>
              </li>
              <li>
                <Link href="/search?category=bikes" className="hover:text-accent-600 transition-colors">
                  Used Motorcycles & Scooters
                </Link>
              </li>
              <li>
                <Link href="/search?category=cycles" className="hover:text-accent-600 transition-colors">
                  Bicycles & MTBs
                </Link>
              </li>
              <li>
                <Link href="/search?category=other" className="hover:text-accent-600 transition-colors">
                  Commercial & Other
                </Link>
              </li>
              <li>
                <Link href="/sell" className="hover:text-accent-600 text-accent-700 font-medium transition-colors">
                  + Post a Vehicle Ad
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Cities */}
          <div>
            <h5 className="font-heading font-semibold text-xs text-ink-900 uppercase tracking-wider mb-3">
              Top Locations
            </h5>
            <ul className="space-y-2 text-xs text-ink-600">
              <li>
                <Link href="/search?city=Chennai" className="hover:text-accent-600 transition-colors">
                  Chennai
                </Link>
              </li>
              <li>
                <Link href="/search?city=Bengaluru" className="hover:text-accent-600 transition-colors">
                  Bengaluru
                </Link>
              </li>
              <li>
                <Link href="/search?city=Mumbai" className="hover:text-accent-600 transition-colors">
                  Mumbai
                </Link>
              </li>
              <li>
                <Link href="/search?city=Delhi+NCR" className="hover:text-accent-600 transition-colors">
                  Delhi NCR
                </Link>
              </li>
              <li>
                <Link href="/search?city=Hyderabad" className="hover:text-accent-600 transition-colors">
                  Hyderabad
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Legal */}
          <div>
            <h5 className="font-heading font-semibold text-xs text-ink-900 uppercase tracking-wider mb-3">
              Trust & Legal
            </h5>
            <ul className="space-y-2 text-xs text-ink-600">
              <li>
                <Link href="/terms" className="hover:text-accent-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-accent-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-accent-600 transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/pricing-terms" className="hover:text-accent-600 transition-colors">
                  Listing Plans & GST
                </Link>
              </li>
              <li>
                <Link href="/styleguide" className="hover:text-accent-600 text-ink-400 transition-colors">
                  Design System
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-ink-500 gap-3">
          <p>© {new Date().getFullYear()} ListedWheels India. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>GSTIN: 33AAAAA0000A1Z5</span>
            <span>•</span>
            <span>Secured with AES-256</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
