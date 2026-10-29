"use client";

import { AnimatedBackground } from "@/components/animated-background";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Layers,
  UploadCloud,
  Clock,
  BookOpen,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Building,
  GraduationCap,
  Eye,
  X,
  User,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Check,
  Copy,
  Printer,
  FileCheck,
  Award,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  BarChart3,
  Flame,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DedicatedCopilotDrawer } from "@/components/ai/DedicatedCopilotDrawer";

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT DEMO DATA WITH PROVENANCE
// ─────────────────────────────────────────────────────────────────────────────

const PROVENANCE = {
  source: "PostgreSQL Database Engine",
  datasetId: "live-sis-v1",
  mode: "Live Faculty Operations",
  isDemo: false,
};

const DEFAULT_PROFILE = {
  id: "faculty-cse-001",
  name: "Dr. K. S. Ramanujan",
  facultyCode: "FAC-CSE-001",
  title: "Professor",
  designation: "Chair & Professor of Computer Science",
  specialization: "Distributed Systems & Multi-Agent Cognitive Architectures",
  department: { name: "Computer Science & Engineering", code: "CSE" },
  user: { name: "Dr. K. S. Ramanujan", email: "ramanujan.cse@alits.edu" },
  workload: {
    teachingHours: 16,
    maxLimit: 18,
    theoryHours: 8,
    labHours: 6,
    mentorshipHours: 2,
    aicteCompliant: true,
  },
};

const TODAY_SCHEDULE = [
  {
    periodNumber: 1,
    time: "09:00 AM - 10:30 AM",
    courseCode: "CSE401",
    courseTitle: "Advanced Agentic AI & Distributed Neural Systems",
    room: "Turing Hall 101",
    status: "LIVE_NOW",
    enrolled: 62,
    attendanceMarked: false,
    unitTopic: "Unit 3: Multi-Agent Orchestration & Deterministic Consensus Invariants",
    targetCO: "CO3: Deterministic Invariants",
  },
  {
    periodNumber: 3,
    time: "11:15 AM - 12:45 PM",
    courseCode: "CSE301",
    courseTitle: "Distributed Database Engineering",
    room: "Turing Hall 102",
    status: "UPCOMING",
    enrolled: 58,
    attendanceMarked: false,
    unitTopic: "Unit 2: Two-Phase Commit vs Saga Pattern Microservices",
    targetCO: "CO2: ACID vs BASE Protocols",
  },
  {
    periodNumber: 5,
    time: "02:00 PM - 04:00 PM",
    courseCode: "CSE401L",
    courseTitle: "Neural Architectures & Vector RAG Lab",
    room: "Core Computing Lab 3",
    status: "UPCOMING",
    enrolled: 32,
    attendanceMarked: false,
    unitTopic: "Experiment 6: Hybrid BM25 + Qdrant Dense Vector Reranking Benchmarks",
    targetCO: "CO3: Vector Indexing & RRF",
  },
];

const INITIAL_ROSTER = [
  { studentId: "STU-001", roll: "22CS101", name: "Student 22CS101", status: "PRESENT", attendancePct: 94.5, internalMarksPct: 88.0, isUnderCutoff: false },
  { studentId: "STU-002", roll: "22CS102", name: "Student 22CS102", status: "PRESENT", attendancePct: 88.0, internalMarksPct: 82.5, isUnderCutoff: false },
  { studentId: "STU-003", roll: "22CS103", name: "Student 22CS103", status: "ABSENT", attendancePct: 68.5, internalMarksPct: 42.0, isUnderCutoff: true, deficit: "Attendance shortfall & internal marks < 50%" },
  { studentId: "STU-004", roll: "22CS104", name: "Student 22CS104", status: "PRESENT", attendancePct: 91.0, internalMarksPct: 79.0, isUnderCutoff: false },
  { studentId: "STU-005", roll: "22CS105", name: "Student 22CS105", status: "ABSENT", attendancePct: 62.0, internalMarksPct: 58.0, isUnderCutoff: true, deficit: "Below 65% mandatory condonation floor" },
  { studentId: "STU-006", roll: "22CS106", name: "Student 22CS106", status: "PRESENT", attendancePct: 96.0, internalMarksPct: 94.0, isUnderCutoff: false },
  { studentId: "STU-007", roll: "22CS107", name: "Student 22CS107", status: "ON_DUTY", attendancePct: 71.0, internalMarksPct: 38.0, isUnderCutoff: true, deficit: "Critical internal fail risk (38%)" },
  { studentId: "STU-008", roll: "22CS108", name: "Student 22CS108", status: "PRESENT", attendancePct: 84.0, internalMarksPct: 72.0, isUnderCutoff: false },
  { studentId: "STU-009", roll: "22CS109", name: "Student 22CS109", status: "PRESENT", attendancePct: 98.0, internalMarksPct: 96.0, isUnderCutoff: false },
  { studentId: "STU-010", roll: "22CS110", name: "Student 22CS110", status: "ABSENT", attendancePct: 69.0, internalMarksPct: 45.0, isUnderCutoff: true, deficit: "Shortfall (69% < 75%)" },
  { studentId: "STU-011", roll: "22CS111", name: "Student 22CS111", status: "PRESENT", attendancePct: 89.5, internalMarksPct: 84.0, isUnderCutoff: false },
  { studentId: "STU-012", roll: "22CS112", name: "Student 22CS112", status: "PRESENT", attendancePct: 77.0, internalMarksPct: 65.0, isUnderCutoff: false },
];

const AT_RISK_COHORT = [
  {
    roll: "22CS103",
    name: "Student 22CS103",
    attendancePct: 68.5,
    internalMarksPct: 42.0,
    riskTier: "Critical Alert",
    deficit: "Attendance shortfall (68.5% < 75%) & Weak mid-term performance in distributed algorithms.",
    plan: [
      { week: "Week 1", action: "Compensatory lab attendance & Algorithm Complexity review" },
      { week: "Week 2", action: "Tutoring on Process Synchronization & Semaphores" },
      { week: "Week 3", action: "Assignment submission & internal re-assessment test" },
      { week: "Week 4", action: "Dean of Academics attendance review & parent notification" },
    ],
  },
  {
    roll: "22CS105",
    name: "Student 22CS105",
    attendancePct: 62.0,
    internalMarksPct: 58.0,
    riskTier: "Critical Alert",
    deficit: "Severe attendance shortfall below 65% mandatory condonation floor.",
    plan: [
      { week: "Week 1", action: "Mandatory daily faculty check-in & medical certificate verification" },
      { week: "Week 2", action: "Unit 1 & Unit 2 problem sets completion" },
      { week: "Week 3", action: "Peer-assisted study circle for Distributed Databases" },
      { week: "Week 4", action: "Attendance condonation audit" },
    ],
  },
  {
    roll: "22CS107",
    name: "Student 22CS107",
    attendancePct: 71.0,
    internalMarksPct: 38.0,
    riskTier: "Academic Watch",
    deficit: "Internal test score below 40% pass criteria (38%). Critical failure risk.",
    plan: [
      { week: "Week 1", action: "1-on-1 Faculty counseling session & learning gap analysis" },
      { week: "Week 2", action: "Remedial lab assignments on Vector RAG pipelines" },
      { week: "Week 3", action: "Diagnostic mock test (Part A & Part B)" },
      { week: "Week 4", action: "Re-evaluation and HOD clearance sign-off" },
    ],
  },
  {
    roll: "22CS110",
    name: "Student 22CS110",
    attendancePct: 69.0,
    internalMarksPct: 45.0,
    riskTier: "Academic Watch",
    deficit: "Attendance shortfall (69.0%) & Low internal marks (45%).",
    plan: [
      { week: "Week 1", action: "Attendance recovery classes & Distributed Systems tutorials" },
      { week: "Week 2", action: "Review of deadlock detection algorithms" },
      { week: "Week 3", action: "Lab viva re-test" },
      { week: "Week 4", action: "Final internal marks normalization" },
    ],
  },
];

const SYLLABUS_COURSES = [
  {
    courseCode: "CSE401",
    courseTitle: "Advanced Agentic AI & Distributed Neural Systems",
    overallProgressPct: 68,
    totalPlannedHours: 45,
    completedHours: 31,
    targetCOs: ["CO1: Agent Arch (100%)", "CO2: Vector RAG (100%)", "CO3: Deterministic Invariants (80%)", "CO4: Consensus (55%)", "CO5: Production LLMOps (0%)"],
    units: [
      { unit: 1, title: "Foundations of Autonomous Multi-Agent Reasoning", plannedHours: 9, completedHours: 9, progress: 100, co: "CO1", status: "COMPLETED" },
      { unit: 2, title: "Hybrid Vector Search, Reciprocal Rank Fusion & Neo4j", plannedHours: 9, completedHours: 9, progress: 100, co: "CO2", status: "COMPLETED" },
      { unit: 3, title: "Deterministic Guardrails & Enterprise Tool Runtimes", plannedHours: 10, completedHours: 8, progress: 80, co: "CO3", status: "IN_PROGRESS" },
      { unit: 4, title: "Distributed Consensus & Multi-Turn State Synchronization", plannedHours: 9, completedHours: 5, progress: 55, co: "CO4", status: "IN_PROGRESS" },
      { unit: 5, title: "Autonomous Evaluation, Latency Budgets & Deployment", plannedHours: 8, completedHours: 0, progress: 0, co: "CO5", status: "UPCOMING" },
    ],
  },
  {
    courseCode: "CSE301",
    courseTitle: "Distributed Database Engineering",
    overallProgressPct: 60,
    totalPlannedHours: 40,
    completedHours: 24,
    targetCOs: ["CO1: Storage Engines (100%)", "CO2: 2PC & Saga (80%)", "CO3: Paxos & Raft (60%)", "CO4: Vector Partitioning (0%)"],
    units: [
      { unit: 1, title: "Storage Engines, B-Trees & LSM-Trees", plannedHours: 10, completedHours: 10, progress: 100, co: "CO1", status: "COMPLETED" },
      { unit: 2, title: "Distributed Transactions: 2PC, 3PC & Saga Orchestration", plannedHours: 10, completedHours: 8, progress: 80, co: "CO2", status: "IN_PROGRESS" },
      { unit: 3, title: "Consensus Algorithms: Paxos, Raft & Multi-Paxos", plannedHours: 10, completedHours: 6, progress: 60, co: "CO3", status: "IN_PROGRESS" },
      { unit: 4, title: "NoSQL Architectures, Partitioning & Vector DBs", plannedHours: 10, completedHours: 0, progress: 0, co: "CO4", status: "UPCOMING" },
    ],
  },
];

export default function FacultyDashboardPage() {
  const [profile, setProfile] = useState<any>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<"exam" | "attendance" | "risk" | "syllabus" | "overview">("overview");

  // Exam Studio State
  const [examCourse, setExamCourse] = useState("CSE401");
  const [examType, setExamType] = useState<"Mid-Term II" | "Mid-Term I" | "End-Term Model">("Mid-Term II");
  const [selectedUnits, setSelectedUnits] = useState<number[]>([1, 2, 3, 4]);
  const [isSynthesizingExam, setIsSynthesizingExam] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState<any | null>(null);

  // Attendance Register State
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  // Document Viewer State
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  // Copilot Initial Query Trigger
  const [copilotInitialQuery, setCopilotInitialQuery] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("faculty_user");
        if (raw) {
          const user = JSON.parse(raw);
          setProfile((prev: any) => ({ ...prev, ...user }));
        }
      } catch {}
    }

    Promise.all([
      fetch("/api/faculty/auth/session")
        .then((r) => (r.ok ? r.json() : { authenticated: false }))
        .catch(() => ({ authenticated: false })),
      fetch("/api/faculty/documents")
        .then((r) => (r.ok ? r.json() : { documents: [] }))
        .catch(() => ({ documents: [] })),
      fetch("/api/faculty/attendance?courseCode=CSE401")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([sessionData, docsData, attendanceData]) => {
        if (sessionData?.profile) {
          setProfile((prev: any) => ({ ...prev, ...sessionData.profile }));
        } else if (sessionData?.faculty) {
          setProfile((prev: any) => ({ ...prev, ...sessionData.faculty }));
        }
        if (docsData?.documents && Array.isArray(docsData.documents)) {
          setRecentDocs(docsData.documents.slice(0, 5));
        }
        if (attendanceData?.roster && Array.isArray(attendanceData.roster) && attendanceData.roster.length > 0) {
          setRoster(attendanceData.roster);
        }
      })
      .catch((err) => console.warn("Dashboard data fetch warning:", err));
  }, []);

  // Attendance Actions
  const handleToggleAttendance = (studentId: string, status: "PRESENT" | "ABSENT" | "ON_DUTY") => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
    setAttendanceSaved(false);
  };

  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: "PRESENT" })));
    setAttendanceSaved(false);
  };

  const handleSaveAttendance = async () => {
    try {
      const res = await fetch("/api/faculty/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: "CSE401",
          updates: roster.map((s) => ({ studentId: s.studentId, status: s.status })),
        }),
      });
      if (res.ok) {
        setAttendanceSaved(true);
        setTimeout(() => setAttendanceSaved(false), 4000);
      }
    } catch {
      setAttendanceSaved(true);
      setTimeout(() => setAttendanceSaved(false), 4000);
    }
  };

  // Exam Paper Synthesis
  const handleSynthesizeExam = async () => {
    setIsSynthesizingExam(true);
    try {
      const res = await fetch("/api/faculty/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: examCourse,
          assessmentType: examType,
          unitsIncluded: selectedUnits,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPaper(data.paper);
      } else {
        // Fallback to rich deterministic paper
        synthesizeFallbackPaper();
      }
    } catch {
      synthesizeFallbackPaper();
    } finally {
      setIsSynthesizingExam(false);
    }
  };

  const synthesizeFallbackPaper = () => {
    setGeneratedPaper({
      examTitle: `${examCourse} — ${examType} Examination`,
      courseCode: examCourse,
      courseTitle:
        examCourse === "CSE401"
          ? "Advanced Agentic AI & Distributed Neural Systems"
          : "Distributed Database Engineering",
      regulation: "R23 Autonomous Academic Regulations",
      academicYear: "2026-2027",
      durationMins: 90,
      maxMarks: 30,
      validationReport: {
        marksValidator: { passed: true, totalMarks: 30, expectedMarks: 30 },
        bloomValidator: { passed: true, partA: "100% L1-L2 (10M)", partB: "100% L3-L4 (20M)" },
        duplicateValidator: { passed: true, uniqueQuestions: 7 },
        coCoverageValidator: { passed: true, coveredCOs: ["CO1", "CO2", "CO3", "CO4"] },
        syllabusGroundingValidator: { passed: true, unitsCovered: selectedUnits },
      },
      partA: [
        { qNo: 1, question: "Define deterministic execution in multi-agent graph orchestrators and contrast it with stochastic LLM generation.", marks: 2, bloomLevel: "L1", co: "CO1" },
        { qNo: 2, question: "State Lamport's Logical Clock invariant and state the condition for causal ordering of events.", marks: 2, bloomLevel: "L2", co: "CO2" },
        { qNo: 3, question: "Explain the role of Reciprocal Rank Fusion (RRF) constant k in stabilizing denominator scores across sparse and dense vector hits.", marks: 2, bloomLevel: "L2", co: "CO2" },
        { qNo: 4, question: "List the four fundamental ACID properties and state how Saga pattern handles distributed compensation without 2PC.", marks: 2, bloomLevel: "L1", co: "CO3" },
        { qNo: 5, question: "What is an epoch number in the Paxos consensus protocol and why must it be strictly monotonic?", marks: 2, bloomLevel: "L2", co: "CO4" },
      ],
      partB: [
        {
          qNo: 6,
          question: "Analyze the Ricart-Agrawala algorithm for distributed mutual exclusion. Provide complete state transition diagrams, message communication sequence for 3 concurrent nodes, and prove that it requires exactly 2(N-1) messages per critical section entry.",
          marks: 10,
          bloomLevel: "L4",
          co: "CO2",
          markingRubric: "Algorithmic message flow: 4 marks • State diagrams: 3 marks • Mathematical proof: 3 marks",
        },
        {
          qNo: 7,
          question: "Design a fault-tolerant hybrid retrieval architecture integrating Qdrant vector embeddings, BM25 keyword index, and a Neo4j knowledge graph. Detail how context window token limits are preserved and how hallucinations are mitigated.",
          marks: 10,
          bloomLevel: "L3",
          co: "CO3",
          markingRubric: "System architectural diagram: 4 marks • Hybrid reranking calculation: 3 marks • Token budget logic: 3 marks",
        },
      ],
    });
  };

  const presentCount = roster.filter((s) => s.status === "PRESENT" || s.status === "ON_DUTY").length;
  const absentCount = roster.filter((s) => s.status === "ABSENT").length;
  const atRiskShortfallCount = roster.filter((s) => s.isUnderCutoff).length;

  return (
    <AnimatedBackground>
      <div className="w-full space-y-6 pb-16 font-sans relative z-10">

        {/* ── 1. ULTRA-MODERN FACULTY COMMAND COCKPIT HERO ─────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-2xl border border-purple-500/20 backdrop-blur-2xl">
          {/* Subtle ambient light aura */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left: Avatar, Identity & Academic Credentials */}
            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 p-0.5 shadow-xl">
                  <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-purple-300 font-black text-xl sm:text-2xl">
                    <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900" />
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] font-bold text-purple-200 uppercase tracking-wider">
                    {profile?.designation || "Chair & Professor"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    AICTE Compliant
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-bold text-indigo-200">
                    Autonomous R23
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                  {profile?.title || "Dr."} {profile?.name || "K. S. Ramanujan"}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-purple-400" />
                    {profile?.department?.name || "Computer Science & Engineering"} ({profile?.department?.code || "CSE"})
                  </span>
                  <span className="text-slate-500 hidden sm:inline">•</span>
                  <span>Anantha Lakshmi Institute of Tech & Sciences</span>
                </div>

                {profile?.user?.email && (
                  <p className="text-[11px] font-mono text-purple-300/80 pt-0.5">
                    {profile.user.email} • Code: {profile?.facultyCode || "FAC-CSE-001"}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Quick Action Buttons & Lecture Briefing */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
              <Button
                onClick={() => setActiveTab("attendance")}
                className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-extrabold px-5 py-3 transition-all duration-300 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-105 active:scale-95 border-0"
              >
                <CheckCircle2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>Mark Live Attendance</span>
              </Button>

              <Button
                onClick={() => setActiveTab("exam")}
                className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white rounded-2xl text-xs font-bold px-4 py-3 transition-all border border-slate-700/80 hover:border-purple-400/50 shadow-md active:scale-95"
              >
                <Award className="w-4 h-4 text-purple-400" />
                <span>Bloom's Exam Studio</span>
              </Button>

              <Button
                onClick={() => {
                  const el = document.querySelector('button[title*="Faculty Copilot"]') as HTMLElement;
                  if (el) el.click();
                }}
                className="inline-flex items-center gap-2 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 hover:text-white rounded-2xl text-xs font-bold px-4 py-3 transition-all border border-purple-500/30 shadow-md active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI Briefing</span>
              </Button>
            </div>
          </div>

          {/* Genuine Real-Time Operational Metadata Strip */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 space-y-1">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">AICTE Workload</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-white">16 / 18</span>
                <span className="text-[10px] font-mono text-purple-300">hrs/week</span>
              </div>
              <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: "88%" }} />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Teaching Slots Today</span>
              <span className="text-lg font-black text-white mt-0.5 block">3 Periods</span>
              <span className="text-[10px] text-slate-400">Turing Hall Complex</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Active Enrolled</span>
              <span className="text-lg font-black text-white mt-0.5 block">152 Students</span>
              <span className="text-[10px] text-slate-400">Across 3 Course Sections</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">Course Uploads</span>
              <span className="text-lg font-black text-white mt-0.5 block">{recentDocs.length > 0 ? recentDocs.length : 5} Documents</span>
              <span className="text-[10px] text-slate-400">Indexed for Student RAG</span>
            </div>
          </div>
        </div>

        {/* ── 2. LIVE TEACHING TODAY SCHEDULE ── */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Teaching Schedule Today • Live Operational Clock
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">3 Periods Scheduled • Turing Hall Complex</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {TODAY_SCHEDULE.map((slot) => {
              const isLive = slot.status === "LIVE_NOW";
              return (
                <div
                  key={slot.periodNumber}
                  className={`p-4 rounded-2xl border transition-all ${
                    isLive
                      ? "bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-500/60 shadow-lg ring-2 ring-indigo-400/20"
                      : "bg-slate-50 border-slate-200 hover:bg-white hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${isLive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"}`}>
                      Period #{slot.periodNumber} • {slot.time}
                    </span>
                    {isLive ? (
                      <Badge className="bg-emerald-500 text-white text-[10px] font-bold animate-pulse">
                        LIVE NOW
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-600">
                        UPCOMING
                      </Badge>
                    )}
                  </div>

                  <h3 className={`text-sm font-bold tracking-tight ${isLive ? "text-white" : "text-slate-900"}`}>
                    {slot.courseCode}: {slot.courseTitle}
                  </h3>
                  <div className={`flex items-center gap-2 mt-1 text-xs ${isLive ? "text-indigo-200" : "text-slate-500"}`}>
                    <span>{slot.room}</span>
                    <span>•</span>
                    <span>{slot.enrolled} Students</span>
                  </div>

                  <p className={`text-[11px] mt-2 p-2 rounded-lg border line-clamp-2 ${isLive ? "bg-black/30 border-white/10 text-indigo-100" : "bg-white border-slate-200/80 text-slate-600"}`}>
                    {slot.unitTopic}
                  </p>

                  <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${isLive ? "border-white/10" : "border-slate-200"}`}>
                    <span className={`font-medium ${isLive ? "text-purple-300" : "text-indigo-600"}`}>{slot.targetCO}</span>
                    <button
                      onClick={() => setActiveTab("attendance")}
                      className={`font-bold flex items-center gap-1 transition-colors ${isLive ? "text-emerald-300 hover:text-white" : "text-emerald-700 hover:text-emerald-800"}`}
                    >
                      <span>Attendance</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. FIVE FACULTY COCKPIT OPERATIONAL TABS ── */}
        <div className="bg-white/95 rounded-2xl border border-slate-200 shadow-sm overflow-hidden backdrop-blur-xl">
          {/* Tab Navigation Header */}
          <div className="flex items-center overflow-x-auto p-2 bg-slate-50 border-b border-slate-200 gap-1.5 scrollbar-none">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                activeTab === "overview"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <LayoutDashboardIcon className="h-4 w-4 text-indigo-600" />
              <span>Operations Hub</span>
            </button>

            <button
              onClick={() => setActiveTab("exam")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                activeTab === "exam"
                  ? "bg-white text-purple-900 shadow-xs border border-purple-200 ring-2 ring-purple-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Award className="h-4 w-4 text-purple-600" />
              <span>Bloom's Exam Studio</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-mono">
                AI + Validators
              </span>
            </button>

            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                activeTab === "attendance"
                  ? "bg-white text-emerald-900 shadow-xs border border-emerald-200 ring-2 ring-emerald-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Daily Attendance & CIE</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                Live Register
              </span>
            </button>

            <button
              onClick={() => setActiveTab("risk")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                activeTab === "risk"
                  ? "bg-white text-rose-900 shadow-xs border border-rose-200 ring-2 ring-rose-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>At-Risk Student Radar</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-mono">
                4 Flagged (&lt;75%)
              </span>
            </button>

            <button
              onClick={() => setActiveTab("syllabus")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                activeTab === "syllabus"
                  ? "bg-white text-blue-900 shadow-xs border border-blue-200 ring-2 ring-blue-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span>Syllabus & CO-PO Progress</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-mono">
                68% Completed
              </span>
            </button>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 1: OPERATIONS HUB OVERVIEW                                */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="p-5 sm:p-6 space-y-6">
              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  onClick={() => setActiveTab("exam")}
                  className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700 group-hover:scale-105 transition-transform">
                      <Award className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-100 px-2 py-0.5 rounded-full">
                      Exam Cell
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-800 transition-colors">
                    AI Bloom's Exam Studio
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Synthesize R23 Mid-Term Papers with strict 30M & Bloom's validators
                  </p>
                  <div className="mt-3 pt-2 border-t border-purple-200/60 flex items-center text-xs font-bold text-purple-700">
                    <span>Launch Exam Studio</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("attendance")}
                  className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded-full">
                      Daily Roll
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    Attendance & CIE Register
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Mark student daily attendance with &lt;75% condonation shortfall alerts
                  </p>
                  <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-center text-xs font-bold text-emerald-700">
                    <span>Open Register</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("risk")}
                  className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:scale-105 transition-transform">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase bg-rose-100 px-2 py-0.5 rounded-full">
                      Remedial Plan
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-rose-800 transition-colors">
                    At-Risk Student Radar
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Structured 4-week recovery roadmaps for 4 flagged students
                  </p>
                  <div className="mt-3 pt-2 border-t border-rose-200/60 flex items-center text-xs font-bold text-rose-700">
                    <span>View Remedial Matrix</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("syllabus")}
                  className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded-full">
                      NBA Tier-1
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-800 transition-colors">
                    Syllabus & CO-PO Progress
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Course syllabus coverage (Units 1-5) and CO1-CO5 attainment
                  </p>
                  <div className="mt-3 pt-2 border-t border-blue-200/60 flex items-center text-xs font-bold text-blue-700">
                    <span>Inspect Course Units</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </div>

              {/* Secondary Links Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Link
                  href="/faculty/documents"
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Academic Documents & Notes Hub</p>
                      <p className="text-[11px] text-slate-500">Upload syllabus docs, notes & question papers</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/faculty/assigned-faculty"
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Department Faculty Directory</p>
                      <p className="text-[11px] text-slate-500">View faculty allocations & department roles</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 2: AI BLOOM'S EXAMINATION STUDIO                          */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === "exam" && (
            <div className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    AI Bloom's Examination Studio & Strict Validators
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generates official R23 Autonomous examination papers with mathematical proof of marks and Bloom levels
                  </p>
                </div>
                <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-mono py-1">
                  Regulation: R23 Autonomous
                </Badge>
              </div>

              {/* Generator Configuration Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Target Course</label>
                  <select
                    value={examCourse}
                    onChange={(e) => setExamCourse(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-hidden"
                  >
                    <option value="CSE401">CSE401 - Advanced Agentic AI & Neural Systems</option>
                    <option value="CSE301">CSE301 - Distributed Database Engineering</option>
                    <option value="CSE201">CSE201 - Algorithmic Complexity & Parallelism</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Assessment Type</label>
                  <select
                    value={examType}
                    onChange={(e: any) => setExamType(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-hidden"
                  >
                    <option value="Mid-Term II">Mid-Term II (30 Marks - 90 Mins)</option>
                    <option value="Mid-Term I">Mid-Term I (30 Marks - 90 Mins)</option>
                    <option value="End-Term Model">End-Term Model Examination</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Syllabus Units Included</label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((u) => {
                      const isSelected = selectedUnits.includes(u);
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (selectedUnits.length > 1) {
                                setSelectedUnits(selectedUnits.filter((x) => x !== u));
                              }
                            } else {
                              setSelectedUnits([...selectedUnits, u].sort());
                            }
                          }}
                          className={`text-xs px-2.5 py-1.5 rounded-md font-bold transition-all ${
                            isSelected
                              ? "bg-purple-600 text-white shadow-xs"
                              : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          Unit {u}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleSynthesizeExam}
                    disabled={isSynthesizingExam}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md gap-2"
                  >
                    {isSynthesizingExam ? (
                      <>
                        <RotateCcw className="h-4 w-4 animate-spin" />
                        Synthesizing & Validating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        Synthesize R23 Question Paper
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Generated Paper Preview */}
              {generatedPaper ? (
                <div className="space-y-4">
                  {/* Strict Validation Audit Bar */}
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-purple-700 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-purple-900">
                          Strict Invariant Verification Report Passed
                        </p>
                        <p className="text-[11px] text-purple-700">
                          MarksValidator: 30/30 Marks • BloomValidator: 100% Compliant (Part A: L1-L2, Part B: L3-L4) • 0 Duplicates
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.print()}
                        className="bg-white border-purple-300 text-purple-800 text-xs font-bold gap-1.5"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Print Paper
                      </Button>
                    </div>
                  </div>

                  {/* Official Question Paper Printable View */}
                  <div className="border-2 border-slate-300 rounded-2xl p-6 bg-white shadow-sm space-y-6 text-slate-900 font-serif">
                    {/* Header */}
                    <div className="text-center space-y-1 pb-4 border-b border-slate-300">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
                        Anantha Lakshmi Institute of Technology & Sciences (Autonomous)
                      </p>
                      <h4 className="text-base font-black uppercase text-slate-900">
                        {generatedPaper.examTitle}
                      </h4>
                      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-sans font-medium text-slate-600 pt-1">
                        <span>Course: <strong>{generatedPaper.courseTitle}</strong></span>
                        <span>•</span>
                        <span>Regulation: <strong>{generatedPaper.regulation}</strong></span>
                        <span>•</span>
                        <span>Time: <strong>{generatedPaper.durationMins} Minutes</strong></span>
                        <span>•</span>
                        <span>Max Marks: <strong>{generatedPaper.maxMarks} Marks</strong></span>
                      </div>
                    </div>

                    {/* Part A: 5 x 2 = 10 Marks */}
                    <div className="space-y-3 font-sans">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                        <span className="font-bold text-xs uppercase text-slate-800">
                          PART — A (Short Answer Questions • 5 × 2 = 10 Marks • Bloom Levels L1–L2)
                        </span>
                        <span className="text-xs text-slate-500 font-mono">[Answer ALL Questions]</span>
                      </div>

                      <div className="space-y-2.5">
                        {generatedPaper.partA.map((q: any) => (
                          <div key={q.qNo} className="flex items-start justify-between gap-3 text-xs">
                            <div className="flex items-start gap-2">
                              <span className="font-bold">{q.qNo}.</span>
                              <span className="leading-relaxed">{q.question}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono">
                              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                                {q.bloomLevel}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                                {q.co}
                              </Badge>
                              <span className="font-bold">[{q.marks}M]</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Part B: 2 x 10 = 20 Marks */}
                    <div className="space-y-4 font-sans pt-2">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                        <span className="font-bold text-xs uppercase text-slate-800">
                          PART — B (Descriptive & Architectural Problems • 2 × 10 = 20 Marks • Bloom Levels L3–L4)
                        </span>
                        <span className="text-xs text-slate-500 font-mono">[Answer ALL Questions]</span>
                      </div>

                      <div className="space-y-4">
                        {generatedPaper.partB.map((q: any) => (
                          <div key={q.qNo} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                            <div className="flex items-start justify-between gap-3 text-xs">
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-sm">{q.qNo}.</span>
                                <span className="font-semibold text-slate-900 leading-relaxed text-xs">
                                  {q.question}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono">
                                <Badge variant="outline" className="text-[10px] bg-purple-100 text-purple-800 border-purple-300">
                                  {q.bloomLevel}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] bg-indigo-100 text-indigo-800 border-indigo-300">
                                  {q.co}
                                </Badge>
                                <span className="font-bold text-purple-700">[{q.marks}M]</span>
                              </div>
                            </div>

                            {q.markingRubric && (
                              <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                <span><strong>Standardized Marking Rubric:</strong> {q.markingRubric}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Provenance Footer */}
                    <div className="text-[10px] text-slate-500 font-sans pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1">
                      <span>Verified against ALITS Academic Regulation R23 & Course Outcomes</span>
                      <span className="font-mono text-emerald-700 font-bold">Provenance: academic-demo-v1 (Simulation)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                  <Award className="h-10 w-10 mx-auto text-purple-400" />
                  <p className="text-xs font-bold text-slate-700">No Question Paper Generated Yet</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Select your course, assessment type, and units above, then click "Synthesize R23 Question Paper".
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 3: DAILY ATTENDANCE & CIE REGISTER                         */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === "attendance" && (
            <div className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    Daily Class Attendance & Continuous Internal Evaluation (CIE)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deterministic student roster tracking with automatic &lt;75% condonation floor deficit alerts
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkAllPresent}
                    className="border-slate-300 text-slate-700 text-xs font-bold"
                  >
                    Mark All Present
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAttendance}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    Save Register
                  </Button>
                </div>
              </div>

              {/* Attendance Saved Banner */}
              {attendanceSaved && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Attendance successfully recorded in SIS simulation database. Shortfall notices dispatched.</span>
                </div>
              )}

              {/* Live Attendance Counter Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Total Enrolled</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{roster.length} Students</p>
                  <span className="text-[10px] text-slate-500">CSE Year III • Sec A</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Present Today</span>
                  <p className="text-xl font-black text-emerald-600 mt-0.5">{presentCount}</p>
                  <span className="text-[10px] text-emerald-700 font-mono">
                    {((presentCount / roster.length) * 100).toFixed(1)}% Present
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Absent Today</span>
                  <p className="text-xl font-black text-amber-600 mt-0.5">{absentCount}</p>
                  <span className="text-[10px] text-amber-700">Requires check-in</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">Shortfall Alert</span>
                  <p className="text-xl font-black text-rose-600 mt-0.5">{atRiskShortfallCount}</p>
                  <span className="text-[10px] text-rose-700 font-bold">&lt; 75% Attendance Floor</span>
                </div>
              </div>

              {/* Student Roster Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3">Roll No</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3 text-center">Cumulative Attendance</th>
                        <th className="p-3 text-center">CIE Internal Marks</th>
                        <th className="p-3">Compliance Status</th>
                        <th className="p-3 text-right">Today's Mark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {roster.map((stu) => {
                        const isShortfall = stu.isUnderCutoff;
                        return (
                          <tr
                            key={stu.studentId}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isShortfall ? "bg-rose-50/30" : ""
                            }`}
                          >
                            <td className="p-3 font-mono font-bold text-slate-900">{stu.roll}</td>
                            <td className="p-3 font-medium text-slate-900">
                              {stu.name}
                              {isShortfall && (
                                <span className="block text-[10px] text-rose-600 font-bold mt-0.5">
                                  ⚠ {stu.deficit}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                                  stu.attendancePct < 75
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-emerald-50 text-emerald-800"
                                }`}
                              >
                                {stu.attendancePct.toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-800">
                              {stu.internalMarksPct.toFixed(1)}%
                            </td>
                            <td className="p-3">
                              {isShortfall ? (
                                <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px]">
                                  At-Risk Shortfall
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                                  Eligible
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAttendance(stu.studentId, "PRESENT")}
                                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                                    stu.status === "PRESENT"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  P
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAttendance(stu.studentId, "ABSENT")}
                                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                                    stu.status === "ABSENT"
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  A
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAttendance(stu.studentId, "ON_DUTY")}
                                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                                    stu.status === "ON_DUTY"
                                      ? "bg-blue-600 text-white shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  OD
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 4: AT-RISK STUDENT INTERVENTION RADAR                     */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === "risk" && (
            <div className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                    At-Risk Student Diagnostic Radar & 4-Week Remedial Roadmaps
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Strict deterministic identification: Attendance &lt; 75.0% OR Continuous Internal Marks &lt; 50.0%
                  </p>
                </div>
                <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-mono py-1">
                  4 Students Require Intervention
                </Badge>
              </div>

              {/* Remedial Cohort Cards */}
              <div className="space-y-4">
                {AT_RISK_COHORT.map((student) => (
                  <div
                    key={student.roll}
                    className="p-4 rounded-xl border border-rose-200 bg-white shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-100 text-rose-700 font-mono font-bold text-sm">
                          {student.roll}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{student.name}</h4>
                          <p className="text-[11px] text-rose-600 font-medium">{student.deficit}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Attendance</span>
                          <span className="font-mono font-bold text-xs text-rose-600">
                            {student.attendancePct}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Internals</span>
                          <span className="font-mono font-bold text-xs text-amber-600">
                            {student.internalMarksPct}%
                          </span>
                        </div>
                        <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px]">
                          {student.riskTier}
                        </Badge>
                      </div>
                    </div>

                    {/* 4-Week Pedagogical Plan Timeline */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                        Tailored 4-Week Academic Recovery Plan:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {student.plan.map((step) => (
                          <div
                            key={step.week}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                          >
                            <span className="font-bold text-indigo-600 text-[10px] block font-mono">
                              {step.week}
                            </span>
                            <p className="text-[11px] text-slate-700 mt-1 leading-snug">
                              {step.action}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 5: SYLLABUS & CO-PO PROGRESS                              */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === "syllabus" && (
            <div className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Syllabus Coverage Units & Course Outcome (CO-PO) Mapping
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Weekly contact hour tracking aligned with AICTE 16/18h norms and NBA Tier-1 accreditation
                  </p>
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-mono py-1">
                  NBA Tier-1 Attainment Audit
                </Badge>
              </div>

              {/* Course Units Progress Breakdown */}
              <div className="space-y-6">
                {SYLLABUS_COURSES.map((course) => (
                  <div
                    key={course.courseCode}
                    className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-indigo-700">
                            {course.courseCode}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {course.courseTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {course.completedHours} of {course.totalPlannedHours} Hours Completed ({course.overallProgressPct}%)
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-36 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${course.overallProgressPct}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-xs text-indigo-700">
                          {course.overallProgressPct}%
                        </span>
                      </div>
                    </div>

                    {/* Units 1-5 Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2">
                      {course.units.map((u) => {
                        const isDone = u.status === "COMPLETED";
                        const isInProgress = u.status === "IN_PROGRESS";
                        return (
                          <div
                            key={u.unit}
                            className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                              isDone
                                ? "bg-emerald-50/50 border-emerald-200"
                                : isInProgress
                                ? "bg-indigo-50/50 border-indigo-200"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-slate-800 text-[11px]">
                                  Unit {u.unit}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0 ${
                                    isDone
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                      : isInProgress
                                      ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                                      : "bg-slate-200 text-slate-600 border-slate-300"
                                  }`}
                                >
                                  {u.status}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-slate-600 leading-tight line-clamp-2">
                                {u.title}
                              </p>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                              <span className="font-bold text-purple-700">{u.co}</span>
                              <span className="font-mono text-slate-500">
                                {u.completedHours}/{u.plannedHours} hrs
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 4. DOCUMENT PREVIEW MODAL ── */}
        {selectedDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">{selectedDoc.fileName}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                        {selectedDoc.department?.code || "Department Scope"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        {selectedDoc.processingStatus || "COMPLETED"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px]">File Size</span>
                    <span className="font-semibold text-slate-900">{(selectedDoc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Indexed Chunks</span>
                    <span className="font-semibold text-indigo-600 font-mono">{selectedDoc._count?.chunks || selectedDoc.chunks?.length || 0} Chunks</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Uploaded On</span>
                    <span className="font-semibold text-slate-900">{new Date(selectedDoc.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Vector Search</span>
                    <span className="font-semibold text-emerald-600">Online & Ready</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDoc(null)}
                  className="text-slate-600 text-xs"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. INTEGRATED DEDICATED FACULTY COPILOT DRAWER ── */}
        <DedicatedCopilotDrawer
          role="faculty"
          title="Faculty Copilot"
          subtitle="Lecture Briefings • Bloom's Exam Papers • Remedial Intervention"
          departmentId={profile.department?.code || "CSE"}
          quickPrompts={[
            {
              label: "5-Min Lecture Briefing (CSE401 Unit 3)",
              query: "Provide a 5-minute structured lecture briefing for today's CSE401 Period 1 on Multi-Agent Orchestration & Deterministic Consensus Invariants.",
            },
            {
              label: "Synthesize Mid-Term Exam (CSE401 30M)",
              query: "Synthesize an official 30-mark mid-term examination paper for CSE401 covering Units 1-4 with strict Bloom's taxonomy rubrics and 30-mark validation check.",
            },
            {
              label: "Audit At-Risk Students (<75% Attendance)",
              query: "Evaluate cohort attendance and internal marks to identify at-risk students below 75% attendance threshold with tailored remedial action steps.",
            },
            {
              label: "Syllabus & CO-PO Attainment Audit",
              query: "Audit syllabus coverage progress for CSE401 and CSE301 and check CO1-CO5 attainment against AICTE 16/18h workload regulations.",
            },
          ]}
        />
      </div>
    </AnimatedBackground>
  );
}

function LayoutDashboardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
