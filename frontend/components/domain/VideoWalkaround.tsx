"use client";

import React from "react";
import { Video, ExternalLink, Play } from "lucide-react";

interface VideoWalkaroundProps {
  videoLink?: string;
}

export function VideoWalkaround({ videoLink }: VideoWalkaroundProps) {
  if (!videoLink) return null;

  // Extract YouTube ID or Vimeo ID
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
        const videoId = url.includes("youtu.be/")
          ? url.split("youtu.be/")[1].split("?")[0]
          : new URL(url).searchParams.get("v");
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (url.includes("vimeo.com/")) {
        const vimeoId = url.split("vimeo.com/")[1].split("?")[0];
        return `https://player.vimeo.com/video/${vimeoId}`;
      }
    } catch {
      return null;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(videoLink);

  return (
    <div className="bg-paper border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent-100 text-accent-600">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-ink-900">
              Video Walkaround & Exhaust Sound
            </h3>
            <p className="text-xs text-ink-500">Live vehicle inspection recording</p>
          </div>
        </div>

        <a
          href={videoLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
        >
          <span>Open Source</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-border">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Vehicle Walkaround Video"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-paper p-4 text-center">
            <Play className="w-12 h-12 text-accent-500 mb-2" />
            <p className="text-xs text-ink-300">Direct Video link provided</p>
            <a
              href={videoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs font-semibold text-accent-400 underline"
            >
              Watch Walkaround on External Player
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
