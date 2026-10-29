import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { syncUserToDatabase } from "@/server/actions/auth";
import { DocumentAccessPolicy } from "@/server/services/document-access-policy";
import {
  detectDocumentCategory,
  matchCourseRelevance,
  resolveFacultyAttributions,
  EnrolledCourseSummary,
  DocumentCategoryType,
} from "@/server/services/document-categorizer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const facultyCookie = cookieStore.get("faculty_session");

    let isFaculty = false;
    let facultyUser: any = null;
    if (facultyCookie?.value) {
      try {
        facultyUser = JSON.parse(facultyCookie.value);
        isFaculty = Boolean(facultyUser);
      } catch {}
    }

    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;

    if (!user && !isFaculty) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const effectiveUserId = user?.id || facultyUser?.userId || facultyUser?.id;

    // 1. Resolve Organization
    let organizationId = facultyUser?.organizationId;
    if (!organizationId && user) {
      let memberships = await db.membership.findMany({
        where: { userId: user.id },
        include: { organization: { include: { _count: { select: { documents: true } } } } },
      });

      if (memberships.length === 0) {
        await syncUserToDatabase();
        memberships = await db.membership.findMany({
          where: { userId: user.id },
          include: { organization: { include: { _count: { select: { documents: true } } } } },
        });
      }

      if (memberships.length > 0) {
        const preferred =
          memberships.find(
            (m) => m.organizationId === "seed-org-001" || m.organization._count.documents > 0
          ) || memberships[0];
        organizationId = preferred.organizationId;
      }
    }

    if (!organizationId) {
      organizationId = "seed-org-001";
    }

    // 2. Query Parameters
    const { searchParams } = new URL(req.url);
    const timeframeParam = (searchParams.get("timeframe") || "7d").toLowerCase();
    const requestedDept = searchParams.get("departmentId");
    const categoryFilter = (searchParams.get("category") || "all").toUpperCase();
    const limitParam = parseInt(searchParams.get("limit") || "12", 10);
    const limit = Math.min(50, Math.max(1, isNaN(limitParam) ? 12 : limitParam));

    // 3. Resolve Authoritative Student Access Context
    const accessContext = await DocumentAccessPolicy.resolveStudentAccessContext(
      effectiveUserId,
      organizationId,
      requestedDept
    );

    // 4. Resolve Student Profile and Actively Enrolled Courses
    const studentRecord = await db.student.findFirst({
      where: {
        OR: [{ userId: effectiveUserId }, { id: effectiveUserId }],
        deletedAt: null,
      },
      include: {
        department: { select: { id: true, code: true, name: true } },
        enrolments: {
          where: { deletedAt: null, status: "Enrolled" },
          include: {
            courseSection: {
              include: {
                course: { select: { id: true, code: true, title: true } },
              },
            },
          },
        },
      },
    });

    const enrolledCourses: EnrolledCourseSummary[] = [];
    if (studentRecord?.enrolments) {
      for (const enr of studentRecord.enrolments) {
        if (enr.courseSection?.course) {
          const c = enr.courseSection.course;
          if (!enrolledCourses.some((item) => item.code === c.code)) {
            enrolledCourses.push({
              id: c.id,
              code: c.code,
              title: c.title,
            });
          }
        }
      }
    }

    // 5. Build Base Access Policy Query (Strictly excludes PRIVATE documents for students)
    const baseWhere = DocumentAccessPolicy.buildPrismaDocumentWhere(accessContext);

    // 6. Calculate Cutoff Timestamps for Statistics & Filtering
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hours48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let selectedCutoff: Date | null = null;
    switch (timeframeParam) {
      case "today":
        selectedCutoff = todayMidnight;
        break;
      case "48h":
        selectedCutoff = hours48Ago;
        break;
      case "7d":
        selectedCutoff = days7Ago;
        break;
      case "30d":
        selectedCutoff = days30Ago;
        break;
      case "all":
        selectedCutoff = null;
        break;
      default:
        selectedCutoff = days7Ago;
        break;
    }

    // 7. Assemble Complete Prisma Filter
    const andClauses: any[] = [];
    if (baseWhere.OR) {
      andClauses.push({ OR: baseWhere.OR });
    }

    if (selectedCutoff) {
      andClauses.push({ createdAt: { gte: selectedCutoff } });
    }

    const whereClause: any = {
      organizationId: baseWhere.organizationId,
      deletedAt: null,
      processingStatus: { in: ["COMPLETED", "UPLOADED"] },
      ...(baseWhere.visibility ? { visibility: baseWhere.visibility } : {}),
      ...(andClauses.length > 0 ? { AND: andClauses } : {}),
    };

    // 8. Fetch Documents in Selected Timeframe
    const rawDocuments = await db.document.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100, // retrieve up to 100 for comprehensive category breakdown and stats
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        processingStatus: true,
        visibility: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        createdAt: true,
        uploadedBy: true,
        knowledgeBaseId: true,
        knowledgeBase: { select: { id: true, name: true } },
        _count: { select: { chunks: { where: { deletedAt: null } } } },
      },
    });

    // 9. Collect and Resolve Faculty Attribution
    const uploaderIds = rawDocuments.map((d) => d.uploadedBy);
    const attributionMap = await resolveFacultyAttributions(uploaderIds);

    // 10. Process Each Document: Categorize, Check Relevance, Format
    type EnrichedDoc = typeof rawDocuments[0] & {
      category: ReturnType<typeof detectDocumentCategory>;
      relevance: ReturnType<typeof matchCourseRelevance>;
      faculty: ReturnType<typeof attributionMap.get>;
      downloadUrl: string;
      previewUrl: string;
      askAiPrompt: string;
    };

    const enrichedDocuments: EnrichedDoc[] = rawDocuments.map((doc) => {
      const category = detectDocumentCategory(doc.fileName, doc.knowledgeBase?.name);
      const relevance = matchCourseRelevance(
        doc.fileName,
        doc.knowledgeBase?.name,
        enrolledCourses
      );
      const faculty = doc.uploadedBy
        ? attributionMap.get(doc.uploadedBy)
        : {
            id: "system",
            name: "Academic Repository",
            designation: "Academic Office",
            formattedAttribution: "Academic Office",
          };

      return {
        ...doc,
        category,
        relevance,
        faculty,
        downloadUrl: `/api/documents/${doc.id}/download`,
        previewUrl: `/api/documents/${doc.id}`,
        askAiPrompt: `Explain the key concepts and important topics from ${doc.fileName}`,
      };
    });

    // 11. Compute Category Counts and Statistical Indicators
    const categoryCounts: Record<string, number> = {
      ALL: enrichedDocuments.length,
      LECTURE_NOTES: 0,
      SYLLABUS: 0,
      LAB_MANUAL: 0,
      EXAM_PAPER: 0,
      CIRCULAR: 0,
      GENERAL_ACADEMIC: 0,
    };

    let todayCount = 0;
    let enrolledRelevantCount = 0;

    for (const doc of enrichedDocuments) {
      const catKey = doc.category.category;
      categoryCounts[catKey] = (categoryCounts[catKey] || 0) + 1;

      if (new Date(doc.createdAt) >= todayMidnight) {
        todayCount++;
      }
      if (doc.relevance.isRelevant) {
        enrolledRelevantCount++;
      }
    }

    // 12. Apply Category Filter
    let filteredDocuments = enrichedDocuments;
    if (categoryFilter !== "ALL") {
      filteredDocuments = enrichedDocuments.filter(
        (doc) => doc.category.category === categoryFilter
      );
    }

    // Sort enrolled relevant documents to top within the time window
    filteredDocuments.sort((a, b) => {
      if (a.relevance.isRelevant && !b.relevance.isRelevant) return -1;
      if (!a.relevance.isRelevant && b.relevance.isRelevant) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Paginate to requested limit
    const paginatedDocuments = filteredDocuments.slice(0, limit);

    return NextResponse.json({
      success: true,
      timeframe: timeframeParam,
      availableTimeframes: ["today", "48h", "7d", "30d", "all"],
      stats: {
        today: todayCount,
        thisWeek: enrichedDocuments.filter((d) => new Date(d.createdAt) >= days7Ago).length,
        enrolledRelevant: enrolledRelevantCount,
        totalInTimeframe: enrichedDocuments.length,
        categoryCounts,
      },
      student: {
        department: studentRecord?.department || {
          code: "CSE",
          name: "Computer Science & Engineering",
        },
        enrolledCourses,
      },
      documents: paginatedDocuments,
    });
  } catch (error: any) {
    console.error("[GET /api/student/recent-uploads] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
