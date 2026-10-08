"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, Eye, CreditCard, FileText } from "lucide-react";

export function SafetyBox() {
  const tips = [
    {
      title: "Inspect in Person & Daytime",
      desc: "Always meet the seller in a public, well-lit place to inspect vehicle chassis and engine.",
      icon: Eye,
    },
    {
      title: "Verify Original RC & Service Records",
      desc: "Match the chassis/engine number on the vehicle with the original RC smart card.",
      icon: FileText,
    },
    {
      title: "Never Transfer Advance Money",
      desc: "Do not send advance token money before physically checking the vehicle and RC validity.",
      icon: CreditCard,
    },
  ];

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 text-amber-900">
        <ShieldCheck className="w-5 h-5 text-accent-600 shrink-0" />
        <h4 className="font-heading font-bold text-sm text-ink-900">
          ListedWheels Safe Buyer Checklist
        </h4>
      </div>

      <div className="space-y-3">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div key={tip.title} className="flex items-start gap-3">
              <div className="p-1 rounded-lg bg-accent-500/10 text-accent-700 shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-ink-900 block">{tip.title}</span>
                <span className="text-ink-600 block mt-0.5 leading-relaxed">{tip.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
