"use client";

import React, { useState } from "react";
import { ShieldCheck, Loader2, Sparkles, UserCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { loginWithGoogle, UserProfile } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";

export interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { signInWithDemo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(true);

  const handleGoogleSignIn = async () => {
    if (!termsAccepted) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In production, this receives the ID token from Google Identity Services
      const result = await loginWithGoogle("mock-token", true, "1.0");
      if (onSuccess) onSuccess(result.user);
      onClose();
    } catch (err: any) {
      // If backend mock is offline, fallback to demo session
      signInWithDemo("buyer");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: "buyer" | "seller" | "dealer" | "admin") => {
    signInWithDemo(role);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign in to ListedWheels"
      description="Connect directly with verified buyers & sellers in India"
      asBottomSheetOnMobile
      maxWidth="sm"
    >
      <div className="space-y-5 pt-2 text-center">
        {/* Trust badge */}
        <div className="mx-auto w-12 h-12 rounded-2xl bg-accent-500/15 flex items-center justify-center text-accent-600">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div>
          <h4 className="font-heading font-bold text-base sm:text-lg text-ink-900 mb-1">
            Fast &amp; Passwordless Login
          </h4>
          <p className="text-xs text-ink-500 max-w-xs mx-auto">
            We use Google Sign-In for instant account verification.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger text-left">
            {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-ink-900 font-semibold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50 min-h-[48px]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-ink-900" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Demo Roles Quick Login for Testing */}
        <div className="pt-2 border-t border-border">
          <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider block mb-2">
            Quick Testing Persona Switcher
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("buyer")}
              className="p-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-[11px] font-medium text-ink-700 text-left flex items-center justify-between"
            >
              <span>Buyer Ananya</span>
              <span className="text-[9px] bg-ink-200 px-1.5 py-0.5 rounded">Buyer</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("seller")}
              className="p-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-[11px] font-medium text-ink-700 text-left flex items-center justify-between"
            >
              <span>Seller Rajesh</span>
              <span className="text-[9px] bg-accent-100 text-accent-800 px-1.5 py-0.5 rounded">Seller</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("dealer")}
              className="p-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-[11px] font-medium text-ink-700 text-left flex items-center justify-between"
            >
              <span>Apex Motors</span>
              <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Dealer</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("admin")}
              className="p-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-[11px] font-medium text-accent-700 text-left flex items-center justify-between font-semibold"
            >
              <span>Admin Portal</span>
              <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">Admin</span>
            </button>
          </div>
        </div>

        {/* Terms of Service Consent */}
        <div className="pt-2">
          <label className="flex items-start gap-2 text-left cursor-pointer text-[11px] text-ink-500">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 rounded text-accent-500 focus:ring-accent-500 border-border"
            />
            <span>
              By signing in, you agree to the{" "}
              <span className="font-semibold text-ink-900 underline">Terms of Service</span> and{" "}
              <span className="font-semibold text-ink-900 underline">Privacy Policy</span>.
            </span>
          </label>
        </div>
      </div>
    </Modal>
  );
};
