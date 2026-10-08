"use client";

import React, { useState } from "react";
import { Filter, SlidersHorizontal, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

export interface FilterState {
  category: string;
  city: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy: string;
  fuelType?: string;
  transmission?: string;
  minYear?: string;
  maxYear?: string;
}

export interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onReset?: () => void;
  className?: string;
}

const CATEGORIES = [
  { id: "all", label: "All Vehicles" },
  { id: "cars", label: "Cars" },
  { id: "bikes", label: "Bikes & Scooters" },
  { id: "cycles", label: "Bicycles" },
];

const CITIES = [
  { value: "all", label: "All India" },
  { value: "Chennai", label: "Chennai" },
  { value: "Bengaluru", label: "Bengaluru" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Delhi NCR", label: "Delhi NCR" },
  { value: "Pune", label: "Pune" },
  { value: "Coimbatore", label: "Coimbatore" },
  { value: "Kochi", label: "Kochi" },
];

const FUEL_TYPES = [
  { value: "all", label: "All Fuel Types" },
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric (EV)" },
  { value: "cng", label: "CNG" },
  { value: "hybrid", label: "Hybrid" },
];

const TRANSMISSIONS = [
  { value: "all", label: "All Transmissions" },
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  className = "",
}) => {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(filters);

  const handleCategorySelect = (catId: string) => {
    onFilterChange({ ...filters, category: catId });
  };

  const handleApplyMobileFilters = () => {
    onFilterChange(draftFilters);
    setIsMobileSheetOpen(false);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile Trigger Button */}
      <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setDraftFilters(filters);
            setIsMobileSheetOpen(true);
          }}
          leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          className="shrink-0 rounded-xl"
        >
          Filters
        </Button>

        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
              filters.category === cat.id
                ? "bg-ink-900 text-paper shadow-xs"
                : "bg-surface border border-border text-ink-700 hover:border-ink-500"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Mobile Filter Modal */}
      <Modal
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        title="Filter Search Results"
        asBottomSheetOnMobile
        footer={
          <div className="flex items-center justify-between w-full">
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onReset();
                  setIsMobileSheetOpen(false);
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={handleApplyMobileFilters}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-ink-900 uppercase tracking-wider block mb-2">
              Vehicle Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setDraftFilters({ ...draftFilters, category: cat.id })}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                    draftFilters.category === cat.id
                      ? "bg-accent-500/20 border-accent-500 text-ink-900"
                      : "bg-surface border-border text-ink-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <Select
            label="Location"
            value={draftFilters.city || "all"}
            options={CITIES}
            onChange={(e) => setDraftFilters({ ...draftFilters, city: e.target.value === "all" ? "" : e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min Price (₹)"
              type="number"
              placeholder="e.g. 50000"
              value={draftFilters.minPrice || ""}
              onChange={(e) => setDraftFilters({ ...draftFilters, minPrice: e.target.value })}
            />
            <Input
              label="Max Price (₹)"
              type="number"
              placeholder="e.g. 1000000"
              value={draftFilters.maxPrice || ""}
              onChange={(e) => setDraftFilters({ ...draftFilters, maxPrice: e.target.value })}
            />
          </div>

          {draftFilters.category !== "cycles" && (
            <>
              <Select
                label="Fuel Type"
                value={draftFilters.fuelType || "all"}
                options={FUEL_TYPES}
                onChange={(e) => setDraftFilters({ ...draftFilters, fuelType: e.target.value })}
              />
              <Select
                label="Transmission"
                value={draftFilters.transmission || "all"}
                options={TRANSMISSIONS}
                onChange={(e) => setDraftFilters({ ...draftFilters, transmission: e.target.value })}
              />
            </>
          )}
        </div>
      </Modal>

      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block bg-paper rounded-2xl border border-border p-5 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h4 className="font-heading font-bold text-sm text-ink-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-accent-500" />
            <span>Filters</span>
          </h4>
          {onReset && (
            <button
              onClick={onReset}
              className="text-xs text-ink-500 hover:text-ink-900 transition-colors flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Category List */}
        <div>
          <label className="text-[11px] font-bold text-ink-500 uppercase tracking-wider block mb-2">
            Vehicle Class
          </label>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onFilterChange({ ...filters, category: cat.id })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filters.category === cat.id
                    ? "bg-accent-500 text-ink-900 shadow-2xs"
                    : "text-ink-700 hover:bg-surface"
                }`}
              >
                <span>{cat.label}</span>
                {filters.category === cat.id && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Location Filter */}
        <Select
          label="City / Region"
          value={filters.city || "all"}
          options={CITIES}
          onChange={(e) => onFilterChange({ ...filters, city: e.target.value === "all" ? "" : e.target.value })}
        />

        {/* Budget Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-ink-500 uppercase tracking-wider block">
            Budget (₹)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Min ₹"
              type="number"
              value={filters.minPrice || ""}
              onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
            />
            <Input
              placeholder="Max ₹"
              type="number"
              value={filters.maxPrice || ""}
              onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
            />
          </div>
        </div>

        {/* Fuel & Transmission (Cars & Bikes) */}
        {filters.category !== "cycles" && (
          <>
            <Select
              label="Fuel Type"
              value={filters.fuelType || "all"}
              options={FUEL_TYPES}
              onChange={(e) => onFilterChange({ ...filters, fuelType: e.target.value })}
            />
            <Select
              label="Transmission"
              value={filters.transmission || "all"}
              options={TRANSMISSIONS}
              onChange={(e) => onFilterChange({ ...filters, transmission: e.target.value })}
            />
          </>
        )}
      </div>
    </div>
  );
};
