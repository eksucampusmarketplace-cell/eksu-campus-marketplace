"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Search as SearchIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { SecurityReport } from "@/lib/types/database";

const statusOptions = ["pending", "investigating", "resolved", "dismissed"] as const;

export default function AdminReportsPage() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<SecurityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase
        .from("security_reports")
        .select("*, reporter:profiles(*)")
        .order("created_at", { ascending: false });

      setReports(data || []);
      setLoading(false);
    };

    if (profile?.is_admin) fetchReports();
  }, [profile, supabase]);

  const updateStatus = async (reportId: string, status: string) => {
    await supabase
      .from("security_reports")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", reportId);

    setReports(reports.map((r) => (r.id === reportId ? { ...r, status: status as SecurityReport["status"] } : r)));
  };

  if (!profile?.is_admin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admin
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Security Reports</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <SearchIcon className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No security reports</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      report.severity === "critical"
                        ? "bg-red-100 text-red-700"
                        : report.severity === "high"
                        ? "bg-orange-100 text-orange-700"
                        : report.severity === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {report.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{report.category}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Location: {report.location} · {new Date(report.created_at).toLocaleString()}
                    {report.is_anonymous
                      ? " · Anonymous"
                      : report.reporter
                      ? ` · ${report.reporter.full_name}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <select
                    value={report.status}
                    onChange={(e) => updateStatus(report.id, e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                  {report.status === "resolved" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : report.status === "dismissed" ? (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
