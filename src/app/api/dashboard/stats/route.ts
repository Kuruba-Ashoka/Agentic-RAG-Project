import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/insforge/server";
import { db, ensureDbConnected } from "@/server/db/prisma";
import { syncUserToDatabase } from "@/server/actions/auth";
import { DocumentAccessPolicy } from "@/server/services/document-access-policy";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let orgIdForLog: string | null = null;
  try {
    await ensureDbConnected();
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    let membership = null;

    // Check query params for department
    let requestedDeptParam: string | null = null;
    if (req?.url) {
      try {
        const url = new URL(req.url);
        requestedDeptParam = url.searchParams.get("department");
      } catch {}
    }

    let memberships: any[] = [];
    if (user) {
      try {
        memberships = await db.membership.findMany({
          where: { userId: user.id },
          include: { organization: { include: { _count: { select: { documents: true } } } } },
        });
      } catch (connErr) {
        console.warn("[DashboardStats] Retrying membership lookup after connection retry...", connErr);
        await new Promise((r) => setTimeout(r, 500));
        memberships = await db.membership.findMany({
          where: { userId: user.id },
          include: { organization: { include: { _count: { select: { documents: true } } } } },
        });
      }

      if (memberships.length === 0) {
        await syncUserToDatabase();
        memberships = await db.membership.findMany({
          where: { userId: user.id },
          include: { organization: { include: { _count: { select: { documents: true } } } } },
        });
      }

      if (memberships.length > 0) {
        membership =
          memberships.find(
            (m: any) => m.organizationId === "seed-org-001" || (m.organization?._count?.documents ?? 0) > 0
          ) || memberships[0];
      }
    }

    // If still no membership, fallback to the primary workspace organization
    let organizationId = membership?.organizationId;
    if (!organizationId) {
      const defaultOrg = await db.organization.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      });
      if (defaultOrg) {
        organizationId = defaultOrg.id;
      } else {
        const newOrg = await db.organization.create({ data: { name: "Default Organization" } });
        organizationId = newOrg.id;
      }
    }
    orgIdForLog = organizationId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalDocs,
      totalDocsLastMonth,
      totalConversations,
      totalConversationsLastMonth,
      totalMembers,
      totalMembersLastMonth,
      totalTokensResult,
      totalTokensLastMonthResult,
    ] = await Promise.all([
      db.document.count({ where: { organizationId, deletedAt: null } }),
      db.document.count({ where: { organizationId, deletedAt: null, createdAt: { lt: thirtyDaysAgo } } }),
      db.conversation.count({ where: { organizationId, deletedAt: null } }),
      db.conversation.count({ where: { organizationId, deletedAt: null, createdAt: { lt: thirtyDaysAgo } } }),
      db.membership.count({ where: { organizationId, deletedAt: null } }),
      db.membership.count({ where: { organizationId, deletedAt: null, createdAt: { lt: thirtyDaysAgo } } }),
      db.usageEvent.aggregate({
        where: { organizationId },
        _sum: { tokensInput: true, tokensOutput: true, embeddingTokens: true },
      }),
      db.usageEvent.aggregate({
        where: { organizationId, createdAt: { lt: thirtyDaysAgo } },
        _sum: { tokensInput: true, tokensOutput: true, embeddingTokens: true },
      }),
    ]);

    const totalTokens =
      (totalTokensResult._sum.tokensInput ?? 0) +
      (totalTokensResult._sum.tokensOutput ?? 0) +
      (totalTokensResult._sum.embeddingTokens ?? 0);

    const totalTokensLastMonth =
      (totalTokensLastMonthResult._sum.tokensInput ?? 0) +
      (totalTokensLastMonthResult._sum.tokensOutput ?? 0) +
      (totalTokensLastMonthResult._sum.embeddingTokens ?? 0);

    const usageEvents = await db.usageEvent.findMany({
      where: { organizationId, createdAt: { gte: thirtyDaysAgo } },
      select: {
        createdAt: true,
        tokensInput: true,
        tokensOutput: true,
        embeddingTokens: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const dailyMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap[key] = 0;
    }
    for (const e of usageEvents) {
      const key = new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (key in dailyMap) {
        dailyMap[key] +=
          (e.tokensInput ?? 0) + (e.tokensOutput ?? 0) + (e.embeddingTokens ?? 0);
      }
    }
    const tokenChart = Object.entries(dailyMap).map(([date, tokens]) => ({ date, tokens }));

    const [docStorage, embeddingStorage] = await Promise.all([
      db.document.aggregate({
        where: { organizationId, deletedAt: null },
        _sum: { fileSize: true },
      }),
      db.chunk.count({ where: { organizationId, deletedAt: null } }),
    ]);

    const docStorageBytes = docStorage._sum.fileSize ?? 0;
    const embeddingStorageBytes = embeddingStorage * 6 * 1024;
    const kbStorageBytes = embeddingStorage * 512;
    const otherBytes = 1024 * 1024;
    const totalStorageBytes = docStorageBytes + embeddingStorageBytes + kbStorageBytes + otherBytes;
    const storageLimitBytes = 200 * 1024 * 1024 * 1024;

    const [recentDocs, recentConvs] = await Promise.all([
      db.document.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: { id: true, fileName: true, processingStatus: true, updatedAt: true },
      }),
      db.conversation.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: { id: true, title: true, updatedAt: true },
      }),
    ]);

    const activity = [
      ...recentDocs.map((d) => ({
        id: d.id,
        type: "document" as const,
        label: "Document processed",
        sublabel: d.fileName,
        time: d.updatedAt.toISOString(),
      })),
      ...recentConvs.map((c) => ({
        id: c.id,
        type: "chat" as const,
        label: "New conversation",
        sublabel: c.title ?? "Untitled chat",
        time: c.updatedAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);

    const kbs = await db.knowledgeBase.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        _count: {
          select: {
            documents: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    const topKBs = kbs.map((kb) => ({
      id: kb.id,
      name: kb.name,
      runs: kb._count.documents,
    }));

    const pct = (current: number, previous: number) => {
      if (previous === 0) return null;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    // Fetch Student / Faculty Academic Context for Role Synergy
    let studentRecord: any = null;
    let facultyRecord: any = null;

    if (user) {
      [studentRecord, facultyRecord] = await Promise.all([
        db.student.findFirst({
          where: {
            OR: [{ userId: user.id }, { id: user.id }],
            deletedAt: null,
          },
          include: {
            department: true,
            _count: {
              select: { enrolments: { where: { deletedAt: null } } },
            },
          },
        }),
        db.faculty.findFirst({
          where: {
            OR: [{ userId: user.id }, { id: user.id }],
            deletedAt: null,
          },
          include: {
            department: true,
          },
        }),
      ]);
    }

    if (!studentRecord) {
      studentRecord = await db.student.findFirst({
        where: { deletedAt: null },
        include: {
          department: true,
          _count: {
            select: { enrolments: { where: { deletedAt: null } } },
          },
        },
        orderBy: { gpa: "desc" },
      });
    }

    // Default or Fallback Department
    const cookieStore = await cookies();
    const deptCookie = cookieStore.get("student_department")?.value;

    const allDepts = await db.department.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { code: "asc" },
    });

    const cookieDept = deptCookie
      ? allDepts.find((d) => d.code.toLowerCase() === deptCookie.toLowerCase() || (deptCookie.toUpperCase() === "CS" && d.code === "CSE"))
      : null;

    const paramDept = requestedDeptParam
      ? allDepts.find((d) => d.code.toLowerCase() === requestedDeptParam.toLowerCase() || (requestedDeptParam.toUpperCase() === "CSE" && d.code === "CS") || (requestedDeptParam.toUpperCase() === "CS" && d.code === "CSE"))
      : null;

    const activeDepartment =
      paramDept ||
      cookieDept ||
      studentRecord?.department ||
      facultyRecord?.department ||
      allDepts.find((d) => d.code === "CSE" || d.code === "CS") ||
      allDepts[0] ||
      null;

    const deptCodeKey = (activeDepartment?.code === "CS" ? "CSE" : (activeDepartment?.code || "CSE")).toUpperCase();

    // Resolve all related department IDs (e.g. CS and CSE are mapped together)
    const relatedDeptIds = allDepts
      .filter((d) => {
        if (!activeDepartment) return false;
        if (d.id === activeDepartment.id) return true;
        if (["CS", "CSE"].includes(activeDepartment.code) && ["CS", "CSE"].includes(d.code)) return true;
        return false;
      })
      .map((d) => d.id);

    // Count authorized documents accessible to this student's scope
    const accessContext = await DocumentAccessPolicy.resolveStudentAccessContext(
      user?.id || "",
      organizationId,
      requestedDeptParam
    );
    const documentWhere = DocumentAccessPolicy.buildPrismaDocumentWhere(accessContext);

    let [authorizedDeptDocs, recentDeptDocs] = await Promise.all([
      db.document.count({ where: documentWhere }),
      db.document.findMany({
        where: documentWhere,
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          department: true,
          knowledgeBase: { select: { name: true } },
        },
      }),
    ]);

    // If department filter produced 0 docs, fallback to organization's general academic documents
    if (recentDeptDocs.length === 0) {
      recentDeptDocs = await db.document.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          department: true,
          knowledgeBase: { select: { name: true } },
        },
      });
      authorizedDeptDocs = recentDeptDocs.length;
    }

    // Build synthesized department faculty uploads
    const dbMappedDocs = recentDeptDocs.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      courseCode: d.knowledgeBase?.name ?? null,
      visibility: d.visibility,
      departmentCode: d.department?.code ?? (d.visibility === "UNIVERSITY" ? "UNIV" : null),
      departmentName: d.department?.name ?? (d.visibility === "UNIVERSITY" ? "University-Wide" : null),
      facultyAuthor: d.uploadedBy ?? null,
      facultyTitle: null,
      fileSizeText: d.fileSize > 0 ? `${(d.fileSize / (1024 * 1024)).toFixed(1)} MB` : null,
      processingStatus: d.processingStatus,
      createdAt: d.createdAt.toISOString(),
    }));

    // Only use real DB documents — no hardcoded fixtures
    const combinedDeptDocs = dbMappedDocs;

    return NextResponse.json({
      stats: {
        totalDocs,
        docsTrend: pct(totalDocs, totalDocsLastMonth),
        totalConversations,
        conversationsTrend: pct(totalConversations, totalConversationsLastMonth),
        totalTokens,
        tokensTrend: pct(totalTokens, totalTokensLastMonth),
        totalMembers,
        membersTrend: pct(totalMembers, totalMembersLastMonth),
        authorizedDeptDocs,
      },
      academicContext: {
        isStudent: Boolean(studentRecord),
        isFaculty: Boolean(facultyRecord),
        role: studentRecord ? "STUDENT" : facultyRecord ? "FACULTY" : (membership?.role || "MEMBER"),
        studentNumber: studentRecord?.studentNumber ?? null,
        major: studentRecord?.major ?? null,
        gpa: studentRecord?.gpa ?? null,
        academicStatus: studentRecord?.academicStatus ?? null,
        enrolledCoursesCount: studentRecord?._count?.enrolments ?? 0,
        departmentId: activeDepartment?.id || null,
        departmentCode: activeDepartment?.code ?? null,
        departmentName: activeDepartment?.name ?? null,
        authorizedDocsCount: authorizedDeptDocs > 0 ? authorizedDeptDocs : dbMappedDocs.length,
        recentDepartmentDocs: dbMappedDocs,
      },
      tokenChart,
      storage: {
        docBytes: docStorageBytes,
        embeddingBytes: embeddingStorageBytes,
        kbBytes: kbStorageBytes,
        otherBytes,
        totalBytes: totalStorageBytes,
        limitBytes: storageLimitBytes,
      },
      activity,
      topKBs,
      user: {
        email: user?.email ?? "",
        name: (user as any)?.profile?.name ?? user?.email?.split("@")[0] ?? "Student Scholar",
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({
      stats: {
        totalDocs: 0,
        docsTrend: null,
        totalConversations: 0,
        conversationsTrend: null,
        totalTokens: 0,
        tokensTrend: null,
        totalMembers: 1,
        membersTrend: null,
        authorizedDeptDocs: 0,
      },
      academicContext: {
        isStudent: false,
        isFaculty: false,
        role: "MEMBER",
        studentNumber: null,
        major: null,
        gpa: null,
        academicStatus: null,
        enrolledCoursesCount: 0,
        departmentId: null,
        departmentCode: null,
        departmentName: null,
        authorizedDocsCount: 0,
        recentDepartmentDocs: [],
      },
      tokenChart: [],
      storage: { docBytes: 0, embeddingBytes: 0, kbBytes: 0, otherBytes: 1048576, totalBytes: 1048576, limitBytes: 214748364800 },
      activity: [],
      topKBs: [],
      user: { email: "", name: "Student Scholar" },
    });
  }
}

