"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatedBackground } from "@/components/animated-background";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudentRecentUploadsWidget } from "@/components/student/StudentRecentUploadsWidget";
import {
  FileText, ChevronRight, ChevronDown, RefreshCw,
  GraduationCap, BookOpen, Download, Info, CheckCircle2,
  Sparkles, Clock, Play, Pause, RotateCcw, Bot, Briefcase,
  LayoutGrid, List, Copy, Check, Eye, ShieldCheck,
  Calendar, Building2, Flame, ArrowUpRight, Award, Compass
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface DocItem {
  id: string;
  fileName: string;
  courseCode?: string;
  visibility: string;
  departmentCode: string;
  departmentName: string;
  facultyAuthor?: string;
  facultyTitle?: string;
  fileSizeText?: string;
  processingStatus: string;
  createdAt: string;
}

interface DashboardData {
  stats: {
    totalDocs: number;
    authorizedDeptDocs?: number;
    totalConversations?: number;
  };
  academicContext?: {
    isStudent: boolean;
    isFaculty: boolean;
    role: string;
    studentNumber: string | null;
    major: string | null;
    gpa: number | null;
    academicStatus: string | null;
    enrolledCoursesCount: number;

    departmentId: string | null;
    departmentCode: string | null;
    departmentName: string | null;
    authorizedDocsCount: number;
    recentDepartmentDocs: DocItem[];
  };
  user: { email: string; name: string };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  return { text: "Good Evening", emoji: "🌙" };
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interactive UI States
  const [noticeCategory, setNoticeCategory] = useState<"all" | "academic" | "library">("all");
  const [copied, setCopied] = useState(false);

  // Interactive Study Focus Timer (Pomodoro Widget)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"pomodoro" | "shortBreak">("pomodoro");

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const toggleTimer = () => setIsTimerRunning((prev) => !prev);
  const resetTimer = (mode: "pomodoro" | "shortBreak" = timerMode) => {
    setIsTimerRunning(false);
    setTimerMode(mode);
    setTimerSeconds(mode === "pomodoro" ? 25 * 60 : 5 * 60);
  };

  const timerFormatted = useMemo(() => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [timerSeconds]);

  const timerProgress = useMemo(() => {
    const total = timerMode === "pomodoro" ? 25 * 60 : 5 * 60;
    return Math.round(((total - timerSeconds) / total) * 100);
  }, [timerSeconds, timerMode]);

  // Data loader
  const load = useCallback((isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    fetch("/api/dashboard/stats")
      .then(async (r) => {
        const contentType = r.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          window.location.href = "/login";
          return null;
        }
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${r.status}`);
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error("Dashboard load failed:", err);
        setError(err.message || "Failed to load dashboard data");
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const ac = data?.academicContext;
  const deptCode = ac?.departmentCode ?? "";
  const deptName = ac?.departmentName ?? "";
  const studentName = data?.user?.name ?? "";
  const studentEmail = data?.user?.email || "";
  const recentDocs = ac?.recentDepartmentDocs ?? [];
  const greeting = getGreeting();


  const copyEmail = () => {
    if (!studentEmail) return;
    navigator.clipboard.writeText(studentEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-600">
            AI
          </div>
        </div>
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">
          Loading Academic Intelligence...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-md text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <Info className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-rose-900 mb-1">Connection Interrupted</h2>
          <p className="text-xs text-slate-600 mb-5 leading-relaxed">{error}</p>
          <button
            onClick={() => load(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatedBackground>
      <div className="space-y-6 pb-16 font-sans max-w-7xl mx-auto px-2 sm:px-4">
        
        {/* ── 1. BREATHTAKING HERO CARD & STUDENT COCKPIT ──────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-2xl border border-indigo-500/20 backdrop-blur-2xl">
          {/* Subtle ambient light aura */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left: Avatar, Greeting, Identity & Badges */}
            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-xl">
                  <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-indigo-300 font-black text-xl sm:text-2xl">
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900" />
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1">
                    <span>{greeting.emoji}</span> {greeting.text},
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                    {deptCode} Academic Scholar
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Enrolled
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                  {studentName}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    {deptName}
                  </span>
                  <span className="text-slate-500 hidden sm:inline">•</span>
                  <span>Anantha Lakshmi Institute of Tech & Sciences</span>
                </div>

                {studentEmail && (
                  <button
                    onClick={copyEmail}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors pt-0.5"
                    title="Click to copy student email"
                  >
                    <span>{studentEmail}</span>
                    {copied ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Right: Quick Action Buttons & Refresh */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
              <Link
                href="/documents"
                className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold px-5 py-3 transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105 active:scale-95"
              >
                <BookOpen className="w-4 h-4 transition-transform group-hover:rotate-6" />
                <span>Browse Notes & Search</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/chat"
                className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white rounded-2xl text-xs font-bold px-4 py-3 transition-all border border-slate-700/80 hover:border-indigo-400/50 shadow-md active:scale-95"
              >
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>AI Copilot</span>
              </Link>

              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="p-3 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl transition-all shadow-md active:scale-90"
                title="Refresh real-time data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* Genuine Real-Time Department Metadata Strip */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Department Files</span>
              <span className="text-lg font-black text-white mt-0.5 block">{data?.academicContext?.authorizedDocsCount || recentDocs.length} Materials</span>
              <span className="text-[10px] text-slate-400">Published by {deptCode} faculty</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Academic Scope</span>
              <span className="text-lg font-black text-white mt-0.5 block">{deptCode}</span>
              <span className="text-[10px] text-slate-400">Direct course clearance</span>
            </div>
          </div>
        </div>

        {/* ── 2. INTERACTIVE STUDY UTILITIES & ACADEMIC INFORMATION ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Interactive Notice Board & Guidelines */}
          <div className="lg:col-span-2 bg-white/95 rounded-3xl p-6 border border-slate-200/90 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Student Notices & Academic Information
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Verified guidelines and circulars for {deptName} scholars.
                  </p>
                </div>
              </div>

              {/* Interactive Category Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                {(["all", "academic", "library"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNoticeCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      noticeCategory === cat
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Notice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(noticeCategory === "all" || noticeCategory === "academic") && (
                <div className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/20 border border-slate-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                      AI Guidance
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Interactive Copilot</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Ask AI with Document Grounding
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    NexusIQ provides verified answers strictly cited from your textbooks, lecture slides, and curriculum documents. Click &quot;Ask AI&quot; on any note to begin.
                  </p>
                </div>
              )}

              {(noticeCategory === "all" || noticeCategory === "library") && (
                <div className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/20 border border-slate-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      Materials
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">1-Click PDF</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Instant Faculty Notes & Syllabi
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    All official PDFs, question banks, and lecture slides uploaded by professors are accessible below with direct 1-click downloads.
                  </p>
                </div>
              )}

              {(noticeCategory === "all" || noticeCategory === "academic") && (
                <div className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/20 border border-slate-200 hover:border-purple-300 transition-all duration-300 hover:shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                      Repository
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Course Clearance</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    Verified Department Resources
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Course sections, lab instructions, and unit handouts are automatically verified with faculty attribution and authorized department access.
                  </p>
                </div>
              )}

              {(noticeCategory === "all" || noticeCategory === "academic") && (
                <div className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/20 border border-slate-200 hover:border-amber-300 transition-all duration-300 hover:shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
                      Search Tip
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Browse Notes</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                    Intelligent Document Search
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    To search across documents by topic or abbreviation (e.g. DBMS, OS, IP), head to <strong>Browse Notes</strong> for real-time concept matching.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Interactive Study Focus Timer (Pomodoro Widget) */}
          <div className="bg-white/95 rounded-3xl p-6 border border-slate-200/90 shadow-sm backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Study Focus Timer
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                  <button
                    onClick={() => resetTimer("pomodoro")}
                    className={`px-2 py-0.5 rounded-lg transition-all ${
                      timerMode === "pomodoro" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    25m
                  </button>
                  <button
                    onClick={() => resetTimer("shortBreak")}
                    className={`px-2 py-0.5 rounded-lg transition-all ${
                      timerMode === "shortBreak" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    5m
                  </button>
                </div>
              </div>

              {/* Animated Progress Display */}
              <div className="relative my-6 flex flex-col items-center justify-center">
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-mono">
                  {timerFormatted}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {timerMode === "pomodoro" ? "Active Study Interval" : "Short Break Time"}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-1000 rounded-full"
                    style={{ width: `${timerProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={toggleTimer}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white transition-all shadow-md active:scale-95 ${
                  isTimerRunning
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause Session
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Start Focus
                  </>
                )}
              </button>
              <button
                onClick={() => resetTimer(timerMode)}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. WORLD-CLASS RECENT ACADEMIC UPLOADS (PHASE 3, 4, 5) ──────── */}
        <StudentRecentUploadsWidget />

        {/* ── 4. QUICK ACADEMIC SHORTCUTS ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/documents"
            className="group p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Notes & Syllabus Repo
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Full-text search, acronym matching, and subject filtration.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600">
              <span>Open Repository</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/chat"
            className="group p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                AI Academic Copilot
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Instant Q&A grounded directly in university course material.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-600">
              <span>Launch Chat</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/knowledge-bases"
            className="group p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Knowledge Repositories
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Department knowledge collections and course syllabi folders.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>View Repositories</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

      </div>
    </AnimatedBackground>
  );
}
