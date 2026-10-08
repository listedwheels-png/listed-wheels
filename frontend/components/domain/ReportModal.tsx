"use client";

import React, { useState } from "react";
import { Flag, X, CheckCircle2, AlertCircle } from "lucide-react";
import { reportListing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle?: string;
}

const REPORT_REASONS = [
  { id: "fraud_suspected", label: "Suspected Scam or Fraudulent Request" },
  { id: "misleading", label: "Inaccurate Specifications or Condition" },
  { id: "already_sold", label: "Vehicle is Already Sold" },
  { id: "wrong_price", label: "Unrealistically Low Bait Price" },
  { id: "abuse", label: "Inappropriate Images or Contact Behavior" },
  { id: "other", label: "Other Violation" },
];

export function ReportModal({
  isOpen,
  onClose,
  listingId,
  listingTitle = "this vehicle",
}: ReportModalProps) {
  const { user, openSignInModal } = useAuth();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].id);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openSignInModal();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const fullReason = details.trim()
        ? `${selectedReason}: ${details.trim()}`
        : selectedReason;

      await reportListing(listingId, fullReason);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setDetails("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-paper border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-ink-400 hover:text-ink-900 rounded-lg hover:bg-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-danger">
          <Flag className="w-5 h-5" />
          <h3 className="font-heading font-bold text-lg text-ink-900">
            Report Listing
          </h3>
        </div>
        <p className="text-xs text-ink-500 mt-1">
          Help us maintain trust on ListedWheels. Reports are reviewed by moderators within 2 hours.
        </p>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-semibold text-sm text-ink-900">Report Received</h4>
            <p className="text-xs text-ink-500">Our moderation team is investigating this listing.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Reasons List */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-700 block">
                Reason for Reporting
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      selectedReason === r.id
                        ? "border-accent-500 bg-accent-500/5 text-ink-900 font-medium"
                        : "border-border hover:bg-surface text-ink-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={r.id}
                      checked={selectedReason === r.id}
                      onChange={() => setSelectedReason(r.id)}
                      className="text-accent-500 focus:ring-accent-500"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional details */}
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any specific observations..."
                className="w-full p-2.5 bg-surface border border-border focus:border-accent-500 focus:bg-paper rounded-xl text-xs text-ink-900 outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-ink-600 hover:bg-surface rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-danger text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs hover:bg-danger/90 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
