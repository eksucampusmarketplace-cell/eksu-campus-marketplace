"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  AlertTriangle,
  MapPin,
  Clock,
  Plus,
  Loader2,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SecurityReport } from "@/lib/types/database";

const severityColors = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const statusColors = {
  pending: "bg-gray-100 text-gray-700",
  investigating: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  dismissed: "bg-gray-100 text-gray-500",
};

const categoryLabels: Record<string, string> = {
  theft: "Theft",
  burglary: "Burglary",
  harassment: "Harassment",
  suspicious_activity: "Suspicious Activity",
  vandalism: "Vandalism",
  emergency: "Emergency",
  other: "Other",
};

export default function SecurityPage() {
  const [reports, setReports] = useState<SecurityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    const fetchReports = async () => {
      let query = supabase
        .from("security_reports")
        .select("*, reporter:profiles(*)")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("severity", filter);
      }

      const { data } = await query;
      setReports(data || []);
      setLoading(false);
    };

    fetchReports();

    const channel = supabase
      .channel("security-reports")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_reports" },
        (payload) => {
          setReports((prev) => [payload.new as SecurityReport, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, filter]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />
            Campus Safety
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Report and stay informed about security incidents on campus
          </p>
        </div>
        <Link
          href="/security/report"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Report Incident
        </Link>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Stay Alert, Stay Safe</p>
            <p className="text-xs text-amber-700 mt-1">
              If you witness a crime or emergency in progress, call campus security immediately
              at <strong>08012345678</strong>. Use this platform to report incidents and help
              keep our community safe.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["all", "critical", "high", "medium", "low"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === s
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "all" ? "All Reports" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-16 h-16 text-gray-200 mx-auto" />
          <p className="text-gray-500 mt-4 text-lg">No reports yet</p>
          <p className="text-gray-400 text-sm mt-1">The campus is looking safe!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[report.severity]}`}>
                      {report.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
                      {report.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {categoryLabels[report.category] || report.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {report.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {report.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    {!report.is_anonymous && report.reporter && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Reported by {report.reporter.full_name}
                      </span>
                    )}
                    {report.is_anonymous && (
                      <span className="text-gray-400 italic">Anonymous report</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
