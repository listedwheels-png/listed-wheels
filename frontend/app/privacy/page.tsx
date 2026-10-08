"use client";

import React from "react";
import { ShieldCheck, Lock, EyeOff } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-accent-700">
          <Lock className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Privacy & Data Safeguards</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl text-ink-900">
          Privacy Policy
        </h1>
        <p className="text-xs text-ink-500">
          Last updated: October 8, 2026 • Digital Personal Data Protection (DPDP) Act Compliant
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-ink-800 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-heading font-bold text-lg text-ink-900">1. Automated EXIF Metadata Stripping</h2>
          <p className="text-xs sm:text-sm text-ink-700">
            When you upload vehicle photos to ListedWheels, our backend media pipeline automatically extracts and strips
            all EXIF metadata — including GPS geographical coordinates, camera model serials, and timestamps — before
            converting the image to optimized WebP format and serving it through the CloudFront Content Delivery Network (CDN).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-bold text-lg text-ink-900">2. Registration Number Masking</h2>
          <p className="text-xs sm:text-sm text-ink-700">
            To prevent vehicle cloning while maintaining trust, public vehicle cards display masked registration numbers
            (e.g., <code>TN 09 ** 1234</code>). The full registration number is stored in a private cryptographic SHA-256
            hash format for duplicate prevention and admin verification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-bold text-lg text-ink-900">3. Private Document Vault (Zero Public Access)</h2>
          <p className="text-xs sm:text-sm text-ink-700">
            Government identification documents (Aadhaar, PAN, RC smart cards) uploaded for seller verification are stored
            in a dedicated private S3 bucket encrypted with Server-Side Encryption (SSE-S3 / AES-256). These documents are never
            indexed or made public and are accessed solely by authorized compliance officers via short-lived 900-second signed URLs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading font-bold text-lg text-ink-900">4. Cookies & Authentication Tokens</h2>
          <p className="text-xs sm:text-sm text-ink-700">
            ListedWheels uses secure <code>HttpOnly, Secure, SameSite=lax</code> session cookies (<code>lw_refresh_token</code>)
            to manage authentication state without exposing sensitive tokens to browser script injection vulnerabilities.
          </p>
        </section>
      </div>
    </div>
  );
}
