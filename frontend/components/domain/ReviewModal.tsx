"use client";

import React, { useState } from "react";
import { Star, X, CheckCircle2, AlertCircle } from "lucide-react";
import { submitSellerReview } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName?: string;
  onReviewSubmitted?: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  sellerId,
  sellerName = "Seller",
  onReviewSubmitted,
}: ReviewModalProps) {
  const { user, openSignInModal } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
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

    if (text.trim().length < 5) {
      setError("Please write at least 5 characters in your review.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitSellerReview({
        seller_id: sellerId,
        rating,
        text: text.trim(),
      });
      setSuccess(true);
      if (onReviewSubmitted) onReviewSubmitted();
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setText("");
      }, 1500);
    } catch (err: any) {
      if (err.code === "CONTACT_REQUIRED_FOR_REVIEW") {
        setError("You can only review sellers after contacting them via WhatsApp on ListedWheels.");
      } else if (err.code === "REVIEW_ALREADY_EXISTS") {
        setError("You have already submitted a review for this seller.");
      } else {
        setError(err.message || "Failed to submit review. Please try again.");
      }
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

        <h3 className="font-heading font-bold text-lg text-ink-900">
          Review {sellerName}
        </h3>
        <p className="text-xs text-ink-500 mt-1">
          Share your direct buyer experience to help the community.
        </p>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-semibold text-sm text-ink-900">Review Published!</h4>
            <p className="text-xs text-ink-500">Thank you for contributing to trusted marketplace ratings.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Star Selector */}
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1.5">
                Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-ink-300 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        (hoverRating || rating) >= star
                          ? "text-accent-500 fill-accent-500"
                          : "text-ink-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-semibold text-ink-700">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1.5">
                Your Feedback
              </label>
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="How was vehicle condition, communication, and inspection transparency?..."
                className="w-full p-3 bg-surface border border-border focus:border-accent-500 focus:bg-paper rounded-xl text-xs sm:text-sm text-ink-900 outline-none transition-colors resize-none"
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
                className="px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-ink-900 font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Publishing..." : "Submit Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
