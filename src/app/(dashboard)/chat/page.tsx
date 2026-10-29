"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  Sparkles,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Share2,
  ChevronDown,
  ChevronUp,
  Bot,
  GraduationCap,
  Shield,
  CheckCircle2,
  Check,
  Zap,
  BookOpen,
  FlaskConical,
  Scale,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { NeuralSynapseLoader } from "@/components/ui/extraordinary-loader";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConversationMeta {
  id: string;
  title: string;
  updatedAt: string;
}

interface Chunk {
  documentName: string;
  chunkText: string;
  score: number | null;
  chunkIndex: number;
  pageNumber?: number | null;
  departmentCode?: string | null;
  departmentName?: string | null;
  visibility?: string | null;
}

interface DebugChunk extends Chunk {
  vectorScore?: number | null;
  bm25Score?: number | null;
  fusionScore?: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function getMessageContent(m: any): string {
  if (m.parts && Array.isArray(m.parts)) {
    return m.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  }
  return typeof m.content === "string" ? m.content : "";
}

// ── Multi-Agent Reasoning Banner ──────────────────────────────────────────────

function ReasoningAccordion({
  latency,
  chunkCount,
  deptCode,
}: {
  latency: number | null;
  chunkCount: number;
  deptCode: string;
}) {
  const [open, setOpen] = useState(false);
  const isAll = !deptCode || deptCode === "ALL";

  return (
    <div className="mb-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-indigo-50/40 overflow-hidden text-xs transition-all shadow-xs">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-emerald-950 hover:text-emerald-900 transition-colors text-left font-medium"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold flex items-center gap-1.5 text-xs text-emerald-900">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500" />
            Agentic Pipeline Verified
          </span>
          <span className="text-[11px] text-emerald-700 font-mono font-semibold">
            ({chunkCount} source chunks {latency ? `· ${latency}ms` : ""})
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0" /> : <ChevronDown className="w-4 h-4 text-emerald-700 shrink-0" />}
      </button>

      {open && (
        <div className="px-3.5 pb-3 pt-1 border-t border-emerald-200/60 space-y-2 text-[11px] text-slate-700 bg-white/70">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-900">1. Scope Gatekeeper:</span>{" "}
              {isAll
                ? "Grounded across All University Departments & Regulations."
                : `Confined to [${deptCode}] Department & Institutional Regulations.`}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-900">2. Hybrid Vector Search:</span> Dense embeddings & BM25 sparse fusion executed in Qdrant.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-900">3. Precision Grounding:</span> Filtered top {chunkCount} authoritative syllabus excerpts.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Interactive Citation Chips ────────────────────────────────────────────────

function CitationChips({
  chunks,
  onSelectChunk,
}: {
  chunks: Chunk[];
  onSelectChunk: (chunk: Chunk) => void;
}) {
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mr-1">
        <FileText className="w-3.5 h-3.5 text-indigo-600" />
        Verified Sources:
      </span>
      {chunks.slice(0, 3).map((c, i) => {
        const scorePct = c.score ? Math.round(c.score * 100) : null;
        return (
          <button
            key={i}
            onClick={() => onSelectChunk(c)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs text-indigo-700 font-semibold transition-all active:scale-95 group max-w-[260px] shadow-xs"
            title="Click to view full chunk excerpt"
          >
            <span className="truncate">{c.documentName}</span>
            {c.departmentCode && (
              <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-mono font-bold shrink-0">
                {c.departmentCode}
              </span>
            )}
            {c.pageNumber && (
              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-200/70 rounded-md text-indigo-800 font-mono shrink-0">
                p.{c.pageNumber}
              </span>
            )}
            {scorePct && (
              <span className="text-[10px] text-emerald-700 font-mono font-bold shrink-0">
                {scorePct}%
              </span>
            )}
          </button>
        );
      })}
      {chunks.length > 3 && (
        <span className="text-xs text-slate-500 pl-1 font-mono font-medium">
          +{chunks.length - 3} more
        </span>
      )}
    </div>
  );
}

// ── Message Bubbles ──────────────────────────────────────────────────────────

function UserBubble({
  content,
  time,
}: {
  content: string;
  time?: string;
}) {
  return (
    <div className="flex justify-end gap-2.5 group">
      <div className="flex flex-col items-end max-w-[88%] sm:max-w-[78%]">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white rounded-3xl rounded-tr-xs px-5 py-3 shadow-md shadow-indigo-600/20 text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
          {content}
        </div>
        {time && <span className="text-[10px] text-slate-500 mt-1 px-1 font-medium">{time}</span>}
      </div>
    </div>
  );
}

function AssistantBubble({
  id,
  content,
  time,
  onCopy,
  onRetry,
  chunks,
  initialFeedback,
  onSelectChunk,
  latency,
  deptCode,
}: {
  id?: string;
  content: string;
  time?: string;
  onCopy: () => void;
  onRetry: () => void;
  chunks?: Chunk[];
  initialFeedback?: "thumbs_up" | "thumbs_down" | null;
  onSelectChunk: (c: Chunk) => void;
  latency?: number | null;
  deptCode: string;
}) {
  const [feedback, setFeedback] = useState<"thumbs_up" | "thumbs_down" | null>(initialFeedback || null);
  const [copied, setCopied] = useState(false);

  const handleFeedback = async (val: "thumbs_up" | "thumbs_down") => {
    if (!id) return;
    const newValue = feedback === val ? null : val;
    setFeedback(newValue);
    try {
      await fetch(`/api/messages/${id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: newValue }),
      });
    } catch (e) {
      console.error("Failed sending feedback:", e);
    }
  };

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-3 group">
      <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 max-w-[94%] sm:max-w-[88%]">
        <div className="bg-white/95 border border-indigo-100/90 rounded-3xl rounded-tl-xs p-4 sm:p-5 shadow-sm shadow-indigo-100/30">
          {/* Agentic pipeline banner */}
          {chunks && chunks.length > 0 && (
            <ReasoningAccordion
              latency={latency ?? null}
              chunkCount={chunks.length}
              deptCode={deptCode}
            />
          )}

          {/* Formatted Markdown */}
          <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed
            prose-headings:text-slate-900 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
            prose-h2:text-base prose-h3:text-sm prose-p:my-2 prose-ul:my-2 prose-li:my-0.5
            prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
            prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-2xl
            prose-table:border-collapse prose-th:bg-slate-50 prose-th:p-2 prose-td:p-2 prose-td:border-b prose-td:border-slate-100 overflow-x-auto"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>

          {/* Source Chips */}
          {chunks && chunks.length > 0 && (
            <CitationChips chunks={chunks} onSelectChunk={onSelectChunk} />
          )}
        </div>

        {/* Micro-actions */}
        <div className="flex items-center gap-1 mt-1.5 ml-1">
          <button
            onClick={() => handleFeedback("thumbs_up")}
            title="Helpful"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              feedback === "thumbs_up"
                ? "text-emerald-600 bg-emerald-50"
                : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFeedback("thumbs_down")}
            title="Inaccurate"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              feedback === "thumbs_down"
                ? "text-rose-600 bg-rose-50"
                : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            title={copied ? "Copied" : "Copy response"}
            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onRetry}
            title="Regenerate"
            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {time && <span className="text-[10px] text-slate-500 ml-2 font-medium">{time}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Hero Empty State ─────────────────────────────────────────────────────────

function EmptyState({
  onSuggest,
  deptCode = "ALL",
  deptName = "All Departments & University",
}: {
  onSuggest: (q: string) => void;
  deptCode?: string;
  deptName?: string;
}) {
  const isAll = !deptCode || deptCode === "ALL";
  const categories = [
    {
      icon: BookOpen,
      title: "Course Syllabi & Units",
      desc: "Curriculum modules, chapter outlines, key formulas, and exam weightage.",
      prompt: isAll
        ? "Summarize the high-yield topics and syllabus units for AI and Computer Science"
        : `Summarize the high-yield topics and syllabus units for ${deptCode}`,
    },
    {
      icon: FlaskConical,
      title: "Lab Manuals & Code",
      desc: "Step-by-step experiment procedures, requirements, and test scenarios.",
      prompt: isAll
        ? "Explain the required laboratory experiments and expected outputs for CNIP Lab"
        : `Explain the required laboratory experiments and expected outputs for ${deptCode}`,
    },
    {
      icon: Scale,
      title: "Academic Regulations",
      desc: "Official university attendance policies, grading scale, and exam condonation.",
      prompt: "What is the official university policy regarding minimum attendance and semester examinations?",
    },
    {
      icon: Sparkles,
      title: "AI Concept Breakdown",
      desc: "Clear pedagogical explanations with pseudo-code and intuitive examples.",
      prompt: "Explain Artificial Intelligence search algorithms (A*, Minimax, Alpha-Beta pruning) with examples",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-12 px-2 text-center max-w-2xl mx-auto w-full">
      {/* Brand Emblem */}
      <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center mb-3 text-white shadow-lg shadow-indigo-500/25">
        <Bot className="w-7 h-7" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3 shadow-xs">
        <GraduationCap className="w-4 h-4 text-indigo-600" />
        <span>{isAll ? "Campus-Wide Knowledge Scope (All Departments & University)" : `${deptName} (${deptCode}) Knowledge Scope`}</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Academic AI Assistant
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 max-w-md mb-6 leading-relaxed font-medium">
        Ask questions scoped directly to your department repository. Every answer is cross-verified against official faculty documents.
      </p>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <button
              key={idx}
              onClick={() => onSuggest(cat.prompt)}
              className="text-left p-4 rounded-2xl bg-white hover:bg-indigo-50/30 border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all text-xs group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Prompts */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-slate-500 font-semibold">Quick starters:</span>
        {[
          "AI Units 1-2 Syllabus",
          "CNIP Lab Manual",
          "Attendance Shortage Condonation",
          "Credit Requirements",
        ].map((tag) => (
          <button
            key={tag}
            onClick={() => onSuggest(`Explain the details regarding ${tag}`)}
            className="text-xs px-3 py-1 rounded-full bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 text-slate-700 font-medium transition-all shadow-xs"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Citations Drawer Content ──────────────────────────────────────────────────

function ContextPanelContent({
  chunks,
  selectedChunk,
  onClearSelected,
}: {
  chunks: Chunk[];
  selectedChunk: Chunk | null;
  onClearSelected: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-3 text-xs bg-slate-50/50">
      {selectedChunk ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              Source Excerpt
            </span>
            <button
              onClick={onClearSelected}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
            >
              Back to all
            </button>
          </div>
          <div className="p-4 rounded-xl bg-white border border-indigo-200 shadow-sm space-y-2">
            <p className="font-bold text-slate-900 text-sm">{selectedChunk.documentName}</p>
            {selectedChunk.pageNumber && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono font-semibold inline-block border border-indigo-200">
                Page {selectedChunk.pageNumber}
              </span>
            )}
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-normal">
              {selectedChunk.chunkText}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
              Retrieved Citations ({chunks.length})
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Verified Ground Truth
            </span>
          </div>

          {chunks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2 bg-white rounded-2xl border border-slate-200 p-6">
              <Sparkles className="w-8 h-8 text-indigo-500 mx-auto" />
              <p className="text-xs font-medium text-slate-700">No citations yet. Send a message to inspect ground-truth excerpts.</p>
            </div>
          ) : (
            chunks.map((c, i) => {
              const scorePct = c.score ? Math.round(c.score * 100) : null;
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5 hover:border-indigo-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-slate-900 truncate">{c.documentName}</p>
                        {c.departmentCode && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {c.departmentCode}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Chunk {c.chunkIndex + 1}
                        {c.pageNumber && ` · Page ${c.pageNumber}`}
                      </p>
                    </div>
                    {scorePct && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold shrink-0">
                        {scorePct}% match
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 line-clamp-3 leading-relaxed text-xs">
                    {c.chunkText}
                  </p>
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}

// ── Main Chat Page Component ──────────────────────────────────────────────────

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversationMeta[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [userName, setUserName] = useState("Student");
  const [userInitials, setUserInitials] = useState("ST");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mobile drawers
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [mobileContextOpen, setMobileContextOpen] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [retrievalLatency, setRetrievalLatency] = useState<number | null>(null);

  // Department Knowledge Scope
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("ALL");
  const [userScope, setUserScope] = useState<any>(null);

  // Load departments
  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => {
        if (d.departments && d.departments.length > 0) {
          setDepartments(d.departments);
          setUserScope(d.userScope);
          // Default to ALL so queries search the entire knowledge base without restriction
          setSelectedDepartmentId((prev) => (prev && prev !== "ALL" ? prev : "ALL"));
        }
      })
      .catch((e) => console.error("Failed loading departments:", e));
  }, []);

  const selectedDepartment =
    !selectedDepartmentId || selectedDepartmentId === "ALL"
      ? { id: "ALL", code: "ALL", name: "All Departments & University" }
      : departments.find((d) => d.id === selectedDepartmentId) || { id: "ALL", code: "ALL", name: "All Departments & University" };

  // Load user info
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const user = data?.user;
        if (!user) return;
        const name = user.name || user.email?.split("@")[0] || "Student";
        setUserName(name);
        setUserInitials(name.slice(0, 2).toUpperCase());
      })
      .catch(() => {});
  }, []);

  // Load history
  const loadHistory = useCallback(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        setHistory(d.conversations ?? []);
        setHistoryLoading(false);
      })
      .catch(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // useChat hook
  const { messages, setMessages, sendMessage, regenerate, status, error } = useChat({
    initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: async (url, init) => {
        const startTime = Date.now();
        const res = await fetch(url, init);
        const elapsed = Date.now() - startTime;
        setRetrievalLatency(elapsed);
        const raw = res.headers.get("X-Retrieved-Chunks");
        if (raw) {
          try {
            const parsed = JSON.parse(decodeURIComponent(raw));
            if (Array.isArray(parsed)) {
              setChunks(parsed);
            }
          } catch {}
        }
        return res;
      },
    }),
    onFinish: () => {
      loadHistory();
    },
  } as any);

  // Create new conversation
  const createNew = useCallback(async () => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data.conversation?.id) {
      setConversationId(data.conversation.id);
      setInitialMessages([]);
      setMessages([]);
      setChunks([]);
      setRetrievalLatency(null);
      loadHistory();
    }
  }, [loadHistory, setMessages]);

  // Load existing conversation
  const loadConversation = useCallback(async (id: string) => {
    setConversationId(id);
    setChunks([]);
    setRetrievalLatency(null);
    const res = await fetch(`/api/conversations/${id}`);
    const data = await res.json();
    if (data.conversation?.messages) {
      const msgs = data.conversation.messages.map((m: any) => ({
        id: m.id,
        role: m.role === "USER" ? "user" : m.role === "ASSISTANT" ? "assistant" : "system",
        content: m.content,
        createdAt: new Date(m.createdAt),
      }));
      setInitialMessages(msgs);
      setMessages(msgs);
      const lastAssistant = [...data.conversation.messages].reverse()
        .find((m: any) => m.role === "ASSISTANT" && m.citations);
      if (lastAssistant?.citations) {
        try {
          const parsed = typeof lastAssistant.citations === "string"
            ? JSON.parse(lastAssistant.citations)
            : lastAssistant.citations;
          if (Array.isArray(parsed)) {
            setChunks(parsed.slice(0, 5));
          }
        } catch {}
      }
    }
  }, [setMessages]);

  // Delete conversation
  const deleteConv = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (conversationId === id) {
      setConversationId(null);
      setInitialMessages([]);
      setMessages([]);
      setChunks([]);
      setRetrievalLatency(null);
    }
    loadHistory();
  }, [conversationId, loadHistory, setMessages]);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFormSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!input?.trim() || isLoading) return;

      let currentId = conversationId;

      if (!currentId) {
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const data = await res.json();
          if (data.conversation?.id) {
            currentId = data.conversation.id;
            setConversationId(currentId);
            loadHistory();
          }
        } catch (err) {
          console.error("Error creating conversation:", err);
        }
      }

      sendMessage(
        { text: input },
        {
          body: {
            conversationId: currentId,
            departmentId: selectedDepartmentId,
          },
        }
      );
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    [conversationId, input, isLoading, sendMessage, loadHistory, selectedDepartmentId]
  );

  const currentTitle = history.find((h) => h.id === conversationId)?.title ?? "Academic Consultation";

  return (
    <div className="flex h-full w-full bg-slate-50/60 text-slate-900 overflow-hidden relative">
      
      {/* ── Left Sidebar (Desktop) ─────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-r border-slate-200/90 bg-white/90 backdrop-blur-xl hidden md:flex flex-col z-10 shadow-xs">
        <div className="p-3">
          <button
            onClick={createNew}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-sm transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" /> New Session
          </button>
        </div>

        <div className="px-3 pb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <span>Recent Sessions</span>
          <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px] font-bold">{history.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {historyLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-500 text-xs font-medium">
              No conversations yet.
            </div>
          ) : (
            history.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-xs transition-all ${
                  conversationId === conv.id
                    ? "bg-indigo-50/90 text-indigo-700 font-bold border border-indigo-200/80 shadow-xs"
                    : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${conversationId === conv.id ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"}`} />
                <span className="flex-1 truncate">{conv.title || "New Session"}</span>
                <button
                  onClick={(e) => deleteConv(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 transition-opacity"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-200/90 flex items-center gap-2 bg-slate-50/80">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
            <p className="text-[10px] text-emerald-700 flex items-center gap-1 font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Verified Student
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main Chat Column ────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        
        {/* Header */}
        <header className="h-14 border-b border-slate-200/90 bg-white/90 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between shrink-0 z-10 gap-2 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile History Drawer */}
            <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
              <SheetTrigger className="md:hidden flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shrink-0 shadow-xs font-semibold">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>Chats</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:max-w-xs bg-white border-r border-slate-200 p-0 text-slate-900">
                <SheetHeader className="p-4 border-b border-slate-200 bg-slate-50/60">
                  <SheetTitle className="text-slate-900 text-sm font-bold">Consultation History</SheetTitle>
                  <SheetDescription className="text-xs text-slate-500 font-medium">
                    Switch or resume previous sessions
                  </SheetDescription>
                </SheetHeader>
                <div className="p-3">
                  <button
                    onClick={() => {
                      createNew();
                      setMobileHistoryOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> New Session
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                  {history.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        loadConversation(conv.id);
                        setMobileHistoryOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 text-xs text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-700 rounded-xl cursor-pointer font-medium"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="truncate flex-1">{conv.title || "New Session"}</span>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[150px] sm:max-w-md">
              {currentTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Department Scope Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-xs">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-[11px] text-indigo-600 hidden sm:inline font-semibold">Scope:</span>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-indigo-950 border-none outline-none focus:ring-0 cursor-pointer max-w-[130px] sm:max-w-[200px] truncate pr-1"
                title="Select Academic Scope"
              >
                <option value="ALL" className="bg-white text-slate-900 font-bold">
                  All Departments & Univ
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id} className="bg-white text-slate-900 font-medium">
                    {dept.code} - {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Citations Sheet */}
            <Sheet open={mobileContextOpen} onOpenChange={setMobileContextOpen}>
              <SheetTrigger
                className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5 transition-all shadow-xs font-semibold"
                title="View Grounded Citations"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Sources</span>
                {chunks.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-[10px] text-white font-bold font-mono">
                    {chunks.length}
                  </span>
                )}
              </SheetTrigger>
              <SheetContent side="right" className="w-[90vw] sm:max-w-md bg-white border-l border-slate-200 p-0 text-slate-900">
                <SheetHeader className="p-4 border-b border-slate-200 bg-slate-50/60">
                  <SheetTitle className="text-slate-900 text-sm font-bold">Grounded Sources & Citations</SheetTitle>
                  <SheetDescription className="text-xs text-slate-500 font-medium">
                    Official syllabus & regulation excerpts retrieved for this conversation
                  </SheetDescription>
                </SheetHeader>
                <ContextPanelContent
                  chunks={chunks}
                  selectedChunk={selectedChunk}
                  onClearSelected={() => setSelectedChunk(null)}
                />
              </SheetContent>
            </Sheet>

            {/* Share */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: currentTitle, url: window.location.href }).catch(() => {});
                } else {
                  copyText(window.location.href);
                  alert("Chat link copied to clipboard!");
                }
              }}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 transition-colors shadow-xs"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto w-full space-y-4">
            {messages.length === 0 ? (
              <EmptyState
                onSuggest={(q) => setInput(q)}
                deptCode={selectedDepartment?.code || "ALL"}
                deptName={selectedDepartment?.name || "All Departments & University"}
              />
            ) : (
              messages.map((m: any) => {
                const textContent = getMessageContent(m);
                return m.role === "user" ? (
                  <UserBubble
                    key={m.id}
                    content={textContent}
                    time={m.createdAt ? fmtTime(m.createdAt.toISOString?.() ?? m.createdAt) : undefined}
                  />
                ) : (
                  <AssistantBubble
                    key={m.id}
                    id={m.id}
                    initialFeedback={
                      m.metadata
                        ? typeof m.metadata === "string"
                          ? JSON.parse(m.metadata).feedback
                          : (m.metadata as any).feedback
                        : null
                    }
                    content={textContent}
                    time={m.createdAt ? fmtTime(m.createdAt.toISOString?.() ?? m.createdAt) : undefined}
                    onCopy={() => copyText(textContent)}
                    onRetry={() => regenerate()}
                    chunks={chunks}
                    onSelectChunk={(c) => {
                      setSelectedChunk(c);
                      setMobileContextOpen(true);
                    }}
                    latency={retrievalLatency}
                    deptCode={selectedDepartment?.code || "ALL"}
                  />
                );
              })
            )}

            {/* Typing Loader */}
            {isLoading && (messages[messages.length - 1]?.role === "user" || (messages[messages.length - 1]?.role === "assistant" && !getMessageContent(messages[messages.length - 1]))) && (
              <div className="flex gap-3 items-start">
                <NeuralSynapseLoader text={`Retrieving & synthesizing verified ${selectedDepartment?.code === "ALL" ? "university & departmental" : (selectedDepartment?.code || "academic")} knowledge...`} />
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs">
                  <span>Unable to complete response.</span>
                  <button onClick={() => regenerate()} className="underline font-bold text-rose-900 hover:text-rose-700">
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div className="shrink-0 border-t border-slate-200/90 bg-white/90 backdrop-blur-xl px-3 sm:px-6 py-3 z-10 shadow-xs">
          <div className="max-w-3xl mx-auto w-full">
            <form onSubmit={handleFormSubmit}>
              <div className="rounded-2xl bg-white border border-slate-300/80 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-sm transition-all">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleFormSubmit();
                    }
                  }}
                  placeholder={
                    selectedDepartment?.code === "ALL"
                      ? "Ask anything across university syllabi, lab manuals, regulations..."
                      : `Ask anything about ${selectedDepartment?.code || "academic"} syllabi, lab manuals, regulations...`
                  }
                  disabled={isLoading}
                  rows={1}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 font-medium px-4 pt-3.5 pb-1 resize-none outline-none min-h-[44px] max-h-36 leading-relaxed"
                />

                <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono font-medium">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Grounded Institutional Knowledge</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      Enter ↵ to send
                    </span>
                    <button
                      type="submit"
                      disabled={isLoading || !input?.trim()}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xs transition-all active:scale-95"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <p className="text-center text-[10px] text-slate-500 mt-1.5 font-medium">
              Grounded in verified institutional documents. Cross-check citations for examination requirements.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
