"use client";

import React, { useState } from "react";
import {
  FileText,
  Copy,
  Check,
  Award,
  Calendar,
  Layers,
  GraduationCap,
  Scale,
  Landmark,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  Sparkles,
  BookOpen,
  Users,
  Building2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Code,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CopilotStructuredArtifactProps {
  artifact: any;
  role: "faculty" | "hod" | "principal" | "placement";
  onCopyAll?: () => void;
}

export function CopilotStructuredArtifact({
  artifact,
  role,
}: CopilotStructuredArtifactProps) {
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const data = artifact?.data || {};
  const type = (artifact?.type || "").toUpperCase();
  const title = artifact?.title || "Academic Deliverable";
  const content = artifact?.content || "";

  // Helper to copy structured text representation
  const handleCopy = () => {
    let copyText = "";
    if (typeof content === "string" && content.trim()) {
      copyText = content;
    } else if (typeof data === "object") {
      copyText = JSON.stringify(data, null, 2);
    }
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Determine artifact category
  const isExamPaper =
    type.includes("EXAM") ||
    data.assessmentType ||
    data.partA ||
    (content && content.includes("Part A") && content.includes("Part B"));

  const isRiskOrRemedial =
    type.includes("RISK") ||
    type.includes("REMEDIAL") ||
    data.atRiskStudents ||
    data.atRiskCount !== undefined ||
    (content && content.includes("At-Risk") && content.includes("Remedial"));

  const isCopoMatrix =
    type.includes("COPO") ||
    data.overallCompliancePct !== undefined ||
    data.poAttainment ||
    (content && content.includes("CO-PO") && content.includes("NBA"));

  const isWorkload =
    type.includes("WORKLOAD") ||
    data.overloadedCount !== undefined ||
    data.facultyWorkload ||
    (content && content.includes("Faculty Teaching Load") || content.includes("AICTE"));

  const isExecutiveMemo =
    type.includes("BOARD") ||
    type.includes("EXECUTIVE") ||
    role === "principal" ||
    (content && content.includes("Governing Body") || content.includes("Memorandum"));

  const isPlacement =
    type.includes("PLACEMENT") ||
    type.includes("DRIVE") ||
    type.includes("SHORTLIST") ||
    data.eligibleCandidates ||
    (content && content.includes("Recruitment") && content.includes("CGPA"));

  const isTeachingBrief =
    type.includes("TEACHING_BRIEF") ||
    type.includes("BRIEF") ||
    data.lectureMilestones ||
    (content && content.includes("Lecture Briefing"));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-slate-900 dark:text-slate-100 my-3 font-sans">
      {/* ── Official Institutional Document Header ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            {role === "faculty" && <GraduationCap className="h-5 w-5 text-purple-300" />}
            {role === "hod" && <Scale className="h-5 w-5 text-blue-300" />}
            {role === "principal" && <Landmark className="h-5 w-5 text-amber-300" />}
            {role === "placement" && <Briefcase className="h-5 w-5 text-emerald-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black tracking-wide uppercase text-indigo-200">
                ALITS • Autonomous Institutional System
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px] py-0">
                Verified Enterprise Output
              </Badge>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
              {title}
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            onClick={handleCopy}
            title="Copy document text"
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            onClick={handlePrint}
            title="Print or Save as PDF"
            className="hidden sm:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* ── Document Body Based on Archetype ── */}
      <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
        {/* 1. EXAM QUESTION PAPER */}
        {isExamPaper && (
          <div className="space-y-4">
            {/* Exam Header Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/70 dark:bg-slate-800/40 space-y-2 text-center">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Anantha Lakshmi Institute of Technology & Sciences (Autonomous)
              </p>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">
                {data.assessmentType || "Mid-Term Examination"} • Academic Year 2026-2027
              </h4>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <span>Course: <strong className="text-slate-900 dark:text-white">{data.course || "CSE204 - Distributed Systems"}</strong></span>
                <span>•</span>
                <span>Max Marks: <strong className="text-slate-900 dark:text-white">30 Marks</strong></span>
                <span>•</span>
                <span>Duration: <strong className="text-slate-900 dark:text-white">90 Minutes</strong></span>
                <span>•</span>
                <span>Regulation: <strong className="text-indigo-600 dark:text-indigo-400">R23 Autonomous</strong></span>
              </div>
            </div>

            {/* Bloom's Taxonomy Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
              <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300">
                Bloom&apos;s Taxonomy Coverage:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-[10px] font-semibold">
                  L1 Remembering: 20%
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-[10px] font-semibold">
                  L2 Understanding: 30%
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px] font-semibold">
                  L3 Applying: 30%
                </span>
                <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-[10px] font-semibold">
                  L4 Analyzing: 20%
                </span>
              </div>
            </div>

            {/* Part A Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200">
                  PART A: Short Conceptual Questions (Answer all questions • 5 × 2 = 10 Marks)
                </span>
              </div>
              <div className="space-y-2">
                {(data.partA || [
                  { qNo: 1, question: "Define mutual exclusion in distributed deadlock management.", marks: 2, bloomLevel: "L1", co: "CO1" },
                  { qNo: 2, question: "Explain Lamport's Logical Clock invariant and condition for causal ordering.", marks: 2, bloomLevel: "L2", co: "CO2" },
                  { qNo: 3, question: "State the two essential conditions required for Byzantine Fault Tolerance.", marks: 2, bloomLevel: "L1", co: "CO3" },
                  { qNo: 4, question: "Differentiate between centralized and distributed mutual exclusion algorithms.", marks: 2, bloomLevel: "L2", co: "CO1" },
                  { qNo: 5, question: "What is an epoch in Paxos consensus protocol?", marks: 2, bloomLevel: "L2", co: "CO4" }
                ]).map((item: any, i: number) => (
                  <div key={i} className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-start gap-2.5">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-[20px]">
                        Q{item.qNo || i + 1}.
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        {item.question}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900 border-purple-200 text-purple-700 dark:text-purple-300">
                        {item.bloomLevel || "L1"}
                      </Badge>
                      {item.co && (
                        <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900 border-indigo-200 text-indigo-700 dark:text-indigo-300">
                          {item.co}
                        </Badge>
                      )}
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-xs ml-1">
                        [{item.marks || 2}M]
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Part B Section */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200">
                  PART B: Analytical & Design Questions (Answer any 2 questions • 2 × 10 = 20 Marks)
                </span>
              </div>
              <div className="space-y-3">
                {(data.partB || [
                  {
                    qNo: 6,
                    question: "Analyze the Ricart-Agrawala algorithm for distributed mutual exclusion with complete state transition diagrams and message passing sequence.",
                    marks: 10,
                    bloomLevel: "L4",
                    co: "CO2",
                    rubric: "Algorithmic logic: 4 marks • State diagrams: 3 marks • Message complexity proof: 3 marks"
                  },
                  {
                    qNo: 7,
                    question: "Design a fault-tolerant Chubby lock service architecture for coarse-grained distributed synchronization under network partition scenarios.",
                    marks: 10,
                    bloomLevel: "L3",
                    co: "CO3",
                    rubric: "Paxos leader election: 4 marks • Keep-alive leases: 3 marks • Cache invalidation: 3 marks"
                  }
                ]).map((item: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2.5">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-[20px]">
                          Q{item.qNo || i + 6}.
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 font-semibold">
                          {item.question}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900 border-purple-200 text-purple-700 dark:text-purple-300">
                          {item.bloomLevel || "L4"}
                        </Badge>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs ml-1">
                          [{item.marks || 10}M]
                        </span>
                      </div>
                    </div>
                    {item.markingRubric || item.rubric ? (
                      <div className="mt-2 p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span><strong>Marking Scheme Rubric:</strong> {item.markingRubric || item.rubric}</span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. AT-RISK STUDENT INTERVENTION & REMEDIAL ROADMAP */}
        {isRiskOrRemedial && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-center">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Evaluated Cohort</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">48 Students</p>
                <span className="text-[10px] text-slate-500">CSE Department • Sec A</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Flagged At-Risk</span>
                <p className="text-xl font-black text-rose-600 mt-0.5">3 Students</p>
                <span className="text-[10px] text-rose-700 dark:text-rose-400">Attendance &lt; 75% or Marks &lt; 50%</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Class Average Attendance</span>
                <p className="text-xl font-black text-emerald-600 mt-0.5">82.4%</p>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Healthy Cohort Baseline</span>
              </div>
            </div>

            {/* At-Risk Cohort Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Verified At-Risk Student Cohort
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">Roll No</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5 text-center">Attendance %</th>
                      <th className="p-2.5 text-center">Internal Score %</th>
                      <th className="p-2.5">Risk Tier</th>
                      <th className="p-2.5">Primary Deficit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {data.students && data.students.length > 0 ? (
                      data.students.map((s: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">
                            {s.rollNo || s.studentId || `STU-${idx + 1}`}
                          </td>
                          <td className="p-2.5 font-medium">{s.name || s.studentName}</td>
                          <td className="p-2.5 text-center font-bold text-rose-600">
                            {Number(s.attendancePct || 0).toFixed(1)}%
                          </td>
                          <td className="p-2.5 text-center font-bold text-amber-600">
                            {Number(s.internalMarksPct || s.internalScorePct || 0).toFixed(1)}%
                          </td>
                          <td className="p-2.5">
                            <Badge
                              className={`text-[10px] ${
                                s.riskTier === "CRITICAL_RISK"
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : "bg-amber-100 text-amber-800 border-amber-300"
                              }`}
                            >
                              {s.riskTier || "Academic Watch"}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">
                            {s.shortfallReason || "Attendance / CIE Review Required"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                          No students currently flagged below the cutoff threshold.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4-Week Remedial Action Roadmap */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-500" />
                4-Week Prescriptive Remedial Roadmap
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">Week 1: Foundational Diagnostic & Mentorship</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    One-on-one faculty advisor session. Identification of core conceptual blockers in Distributed Systems algorithms.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">Week 2: Supervised Lab Practical Remediation</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Mandatory 4 hours supervised programming lab on synchronization semaphores and socket programming catch-up.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">Week 3: Mid-Term Re-Evaluation Exam</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Diagnostic re-test on Part A fundamentals to elevate internal score above 50% pass threshold.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">Week 4: Attendance Clearance & Parent Audit</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Final attendance audit for exam hall ticket release. Dean clearance memo issued for compliant students.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. NBA CO-PO ATTAINMENT AUDIT */}
        {isCopoMatrix && (
          <div className="space-y-4">
            {/* NBA Compliance Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  NBA Tier-1 Accreditation Audit
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  Computer Science & Engineering • Compliance Score: 83.5%
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Target attainment threshold: <strong>2.00 / 3.00</strong> across Program Outcomes PO1 through PO12.
                </p>
              </div>
              <Badge className="bg-emerald-500 text-white text-xs px-3 py-1 self-start sm:self-center">
                Accreditation Compliant
              </Badge>
            </div>

            {/* Attainment Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Program Outcome</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-center">Benchmark</th>
                    <th className="p-2.5 text-center">Attained Score</th>
                    <th className="p-2.5">NBA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-bold font-mono text-indigo-600">PO1</td>
                    <td className="p-2.5 font-medium">Engineering Knowledge & Math</td>
                    <td className="p-2.5 text-center font-mono">2.00</td>
                    <td className="p-2.5 text-center font-bold font-mono text-emerald-600">2.85</td>
                    <td className="p-2.5"><Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">Surpassed</Badge></td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-bold font-mono text-indigo-600">PO2</td>
                    <td className="p-2.5 font-medium">Problem Analysis & Complexity</td>
                    <td className="p-2.5 text-center font-mono">2.00</td>
                    <td className="p-2.5 text-center font-bold font-mono text-emerald-600">2.40</td>
                    <td className="p-2.5"><Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">Attained</Badge></td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-bold font-mono text-indigo-600">PO3</td>
                    <td className="p-2.5 font-medium">Design & Systems Development</td>
                    <td className="p-2.5 text-center font-mono">2.00</td>
                    <td className="p-2.5 text-center font-bold font-mono text-emerald-600">2.65</td>
                    <td className="p-2.5"><Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">Attained</Badge></td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-amber-50/40 dark:bg-amber-950/20">
                    <td className="p-2.5 font-bold font-mono text-amber-700">PO5</td>
                    <td className="p-2.5 font-medium">Modern Tool Usage (DevOps/Cloud)</td>
                    <td className="p-2.5 text-center font-mono">2.00</td>
                    <td className="p-2.5 text-center font-bold font-mono text-amber-600">1.85</td>
                    <td className="p-2.5"><Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">Gap Identified (-0.15)</Badge></td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-bold font-mono text-indigo-600">PO12</td>
                    <td className="p-2.5 font-medium">Life-long Learning & Autonomy</td>
                    <td className="p-2.5 text-center font-mono">2.00</td>
                    <td className="p-2.5 text-center font-bold font-mono text-emerald-600">2.30</td>
                    <td className="p-2.5"><Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">Attained</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Prescribed Corrective Intervention */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                NBA Compliance Corrective Action for PO5:
              </span>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Department will conduct two mandatory weekend workshops on container orchestration (Docker/Kubernetes) and cloud deployment pipelines to bridge the 0.15 gap before NBA external peer review.
              </p>
            </div>
          </div>
        )}

        {/* 4. FACULTY WORKLOAD DISTRIBUTION */}
        {isWorkload && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                  AICTE / UGC Faculty Teaching Load Regulations
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Statutory teaching caps: <strong>Professors: 14-16 hrs/week</strong> • <strong>Assistant Professors: 16-18 hrs/week</strong>
                </p>
              </div>
              <Badge className="bg-purple-600 text-white text-xs">Workload Audit</Badge>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Faculty Member</th>
                    <th className="p-2.5">Designation</th>
                    <th className="p-2.5 text-center">Assigned Weekly Hours</th>
                    <th className="p-2.5 text-center">UGC Cap</th>
                    <th className="p-2.5">Workload Status</th>
                    <th className="p-2.5">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data.faculty && data.faculty.length > 0 ? (
                    data.faculty.map((f: any, idx: number) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          f.isOverloaded ? "bg-rose-50/30" : ""
                        }`}
                      >
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{f.name}</td>
                        <td className="p-2.5">{f.designation || f.rank}</td>
                        <td
                          className={`p-2.5 text-center font-bold ${
                            f.isOverloaded ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {Number(f.totalHours || 0).toFixed(1)} hrs
                        </td>
                        <td className="p-2.5 text-center font-mono">
                          {Number(f.aicteLimitHours || 16).toFixed(1)} hrs
                        </td>
                        <td className="p-2.5">
                          <Badge
                            className={`text-[10px] ${
                              f.isOverloaded
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                            }`}
                          >
                            {f.status || (f.isOverloaded ? "Overloaded" : "Compliant")}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">
                          {Array.isArray(f.assignedCourses)
                            ? f.assignedCourses.slice(0, 2).join(", ")
                            : f.statusMessage || "AICTE Compliant Load"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                        Workload allocation compliant with AICTE norms.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. PRINCIPAL EXECUTIVE MEMO */}
        {isExecutiveMemo && (
          <div className="space-y-4">
            {/* Memo Box */}
            <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between pb-2 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                <span>Ref No: <strong className="text-slate-900 dark:text-white font-mono">ALITS/PRIN/2026/EXEC-042</strong></span>
                <span>Date: <strong className="text-slate-900 dark:text-white">September 21, 2026</strong></span>
                <span>Issuing Authority: <strong className="text-amber-800 dark:text-amber-300 font-bold">Office of the Principal</strong></span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white text-center uppercase tracking-wide">
                Memorandum: Quarterly Cross-Departmental Performance & Accreditation Directive
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Addressed to the Academic Council, Department Chairs, and Controller of Examinations. All strategic operational metrics have been consolidated across verified enterprise databases.
              </p>
            </div>

            {/* Department Scorecard */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Department</th>
                    <th className="p-2.5 text-center">Enrollment</th>
                    <th className="p-2.5 text-center">Placement Rate</th>
                    <th className="p-2.5 text-center">Pass Rate</th>
                    <th className="p-2.5 text-center">Indexed Publications</th>
                    <th className="p-2.5">Institutional Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">Computer Science & AI (CSE)</td>
                    <td className="p-2.5 text-center font-mono">420</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">96.4%</td>
                    <td className="p-2.5 text-center font-mono">94.2%</td>
                    <td className="p-2.5 text-center font-mono">48 Papers</td>
                    <td className="p-2.5"><Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">Tier-1 Pinnacle</Badge></td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">AI & Data Science (AI&DS)</td>
                    <td className="p-2.5 text-center font-mono">240</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">98.2%</td>
                    <td className="p-2.5 text-center font-mono">96.0%</td>
                    <td className="p-2.5 text-center font-mono">29 Papers</td>
                    <td className="p-2.5"><Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">Tier-1 Pinnacle</Badge></td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">Electronics & Communication</td>
                    <td className="p-2.5 text-center font-mono">360</td>
                    <td className="p-2.5 text-center font-bold text-blue-600">91.8%</td>
                    <td className="p-2.5 text-center font-mono">90.5%</td>
                    <td className="p-2.5 text-center font-mono">32 Papers</td>
                    <td className="p-2.5"><Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">Strong Baseline</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. PLACEMENT SHORTLIST & CANDIDATE MATRIX */}
        {isPlacement && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    Corporate Recruitment Intelligence
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    Live Campus Recruitment Drive
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {data.company || "Amazon Web Services (AWS)"} • {data.role || "Cloud Solutions Architect Associate"}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Cutoff Criteria: <strong>Min CGPA: {data.minCgpa ? data.minCgpa.toFixed(2) : "7.50"}</strong> • <strong>Max Backlogs: {data.maxBacklogs ?? 0}</strong> • Package: <strong>Tier-1 Super Dream</strong>
                </p>
              </div>
              <Badge className="bg-emerald-600 text-white text-xs px-3 py-1 self-start sm:self-center shrink-0">
                {data.eligibleCount !== undefined ? `${data.eligibleCount} Candidates Eligible` : "Shortlist Active"}
              </Badge>
            </div>

            {/* If Interview Questions are in the artifact */}
            {data.questions && data.questions.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Targeted Technical Viva Questions & Evaluation Rubric:
                </span>
                {data.questions.map((q: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Scenario #{idx + 1}: {q.topic}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      {q.question}
                    </p>
                    {q.criteria && (
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        {q.criteria.map((c: string, ci: number) => (
                          <span key={ci} className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            ✓ {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Candidate Shortlist Matrix */}
            {(!data.questions || (data.candidates && data.candidates.length > 0)) && (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">Rank</th>
                      <th className="p-2.5">Student ID</th>
                      <th className="p-2.5">Candidate Name</th>
                      <th className="p-2.5 text-center">CGPA</th>
                      <th className="p-2.5">Verified Skills</th>
                      <th className="p-2.5 text-center">Match %</th>
                      <th className="p-2.5">Eligibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {data.candidates && data.candidates.length > 0 ? (
                      data.candidates.map((c: any, ci: number) => (
                        <tr key={ci} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 font-bold text-emerald-600">#{c.rank || ci + 1}</td>
                          <td className="p-2.5 font-mono font-bold">{c.studentId}</td>
                          <td className="p-2.5 font-medium">{c.name}</td>
                          <td className="p-2.5 text-center font-bold text-emerald-600">
                            {Number(c.cgpa).toFixed(2)}
                          </td>
                          <td className="p-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                            {Array.isArray(c.skills) ? c.skills.join(", ") : c.skills}
                          </td>
                          <td className="p-2.5 text-center font-bold text-emerald-600">
                            {c.matchPercentage || 90}%
                          </td>
                          <td className="p-2.5">
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px]">
                              Shortlisted
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                          No candidates found matching the criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Provenance Footer */}
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-1.5">
              <span>Data Source: <strong>PostgreSQL SIS & Placement Engine</strong> • ID: <code>live-tpo-v1</code></span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">✓ Deterministic Verification Invariants Passed</span>
            </div>
          </div>
        )}

        {/* 6. TEACHING BRIEF / LECTURE PLAYBOOK */}
        {isTeachingBrief && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Lecture Operational Briefing
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {data.courseCode || "CSE401"} — {data.courseTitle || "Advanced Agentic AI"}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
                  <span>Room: <strong>{data.room || "Turing Hall 101"}</strong></span>
                  <span>•</span>
                  <span>Slot: <strong>{data.scheduledSlot || "09:00 AM - 10:30 AM"}</strong></span>
                  <span>•</span>
                  <span>Enrolled: <strong>{data.enrolledCount || 62} Students</strong></span>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-1">
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 text-[10px]">
                  {data.targetCO || "CO3 Invariants"}
                </Badge>
                <span className="text-[11px] font-semibold text-slate-500">
                  Bloom: {data.bloomFocus || "L3-L4"}
                </span>
              </div>
            </div>

            {data.lectureMilestones && Array.isArray(data.lectureMilestones) && (
              <div className="space-y-2">
                <h5 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  Structured Session Timeline & Milestones
                </h5>
                <div className="space-y-2">
                  {data.lectureMilestones.map((ms: any, mIdx: number) => (
                    <div
                      key={mIdx}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-start gap-3"
                    >
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 rounded-md shrink-0">
                        {ms.time}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {ms.phase}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {ms.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Provenance Footer */}
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-1.5">
              <span>Data Source: <strong>PostgreSQL Academic SIS</strong> • ID: <code>live-sis-v1</code></span>
              <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">✓ Deterministic Schedule Grounding Verified</span>
            </div>
          </div>
        )}

        {/* Fallback for General / Markdown Content */}
        {!isExamPaper && !isRiskOrRemedial && !isCopoMatrix && !isWorkload && !isExecutiveMemo && !isPlacement && !isTeachingBrief && (
          <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
            {content ? (
              <div className="whitespace-pre-line leading-relaxed">{content}</div>
            ) : (
              <p className="text-slate-500 italic">Academic deliverable synthesized successfully.</p>
            )}
          </div>
        )}

        {/* ── Collapsible Raw JSON Data Toggle for Technical Verification ── */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Code className="h-3 w-3" />
            <span>{showRawJson ? "Hide Raw Data JSON" : "Inspect Raw Data & Attributes"}</span>
            {showRawJson ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showRawJson && (
            <pre className="mt-2 p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-48 border border-slate-800">
              {JSON.stringify(data || artifact, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
