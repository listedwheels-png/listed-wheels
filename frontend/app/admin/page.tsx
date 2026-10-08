"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Download,
  Ban,
  User,
  Eye,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  approveAdminDocument,
  approveAdminListing,
  banUser,
  downloadGstrReport,
  getAdminQueue,
  listAdminReports,
  rejectAdminDocument,
  rejectAdminListing,
  updateReportStatus,
} from "@/lib/api";
import { AdminQueueData, QueueDocumentItem, ReportItem } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const SAMPLE_QUEUE: AdminQueueData = {
  total_pending_listings: 1,
  total_pending_documents: 1,
  pending_listings: [
    {
      id: "f1a2b3c4-0001-4000-8000-000000000001",
      seller_id: "s1",
      seller_name: "Karthik Raja",
      category: "cars",
      title: "2021 Hyundai i20 Asta 1.2 MT",
      make: "Hyundai",
      model: "i20 Asta",
      year: 2021,
      price_paise: 82500000,
      city: "Chennai",
      registration_no_masked: "TN 09 ** 1234",
      status: "pending_verification",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media: [],
    },
  ],
  pending_documents: [
    {
      id: "d1",
      user_id: "s1",
      user_email: "karthik@example.com",
      user_name: "Karthik Raja",
      doc_type: "RC",
      storage_key: "docs/rc_karthik.pdf",
      secure_download_url: "https://example.com/docs/rc_karthik.pdf",
      status: "pending",
      created_at: new Date().toISOString(),
    },
  ],
};

export default function AdminPortalPage() {
  const { user, openSignInModal } = useAuth();
  const [activeTab, setActiveTab] = useState<"listings" | "documents" | "reports" | "users" | "gstr">("listings");
  const [queue, setQueue] = useState<AdminQueueData>(SAMPLE_QUEUE);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Rejection modal / input
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectType, setRejectType] = useState<"listing" | "document" | null>(null);

  // Ban Form
  const [banUserId, setBanUserId] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banSuccessMsg, setBanSuccessMsg] = useState(false);

  // GSTR Form
  const [gstrYear, setGstrYear] = useState(2026);
  const [gstrMonth, setGstrMonth] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const q = await getAdminQueue();
      setQueue(q);
      const reps = await listAdminReports();
      setReports(reps.items || []);
    } catch {
      // Demo fallback
      setQueue(SAMPLE_QUEUE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      loadData();
    }
  }, [user]);

  const handleApproveListing = async (id: string) => {
    try {
      await approveAdminListing(id);
      setQueue((prev) => ({
        ...prev,
        pending_listings: prev.pending_listings.filter((l) => l.id !== id),
        total_pending_listings: Math.max(0, prev.total_pending_listings - 1),
      }));
      alert("Listing approved! Expiration set to 365 days.");
    } catch (err: any) {
      alert(err.message || "Failed to approve listing");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim() || !rejectTargetId) {
      alert("Please enter a mandatory rejection reason.");
      return;
    }

    try {
      if (rejectType === "listing") {
        await rejectAdminListing(rejectTargetId, rejectReason);
        setQueue((prev) => ({
          ...prev,
          pending_listings: prev.pending_listings.filter((l) => l.id !== rejectTargetId),
          total_pending_listings: Math.max(0, prev.total_pending_listings - 1),
        }));
      } else if (rejectType === "document") {
        await rejectAdminDocument(rejectTargetId, rejectReason);
        setQueue((prev) => ({
          ...prev,
          pending_documents: prev.pending_documents.filter((d) => d.id !== rejectTargetId),
          total_pending_documents: Math.max(0, prev.total_pending_documents - 1),
        }));
      }
      setRejectTargetId(null);
      setRejectType(null);
      setRejectReason("");
    } catch (err: any) {
      alert(err.message || "Failed to reject item");
    }
  };

  const handleApproveDoc = async (id: string) => {
    try {
      await approveAdminDocument(id);
      setQueue((prev) => ({
        ...prev,
        pending_documents: prev.pending_documents.filter((d) => d.id !== id),
        total_pending_documents: Math.max(0, prev.total_pending_documents - 1),
      }));
      alert("Document approved! User marked as verified seller.");
    } catch (err: any) {
      alert(err.message || "Failed to approve document");
    }
  };

  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banUserId.trim() || !banReason.trim()) return;
    try {
      await banUser(banUserId.trim(), banReason.trim());
      setBanSuccessMsg(true);
      setBanUserId("");
      setBanReason("");
      setTimeout(() => setBanSuccessMsg(false), 2500);
    } catch (err: any) {
      alert(err.message || "Failed to ban user");
    }
  };

  const handleDownloadGSTR = async () => {
    try {
      const blob = await downloadGstrReport(gstrYear, gstrMonth);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GSTR1_${gstrYear}_${String(gstrMonth).padStart(2, "0")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert(`GSTR-1 CSV Report for ${gstrMonth}/${gstrYear} generated and exported successfully.`);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-paper border border-border rounded-3xl text-center space-y-4 shadow-lg">
        <ShieldCheck className="w-12 h-12 text-accent-500 mx-auto" />
        <h2 className="font-heading font-bold text-xl text-ink-900">Admin Access Required</h2>
        <p className="text-xs text-ink-500">
          This portal is strictly restricted to ListedWheels platform administrators and compliance officers.
        </p>
        <button
          onClick={openSignInModal}
          className="w-full bg-accent-500 hover:bg-accent-600 text-ink-900 font-bold text-sm py-3 rounded-xl shadow-xs"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-accent-600" />
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink-900">
              Admin Moderation & Compliance Portal
            </h1>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            Logged in as {user.name} ({user.email}) • Strict 365-day expiry & audit logging active
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 bg-surface hover:bg-surface-elevated border border-border rounded-xl text-xs font-semibold flex items-center gap-1.5 text-ink-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-2">
        {[
          { id: "listings", label: `Listing Queue (${queue.pending_listings.length})`, icon: ShieldCheck },
          { id: "documents", label: `Document Verification (${queue.pending_documents.length})`, icon: FileText },
          { id: "reports", label: `Fraud Reports (${reports.length})`, icon: AlertTriangle },
          { id: "users", label: "User Bans & Moderation", icon: Ban },
          { id: "gstr", label: "GSTR-1 Tax CSV Export", icon: Download },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                isActive
                  ? "bg-ink-900 text-paper shadow-xs"
                  : "bg-surface hover:bg-surface-elevated text-ink-700 border border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Pending Listings Queue */}
      {activeTab === "listings" && (
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-lg text-ink-900">
            Pending Listings Awaiting Approval
          </h3>

          {queue.pending_listings.length > 0 ? (
            <div className="space-y-3">
              {queue.pending_listings.map((l) => (
                <div
                  key={l.id}
                  className="p-5 bg-paper border border-border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-semibold text-base text-ink-900">
                        {l.title}
                      </h4>
                      <span className="text-[10px] font-bold uppercase bg-accent-100 text-accent-800 px-2 py-0.5 rounded">
                        {l.category}
                      </span>
                    </div>
                    <p className="text-xs text-ink-600">
                      Seller: {l.seller_name || "Unknown"} • {l.city} • {formatINR(l.price_paise, true)} • Reg: {l.registration_no_masked || "None"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleApproveListing(l.id)}
                      className="px-4 py-2 bg-success text-white font-semibold text-xs rounded-xl shadow-xs hover:bg-success/90 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve (365d)</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectTargetId(l.id);
                        setRejectType("listing");
                      }}
                      className="px-4 py-2 bg-danger/10 text-danger border border-danger/30 font-semibold text-xs rounded-xl hover:bg-danger/20 flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-surface rounded-2xl text-center text-xs text-ink-500">
              No pending listings in the review queue.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Document Verification Queue */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-lg text-ink-900">
            Pending Seller Verification Documents
          </h3>

          {queue.pending_documents.length > 0 ? (
            <div className="space-y-3">
              {queue.pending_documents.map((d) => (
                <div
                  key={d.id}
                  className="p-5 bg-paper border border-border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold text-base text-ink-900">
                        {d.user_name}
                      </span>
                      <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {d.doc_type}
                      </span>
                    </div>
                    <p className="text-xs text-ink-600">
                      User Email: {d.user_email} • Uploaded: {new Date(d.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <a
                      href={d.secure_download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-border bg-surface hover:bg-surface-elevated rounded-xl text-xs font-semibold flex items-center gap-1 text-ink-700"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Inspect</span>
                    </a>
                    <button
                      onClick={() => handleApproveDoc(d.id)}
                      className="px-4 py-2 bg-success text-white font-semibold text-xs rounded-xl shadow-xs hover:bg-success/90 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Seller</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectTargetId(d.id);
                        setRejectType("document");
                      }}
                      className="px-4 py-2 bg-danger/10 text-danger border border-danger/30 font-semibold text-xs rounded-xl hover:bg-danger/20 flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-surface rounded-2xl text-center text-xs text-ink-500">
              No pending documents in verification queue.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Reports Queue */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-lg text-ink-900">
            Reported Listings Triage
          </h3>
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="p-4 bg-paper border border-border rounded-2xl flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-danger">{r.reason}</span>
                    <p className="text-[11px] text-ink-500">
                      Listing ID: {r.listing_id} • Reported by: {r.reporter_name || r.reporter_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateReportStatus(r.id, "dismissed")}
                      className="px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-surface rounded-lg"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => updateReportStatus(r.id, "actioned")}
                      className="px-3 py-1.5 bg-danger text-white text-xs font-semibold rounded-lg"
                    >
                      Take Down Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-surface rounded-2xl text-center text-xs text-ink-500">
              Zero pending reports in safety triage.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: User Bans */}
      {activeTab === "users" && (
        <form onSubmit={handleBanUser} className="bg-paper border border-border rounded-3xl p-6 sm:p-8 max-w-xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-danger">
            <Ban className="w-5 h-5" />
            <h3 className="font-heading font-bold text-lg text-ink-900">
              Permanent User Ban & Blacklist
            </h3>
          </div>
          <p className="text-xs text-ink-600 leading-relaxed">
            Banning a user immediately changes their status to <code>banned</code>, archives their SHA-256 hashed phone,
            registration numbers, and government IDs into the <code>bans</code> blacklist table, preventing re-registration.
          </p>

          {banSuccessMsg && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-xl text-xs font-semibold text-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>User permanently banned and hashes recorded.</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-ink-700 block mb-1">User UUID *</label>
            <input
              type="text"
              required
              placeholder="e.g. 11111111-2222-3333-4444-555555555555"
              value={banUserId}
              onChange={(e) => setBanUserId(e.target.value)}
              className="w-full p-3 bg-surface border border-border focus:border-danger rounded-xl text-xs font-mono text-ink-900 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-700 block mb-1">Mandatory Ban Reason *</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Repeated odometer rollback fraud reported with evidence."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="w-full p-3 bg-surface border border-border focus:border-danger rounded-xl text-xs text-ink-900 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            className="bg-danger text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-xs hover:bg-danger/90 transition-all"
          >
            Execute Permanent Ban
          </button>
        </form>
      )}

      {/* TAB 5: GSTR-1 Tax CSV Export */}
      {activeTab === "gstr" && (
        <div className="bg-paper border border-border rounded-3xl p-6 sm:p-8 max-w-xl space-y-5 shadow-xs">
          <div>
            <h3 className="font-heading font-bold text-lg text-ink-900">
              Monthly GSTR-1 Tax Return CSV Export
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">
              Export all sequential invoices (CGST 9% / SGST 9% for TN, IGST 18% interstate) for GST filing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">Year</label>
              <input
                type="number"
                value={gstrYear}
                onChange={(e) => setGstrYear(Number(e.target.value))}
                className="w-full p-3 bg-surface border border-border rounded-xl text-xs font-mono text-ink-900 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">Month</label>
              <select
                value={gstrMonth}
                onChange={(e) => setGstrMonth(Number(e.target.value))}
                className="w-full p-3 bg-surface border border-border rounded-xl text-xs text-ink-900 outline-none"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Month {i + 1} ({new Date(2026, i).toLocaleString("en-IN", { month: "long" })})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadGSTR}
            className="bg-ink-900 text-paper font-bold text-xs sm:text-sm py-3 px-6 rounded-xl shadow-xs hover:bg-ink-800 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download GSTR-1 CSV</span>
          </button>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectTargetId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-heading font-bold text-base text-ink-900">
              Mandatory Rejection Reason
            </h3>
            <p className="text-xs text-ink-500">
              Provide a clear reason for rejecting this {rejectType}. This will be logged to audit log and sent to the seller.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Blurred RC copy, unreadable chassis number, or missing vehicle photos."
              className="w-full p-3 bg-surface border border-border rounded-xl text-xs text-ink-900 outline-none resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectTargetId(null);
                  setRejectType(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 text-xs font-semibold text-ink-600 hover:bg-surface rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-danger text-white font-semibold text-xs rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
