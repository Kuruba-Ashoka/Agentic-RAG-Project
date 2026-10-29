"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Download,
  Eye,
  Bot,
  GraduationCap,
  BookOpen,
  FlaskConical,
  FileQuestion,
  Bell,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  RefreshCw,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Filter,
  ShieldCheck,
  ExternalLink,
  Layers,
  Building2,
  Calendar,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RecentDocItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  processingStatus: string;
  visibility: string;
  departmentId: string | null;
  department?: {
    id: string;
    code: string;
    name: string;
  } | null;
  createdAt: string;
  uploadedBy: string | null;
  knowledgeBase?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    chunks: number;
  };
  category: {
    category: "LECTURE_NOTES" | "SYLLABUS" | "LAB_MANUAL" | "EXAM_PAPER" | "CIRCULAR" | "GENERAL_ACADEMIC";
    label: string;
    shortLabel: string;
    badgeClass: string;
    iconName: string;
    description: string;
  };
  relevance: {
    isRelevant: boolean;
    matchedCode?: string;
    matchedCourseName?: string;
  };
  faculty?: {
    id: string;
    name: string;
    title?: string | null;
    designation?: string | null;
    departmentCode?: string | null;
    departmentName?: string | null;
    email?: string | null;
    formattedAttribution: string;
  } | null;
  downloadUrl: string;
  previewUrl: string;
  askAiPrompt: string;
}

interface RecentUploadsApiResponse {
  success: boolean;
  timeframe: string;
  availableTimeframes: string[];
  stats: {
    today: number;
    thisWeek: number;
    enrolledRelevant: number;
    totalInTimeframe: number;
    categoryCounts: Record<string, number>;
  };
  student: {
    department: {
      id?: string;
      code: string;
      name: string;
    };
    enrolledCourses: Array<{
      id: string;
      code: string;
      title: string;
    }>;
  };
  documents: RecentDocItem[];
  error?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

const STORAGE_KEY_READ_DOCS = "nexusiq_student_read_documents";

export function StudentRecentUploadsWidget() {
  const router = useRouter();

  // API Data State
  const [data, setData] = useState<RecentUploadsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Layout States
  const [timeframe, setTimeframe] = useState<"today" | "48h" | "7d" | "30d" | "all">("7d");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [enrolledOnly, setEnrolledOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Phase 4: Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<RecentDocItem | null>(null);

  // Phase 5: Read State Persistence
  const [readDocIds, setReadDocIds] = useState<Set<string>>(new Set());

  // 1. Initialize Read-State from localStorage (UI-only read indicator)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_READ_DOCS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReadDocIds(new Set(parsed));
        }
      }
    } catch {
      // localStorage may fail in restricted privacy modes
    }
  }, []);

  const markAsRead = useCallback((docId: string) => {
    setReadDocIds((prev) => {
      if (prev.has(docId)) return prev;
      const next = new Set(prev);
      next.add(docId);
      try {
        localStorage.setItem(STORAGE_KEY_READ_DOCS, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    if (!data?.documents) return;
    setReadDocIds((prev) => {
      const next = new Set(prev);
      data.documents.forEach((d) => next.add(d.id));
      try {
        localStorage.setItem(STORAGE_KEY_READ_DOCS, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, [data]);

  // 2. Fetch Authoritative Recent Uploads from Dedicated Endpoint
  const fetchRecentUploads = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          timeframe,
          limit: "25",
        });

        const res = await fetch(`/api/student/recent-uploads?${queryParams.toString()}`);
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Failed with HTTP status ${res.status}`);
        }

        const json: RecentUploadsApiResponse = await res.json();
        if (!json.success && json.error) {
          throw new Error(json.error);
        }

        setData(json);
      } catch (err: any) {
        console.error("[StudentRecentUploadsWidget] Load failed:", err);
        setError(err.message || "Failed to load latest uploads");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeframe]
  );

  useEffect(() => {
    fetchRecentUploads();
  }, [fetchRecentUploads]);

  // 3. Computed Document List with Category and Enrolled Course Filters
  const visibleDocuments = useMemo(() => {
    if (!data?.documents) return [];

    let docs = data.documents;

    // Filter by Enrolled Courses Only
    if (enrolledOnly) {
      docs = docs.filter((d) => d.relevance.isRelevant);
    }

    // Filter by Category
    if (categoryFilter !== "ALL") {
      docs = docs.filter((d) => d.category.category === categoryFilter);
    }

    return docs;
  }, [data?.documents, enrolledOnly, categoryFilter]);

  // 4. Calculate Unread Count
  const unreadCount = useMemo(() => {
    if (!data?.documents) return 0;
    return data.documents.filter((d) => !readDocIds.has(d.id)).length;
  }, [data?.documents, readDocIds]);

  // Category Icon Renderer
  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "SYLLABUS":
        return <GraduationCap className="w-3.5 h-3.5" />;
      case "LAB_MANUAL":
        return <FlaskConical className="w-3.5 h-3.5" />;
      case "EXAM_PAPER":
        return <FileQuestion className="w-3.5 h-3.5" />;
      case "CIRCULAR":
        return <Bell className="w-3.5 h-3.5" />;
      case "LECTURE_NOTES":
        return <BookOpen className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  // Handle Document Preview & Interaction
  const handleOpenPreview = (doc: RecentDocItem) => {
    markAsRead(doc.id);
    setPreviewDoc(doc);
  };

  const handleAskAi = (doc: RecentDocItem) => {
    markAsRead(doc.id);
    const params = new URLSearchParams({
      query: doc.askAiPrompt,
      docId: doc.id,
      title: doc.fileName,
    });
    router.push(`/chat?${params.toString()}`);
  };

  return (
    <div className="bg-white/95 rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm backdrop-blur-xl space-y-6">
      
      {/* ── TOP HEADER ROW ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        
        {/* Title + Pulse Indicator + Department Badge */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Recent Academic Uploads
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Latest course syllabi, lecture notes, lab manuals, and notices published by faculty.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Refresh, Mark All Read, View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all active:scale-95"
              title="Mark all recent uploads as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mark all read</span>
            </button>
          )}

          <button
            onClick={() => fetchRecentUploads(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 transition-all active:scale-95"
            title="Refresh uploads"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          {/* View Switcher: Grid vs List */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "list" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Deep Search Jump */}
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            <span>Browse All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── FILTER & TIMEFRAME BAR ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl text-xs font-bold">
          {[
            { id: "ALL", label: "All", count: data?.stats?.totalInTimeframe ?? 0 },
            { id: "LECTURE_NOTES", label: "Notes", count: data?.stats?.categoryCounts?.LECTURE_NOTES ?? 0 },
            { id: "SYLLABUS", label: "Syllabus", count: data?.stats?.categoryCounts?.SYLLABUS ?? 0 },
            { id: "LAB_MANUAL", label: "Labs", count: data?.stats?.categoryCounts?.LAB_MANUAL ?? 0 },
            { id: "EXAM_PAPER", label: "Exams & PYQ", count: data?.stats?.categoryCounts?.EXAM_PAPER ?? 0 },
            { id: "CIRCULAR", label: "Circulars", count: data?.stats?.categoryCounts?.CIRCULAR ?? 0 },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                categoryFilter === cat.id
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{cat.label}</span>
              {cat.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    categoryFilter === cat.id
                      ? "bg-indigo-100 text-indigo-700 font-bold"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Timeframe Selector & Enrolled Courses Switch */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Enrolled Courses Only Filter Toggle */}
          <button
            onClick={() => setEnrolledOnly(!enrolledOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              enrolledOnly
                ? "bg-emerald-500/15 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>My Courses Only</span>
            {data?.stats?.enrolledRelevant ? (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[10px]">
                {data.stats.enrolledRelevant}
              </span>
            ) : null}
          </button>

          {/* Timeframe Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {[
              { id: "today", label: "Today" },
              { id: "48h", label: "48h" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "all", label: "All" },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  timeframe === tf.id
                    ? "bg-white text-indigo-700 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── ERROR STATE ─────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>Failed to load recent uploads: {error}</span>
          <button
            onClick={() => fetchRecentUploads(true)}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── LOADING SKELETON ────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-slate-100/70 border border-slate-200/60 animate-pulse p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="w-20 h-5 bg-slate-200 rounded-md" />
                  <div className="w-12 h-5 bg-slate-200 rounded-md" />
                </div>
                <div className="w-3/4 h-5 bg-slate-200 rounded-md" />
                <div className="w-1/2 h-4 bg-slate-200 rounded-md" />
              </div>
              <div className="w-full h-8 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : visibleDocuments.length === 0 ? (
        /* ── EMPTY STATE ─────────────────────────────────────────────────── */
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">No documents found in this timeframe</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {enrolledOnly
              ? "No uploads match your actively enrolled courses for this period. Try turning off 'My Courses Only' or selecting 'All' time."
              : "No academic materials have been uploaded in the selected filter window. Try selecting '30 Days' or 'All'."}
          </p>
          <button
            onClick={() => {
              setTimeframe("all");
              setCategoryFilter("ALL");
              setEnrolledOnly(false);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all"
          >
            Show All Repository Materials
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ── GRID VIEW ───────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleDocuments.map((doc) => {
            const isRead = readDocIds.has(doc.id);
            return (
              <div
                key={doc.id}
                className={`group relative bg-white rounded-2xl border p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${
                  isRead
                    ? "border-slate-200/90 hover:border-indigo-300"
                    : "border-indigo-200 ring-1 ring-indigo-500/20 bg-gradient-to-b from-indigo-50/20 to-white hover:border-indigo-400"
                }`}
              >
                <div>
                  {/* Top Badges Row: Category + Enrolled Relevance + Unread Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Category Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${doc.category.badgeClass}`}
                      >
                        {renderCategoryIcon(doc.category.category)}
                        <span>{doc.category.shortLabel}</span>
                      </span>

                      {/* Course Relevance Highlight */}
                      {doc.relevance.isRelevant && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-800 border border-emerald-300">
                          <GraduationCap className="w-3 h-3 text-emerald-700" />
                          <span>{doc.relevance.matchedCode || "Enrolled"}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" title="Unread" />
                      )}
                      <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(doc.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Document Title */}
                  <h3
                    className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug cursor-pointer"
                    title={doc.fileName}
                    onClick={() => handleOpenPreview(doc)}
                  >
                    {doc.fileName}
                  </h3>

                  {/* Faculty Attribution & Metadata */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-xs">
                    <p className="text-slate-600 truncate text-[11px] font-medium flex items-center gap-1.5">
                      <span className="text-slate-400">By:</span>
                      <strong className="text-slate-800 truncate">
                        {doc.faculty?.formattedAttribution || "Academic Faculty"}
                      </strong>
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{doc.department?.code || "INSTITUTIONAL"}</span>
                      <span>{formatBytes(doc.fileSize)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Bottom Bar: Preview, Ask AI, Download */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenPreview(doc)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 transition-colors py-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAskAi(doc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-all active:scale-95"
                      title="Discuss this document in AI Copilot"
                    >
                      <Bot className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Ask AI</span>
                    </button>

                    <a
                      href={doc.downloadUrl}
                      download={doc.fileName}
                      onClick={() => markAsRead(doc.id)}
                      title={`Download authorized copy of ${doc.fileName}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LIST VIEW ───────────────────────────────────────────────────── */
        <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
          {visibleDocuments.map((doc) => {
            const isRead = readDocIds.has(doc.id);
            return (
              <div
                key={doc.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isRead ? "hover:bg-slate-50/80" : "bg-indigo-50/15 hover:bg-indigo-50/30"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 cursor-pointer ${
                      isRead ? "bg-slate-100 text-slate-600" : "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
                    }`}
                    onClick={() => handleOpenPreview(doc)}
                  >
                    {renderCategoryIcon(doc.category.category)}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className="text-sm font-bold text-slate-900 truncate hover:text-indigo-600 cursor-pointer"
                        onClick={() => handleOpenPreview(doc)}
                      >
                        {doc.fileName}
                      </h3>

                      {/* Relevance Badge */}
                      {doc.relevance.isRelevant && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {doc.relevance.matchedCode || "Enrolled Course"}
                        </span>
                      )}

                      {!isRead && (
                        <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-extrabold uppercase">
                          New
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${doc.category.badgeClass}`}>
                        {doc.category.label}
                      </span>
                      <span>•</span>
                      <span className="truncate">
                        By <strong className="text-slate-800">{doc.faculty?.name || "Faculty"}</strong>
                        {doc.faculty?.designation ? ` (${doc.faculty.designation})` : ""}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">{formatBytes(doc.fileSize)}</span>
                      <span>•</span>
                      <span className="text-slate-500">{timeAgo(doc.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleOpenPreview(doc)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() => handleAskAi(doc)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask AI</span>
                  </button>

                  <a
                    href={doc.downloadUrl}
                    download={doc.fileName}
                    onClick={() => markAsRead(doc.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── INTERACTIVE PREVIEW MODAL (PHASE 4) ─────────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {renderCategoryIcon(previewDoc.category.category)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1" title={previewDoc.fileName}>
                    {previewDoc.fileName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${previewDoc.category.badgeClass}`}>
                      {previewDoc.category.label}
                    </span>
                    {previewDoc.relevance.isRelevant && (
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {previewDoc.relevance.matchedCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                title="Close preview"
              >
                ✕
              </button>
            </div>

            {/* Document Attributes Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Instructor / Author:</span>
                <span className="font-bold text-slate-900 text-right truncate max-w-[220px]">
                  {previewDoc.faculty?.formattedAttribution || "Academic Faculty"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Academic Department:</span>
                <span className="font-bold text-slate-900">
                  {previewDoc.department?.name || previewDoc.department?.code || "Institutional"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">File Size & Type:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatBytes(previewDoc.fileSize)} • {previewDoc.fileType.split("/").pop()?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Date Uploaded:</span>
                <span className="font-bold text-slate-900">
                  {new Date(previewDoc.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  ({timeAgo(previewDoc.createdAt)})
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">RAG Indexing Status:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Authorized & Grounded
                </span>
              </div>
            </div>

            {/* Category Description Banner */}
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-950 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Academic Purpose:</strong> {previewDoc.category.description}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => {
                  const doc = previewDoc;
                  setPreviewDoc(null);
                  handleAskAi(doc);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all active:scale-95"
              >
                <Bot className="w-4 h-4" />
                <span>Ask AI Copilot</span>
              </button>

              <a
                href={previewDoc.downloadUrl}
                download={previewDoc.fileName}
                onClick={() => markAsRead(previewDoc.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
