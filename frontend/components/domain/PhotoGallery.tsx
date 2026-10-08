"use client";

import React, { useState } from "react";
import { MediaItem } from "@/lib/types";
import { ChevronLeft, ChevronRight, Maximize2, X, Image as ImageIcon } from "lucide-react";

interface PhotoGalleryProps {
  media: MediaItem[];
  title: string;
}

export function PhotoGallery({ media, title }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Fallback if no media
  const photos = media.length > 0 ? media : [
    {
      id: "placeholder",
      kind: "photo",
      storage_key: "",
      position: 0,
      url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    }
  ];

  const currentPhoto = photos[currentIndex];
  const photoUrl = currentPhoto.url || `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80`;

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3">
      {/* Main Image Viewport */}
      <div className="relative aspect-16/10 sm:aspect-16/9 w-full bg-surface rounded-2xl overflow-hidden border border-border group">
        <img
          src={photoUrl}
          alt={`${title} - photo ${currentIndex + 1}`}
          className="w-full h-full object-cover select-none"
        />

        {/* Navigation arrows (if > 1 photo) */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-paper/80 backdrop-blur-sm text-ink-900 shadow-md hover:bg-paper transition-all opacity-90 group-hover:opacity-100"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-paper/80 backdrop-blur-sm text-ink-900 shadow-md hover:bg-paper transition-all opacity-90 group-hover:opacity-100"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Zoom Button */}
        <button
          onClick={() => setIsZoomOpen(true)}
          className="absolute bottom-3 right-3 p-2 rounded-xl bg-paper/80 backdrop-blur-sm text-ink-900 shadow-md hover:bg-paper transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="hidden sm:inline">Zoom</span>
        </button>

        {/* Counter Badge */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-ink-900/75 backdrop-blur-sm text-paper text-xs font-medium tracking-wide">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Thumbnails Row */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {photos.map((photo, idx) => (
            <button
              key={photo.id || idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 transition-all ${
                currentIndex === idx ? "border-accent-500 ring-2 ring-accent-500/20" : "border-border opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={photo.url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80"}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center">
            <img
              src={photoUrl}
              alt=""
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />

            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <div className="text-white text-xs mt-3">
            {currentIndex + 1} of {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
