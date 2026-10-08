import React from "react";
import { formatINR } from "@/lib/utils";

export interface PriceBreakdownProps {
  basePaise: number;
  discountPaise?: number;
  isSameState?: boolean; // true for CGST+SGST, false for IGST
  promoCode?: string;
  className?: string;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  basePaise,
  discountPaise = 0,
  isSameState = true,
  promoCode,
  className = "",
}) => {
  const discountedBasePaise = Math.max(0, basePaise - discountPaise);
  const gstRate = 0.18;
  const gstTotalPaise = Math.round(discountedBasePaise * gstRate);
  const cgstPaise = Math.round(gstTotalPaise / 2);
  const sgstPaise = gstTotalPaise - cgstPaise;
  const igstPaise = gstTotalPaise;
  const totalPaise = discountedBasePaise + gstTotalPaise;

  return (
    <div className={`bg-surface rounded-card border border-ink-200 p-5 shadow-card ${className}`}>
      <h4 className="font-display font-bold text-base text-ink-900 mb-4 pb-2 border-b border-ink-200">
        Price Breakdown
      </h4>

      <div className="space-y-2.5 text-sm text-ink-700">
        {/* Base Listing Fee */}
        <div className="flex justify-between items-center">
          <span className="text-ink-500">12-Month Listing Fee:</span>
          <span className="font-medium text-ink-900 tabular-nums">
            {formatINR(basePaise, true)}
          </span>
        </div>

        {/* Promo Discount */}
        {discountPaise > 0 && (
          <div className="flex justify-between items-center text-success">
            <span className="flex items-center gap-1.5">
              <span>Promo Discount</span>
              {promoCode && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-success/15 font-semibold">
                  {promoCode}
                </span>
              )}:
            </span>
            <span className="font-semibold tabular-nums">
              - {formatINR(discountPaise, true)}
            </span>
          </div>
        )}

        {/* Discounted Base */}
        {discountPaise > 0 && (
          <div className="flex justify-between items-center text-xs text-ink-500 pt-1 border-t border-dashed border-ink-200">
            <span>Taxable Amount:</span>
            <span className="font-medium text-ink-700 tabular-nums">
              {formatINR(discountedBasePaise, true)}
            </span>
          </div>
        )}

        {/* GST 18% Split */}
        {isSameState ? (
          <>
            <div className="flex justify-between items-center text-xs text-ink-500">
              <span>CGST (9%):</span>
              <span className="font-medium text-ink-700 tabular-nums">
                {formatINR(cgstPaise, true)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-ink-500">
              <span>SGST (9%):</span>
              <span className="font-medium text-ink-700 tabular-nums">
                {formatINR(sgstPaise, true)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center text-xs text-ink-500">
            <span>IGST (18%):</span>
            <span className="font-medium text-ink-700 tabular-nums">
              {formatINR(igstPaise, true)}
            </span>
          </div>
        )}

        {/* Total in Bold */}
        <div className="pt-3 border-t-2 border-ink-900 flex justify-between items-baseline">
          <div className="flex flex-col">
            <span className="font-display font-bold text-base text-ink-900">Total Payable</span>
            <span className="text-[11px] text-ink-500 font-normal">Inclusive of 18% GST</span>
          </div>
          <span className="font-display font-bold text-xl text-ink-900 tabular-nums">
            {formatINR(totalPaise, true)}
          </span>
        </div>
      </div>
    </div>
  );
};
