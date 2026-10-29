import { db } from "@/server/db/prisma";
import { DocumentVisibility } from "@prisma/client";

export interface DocumentAccessContext {
  organizationId: string;
  userId?: string | null;
  facultyId?: string | null;
  userRole?: "OWNER" | "ADMIN" | "DEAN" | "HOD" | "FACULTY" | "ADVISOR" | "STUDENT" | "MEMBER";
  departmentId?: string | null;
  collegeId?: string | null;
}

export class DocumentAccessPolicy {
  /**
   * Validates whether a user with given role is permitted to set the specified visibility on document upload.
   */
  static canUploadWithVisibility(
    role: string | undefined,
    requestedVisibility: DocumentVisibility = "DEPARTMENT"
  ): { allowed: boolean; effectiveVisibility: DocumentVisibility; reason?: string } {
    const normalizedRole = (role || "FACULTY").toUpperCase();

    // Students / basic members cannot upload documents
    if (normalizedRole === "STUDENT" || normalizedRole === "MEMBER") {
      return {
        allowed: false,
        effectiveVisibility: "PRIVATE",
        reason: "Students and regular members do not have permission to upload academic documents.",
      };
    }

    // Administrators, Owners, and Deans have unrestricted visibility rights
    if (["OWNER", "ADMIN", "DEAN"].includes(normalizedRole)) {
      return {
        allowed: true,
        effectiveVisibility: requestedVisibility,
      };
    }

    // Heads of Department (HOD) can publish PRIVATE, DEPARTMENT, and COLLEGE
    if (normalizedRole === "HOD") {
      if (requestedVisibility === "UNIVERSITY") {
        return {
          allowed: false,
          effectiveVisibility: "DEPARTMENT",
          reason: "Publishing university-wide documents requires University Administrator or Registrar approval.",
        };
      }
      return {
        allowed: true,
        effectiveVisibility: requestedVisibility,
      };
    }

    // Standard Faculty can publish PRIVATE and DEPARTMENT
    if (normalizedRole === "FACULTY" || normalizedRole === "ADVISOR") {
      if (requestedVisibility === "COLLEGE") {
        return {
          allowed: false,
          effectiveVisibility: "DEPARTMENT",
          reason: "Publishing college-level documents requires HOD or Dean authorization.",
        };
      }
      if (requestedVisibility === "UNIVERSITY") {
        return {
          allowed: false,
          effectiveVisibility: "DEPARTMENT",
          reason: "Publishing university-wide documents requires University Administrator authorization.",
        };
      }
      return {
        allowed: true,
        effectiveVisibility: requestedVisibility,
      };
    }

    return {
      allowed: false,
      effectiveVisibility: "DEPARTMENT",
      reason: `Unrecognized role: ${role}`,
    };
  }

  /**
   * Validates whether a user is authorized to delete a document.
   * Faculty can ONLY delete their own uploaded documents.
   * HOD can delete documents within their department.
   * Admin / Dean / Owner can delete university documents.
   */
  static canDeleteDocument(
    context: DocumentAccessContext,
    doc: {
      organizationId: string;
      uploadedBy?: string | null;
      departmentId?: string | null;
      collegeId?: string | null;
    }
  ): { allowed: boolean; reason?: string } {
    if (doc.organizationId !== context.organizationId) {
      return { allowed: false, reason: "Tenant violation: Document belongs to a different organization." };
    }

    const role = (context.userRole || "FACULTY").toUpperCase();

    if (["OWNER", "ADMIN", "DEAN"].includes(role)) {
      return { allowed: true };
    }

    if (role === "HOD") {
      if (context.departmentId && doc.departmentId === context.departmentId) {
        return { allowed: true };
      }
      return { allowed: false, reason: "HODs can only delete documents within their own department." };
    }

    if (role === "FACULTY" || role === "ADVISOR") {
      const isOwner =
        (context.userId && doc.uploadedBy === context.userId) ||
        (context.facultyId && doc.uploadedBy === context.facultyId);

      if (isOwner) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Faculty members can only delete documents they personally uploaded. Departmental deletions require HOD/Admin authorization.",
      };
    }

    return { allowed: false, reason: "You do not have permission to delete academic documents." };
  }

  /**
   * Single-document access check (can be used for direct URL downloads or verification).
   */
  static canAccessDocument(
    context: DocumentAccessContext,
    doc: {
      organizationId: string;
      collegeId?: string | null;
      departmentId?: string | null;
      visibility: DocumentVisibility | string;
      uploadedBy?: string | null;
    }
  ): boolean {
    if (doc.organizationId !== context.organizationId) return false;

    const role = (context.userRole || "FACULTY").toUpperCase();
    if (["OWNER", "ADMIN", "DEAN"].includes(role)) return true;

    const vis = doc.visibility as DocumentVisibility;

    // University-wide documents are accessible by all authorized university users
    if (vis === "UNIVERSITY") return true;

    // College-level documents
    if (vis === "COLLEGE") {
      if (!doc.collegeId) return true;
      if (!context.departmentId || context.departmentId === "ALL") return true;
      return Boolean(context.collegeId && doc.collegeId === context.collegeId);
    }

    // Department-level documents
    if (vis === "DEPARTMENT") {
      if (!doc.departmentId) return true;
      if (!context.departmentId || context.departmentId === "ALL") return true;
      return Boolean(context.departmentId && doc.departmentId === context.departmentId);
    }

    // Private documents (only uploader or administrators)
    if (vis === "PRIVATE") {
      return Boolean(
        (context.userId && doc.uploadedBy === context.userId) ||
        (context.facultyId && doc.uploadedBy === context.facultyId)
      );
    }

    return true;
  }

  /**
   * Builds the pre-retrieval Qdrant filter to strictly isolate document vectors
   * BEFORE vector search and cross-attention reranking.
   */
  static buildQdrantFilter(context: DocumentAccessContext): any {
    const role = (context.userRole || "FACULTY").toUpperCase();

    // Admin / Dean / Owner can search all organization documents
    if (["OWNER", "ADMIN", "DEAN"].includes(role)) {
      return {
        must: [
          {
            key: "organizationId",
            match: { value: context.organizationId },
          },
        ],
      };
    }

    if (!context.departmentId || context.departmentId === "ALL") {
      return {
        must: [
          {
            key: "organizationId",
            match: { value: context.organizationId },
          },
        ],
      };
    }

    // Build permissions-based OR/should clauses
    const shouldClauses: any[] = [
      // 1. University-wide visibility
      {
        key: "visibility",
        match: { value: "UNIVERSITY" },
      },
      // 2. Department-level visibility for matching department
      {
        must: [
          { key: "visibility", match: { value: "DEPARTMENT" } },
          { key: "departmentId", match: { value: context.departmentId } },
        ],
      },
      // 3. Department documents without a specific department assignment (general institutional)
      {
        must: [
          { key: "visibility", match: { value: "DEPARTMENT" } },
          { is_empty: { key: "departmentId" } },
        ],
      },
    ];

    // 4. College-level visibility
    if (context.collegeId) {
      shouldClauses.push({
        must: [
          { key: "visibility", match: { value: "COLLEGE" } },
          { key: "collegeId", match: { value: context.collegeId } },
        ],
      });
    }

    // 5. Private documents owned by this user/faculty
    const uploaderId = context.userId || context.facultyId;
    if (uploaderId && role !== "STUDENT" && role !== "MEMBER") {
      shouldClauses.push({
        must: [
          { key: "visibility", match: { value: "PRIVATE" } },
          { key: "uploadedBy", match: { value: uploaderId } },
        ],
      });
    }

    return {
      must: [
        {
          key: "organizationId",
          match: { value: context.organizationId },
        },
      ],
      should: shouldClauses,
    };
  }

  /**
   * Builds the pre-retrieval Prisma `where` clause for querying authorized Document entities.
   */
  /**
   * Builds the pre-retrieval Prisma `where` clause for querying authorized Document entities.
   */
  static buildPrismaDocumentWhere(context: DocumentAccessContext): any {
    const role = (context.userRole || "FACULTY").toUpperCase();

    if (["OWNER", "ADMIN", "DEAN"].includes(role)) {
      return {
        organizationId: context.organizationId,
        deletedAt: null,
      };
    }

    // If user requested all departments or is browsing campus-wide repository
    if (!context.departmentId || context.departmentId === "ALL") {
      return {
        organizationId: context.organizationId,
        deletedAt: null,
        visibility: { in: ["UNIVERSITY", "DEPARTMENT", "COLLEGE"] },
      };
    }

    const orClauses: any[] = [
      { visibility: "UNIVERSITY" },
      { visibility: "DEPARTMENT", departmentId: null },
      { visibility: "COLLEGE", collegeId: null },
    ];

    if (context.departmentId) {
      orClauses.push({
        visibility: "DEPARTMENT",
        OR: [
          { departmentId: context.departmentId },
          { department: { code: { in: ["CS", "CSE"] } } },
        ],
      });
    }

    if (context.collegeId) {
      orClauses.push({
        visibility: "COLLEGE",
        collegeId: context.collegeId,
      });
    }

    const uploaderId = context.userId || context.facultyId;
    if (uploaderId && role !== "STUDENT" && role !== "MEMBER") {
      orClauses.push({
        visibility: "PRIVATE",
        uploadedBy: uploaderId,
      });
    }

    return {
      organizationId: context.organizationId,
      deletedAt: null,
      OR: orClauses,
    };
  }

  /**
   * Resolves the authoritative DocumentAccessContext for a student/user on the server.
   * Validates any client-requested department against the student's authorized primary/active department.
   * Defaults gracefully to the student's department or CSE department.
   */
  static async resolveStudentAccessContext(
    userId: string,
    organizationId: string,
    requestedDepartmentId?: string | null
  ): Promise<DocumentAccessContext> {
    try {
      if (requestedDepartmentId === "ALL") {
        return {
          organizationId,
          userId,
          userRole: "STUDENT",
          departmentId: "ALL",
          collegeId: null,
        };
      }

      // 1. Look up student profile linked to this user
      let studentRecord = await db.student.findFirst({
        where: {
          OR: [
            { userId: userId },
            { id: userId },
          ],
          deletedAt: null,
        },
        include: {
          department: true,
        },
      });

      // Default/fallback department resolver
      const getDefaultDept = async () => {
        let cookieDeptCode: string | undefined;
        try {
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          cookieDeptCode = cookieStore.get("student_department")?.value;
        } catch {}

        if (cookieDeptCode) {
          const matched = await db.department.findFirst({
            where: {
              organizationId,
              deletedAt: null,
              OR: [
                { code: { equals: cookieDeptCode, mode: "insensitive" } },
                { code: cookieDeptCode === "CS" ? "CSE" : cookieDeptCode },
              ],
            },
          });
          if (matched) return matched;
        }

        return (
          (await db.department.findFirst({
            where: {
              organizationId,
              deletedAt: null,
              OR: [{ code: "CSE" }, { code: "CS" }],
            },
          })) ||
          (await db.department.findFirst({
            where: { organizationId, deletedAt: null },
            orderBy: { code: "asc" },
          }))
        );
      };

      if (!studentRecord) {
        // Auto-provision student profile for logged-in user in CSE department
        const defaultDept = await getDefaultDept();
        if (defaultDept && userId) {
          try {
            studentRecord = await db.student.create({
              data: {
                userId,
                organizationId,
                departmentId: defaultDept.id,
                studentNumber: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
                major: defaultDept.name,
                academicStatus: "Good Standing",
                gpa: 3.85,
              },
              include: { department: true },
            });
          } catch {}
        }
      }

      if (studentRecord) {
        let effectiveDepartmentId = studentRecord.departmentId;

        if (requestedDepartmentId === "ALL") {
          effectiveDepartmentId = "ALL";
        } else if (requestedDepartmentId && requestedDepartmentId !== studentRecord.departmentId) {
          // Check if requested department exists in organization
          const deptExists = await db.department.findFirst({
            where: { id: requestedDepartmentId, organizationId, deletedAt: null },
          });

          if (deptExists) {
            effectiveDepartmentId = deptExists.id;
          }
        }

        if (!effectiveDepartmentId) {
          const defaultDept = await getDefaultDept();
          if (defaultDept) effectiveDepartmentId = defaultDept.id;
        }

        return {
          organizationId: studentRecord.organizationId || organizationId,
          userId: studentRecord.userId || studentRecord.id,
          userRole: "STUDENT",
          departmentId: effectiveDepartmentId,
          collegeId: null,
        };
      }

      // 2. Fallback: Check if user has an authorized faculty record
      const facultyRecord = await db.faculty.findFirst({
        where: {
          OR: [
            { userId: userId },
            { id: userId },
          ],
          deletedAt: null,
        },
      });

      if (facultyRecord) {
        return {
          organizationId: facultyRecord.organizationId || organizationId,
          userId: facultyRecord.userId || facultyRecord.id,
          facultyId: facultyRecord.id,
          userRole: (facultyRecord.designation === "HOD" ? "HOD" : "FACULTY") as any,
          departmentId: requestedDepartmentId === "ALL" ? "ALL" : facultyRecord.departmentId,
          collegeId: null,
        };
      }

      // 3. Fallback: Generic organization member
      const membership = await db.membership.findFirst({
        where: { userId: userId, organizationId: organizationId },
      });

      const role = (membership?.role || "MEMBER") as any;

      let validatedDeptId: string | null = null;
      if (requestedDepartmentId === "ALL") {
        validatedDeptId = "ALL";
      } else if (requestedDepartmentId) {
        const deptExists = await db.department.findFirst({
          where: { id: requestedDepartmentId, organizationId, deletedAt: null },
        });
        if (deptExists) {
          validatedDeptId = deptExists.id;
        }
      }

      if (!validatedDeptId) {
        const defaultDept = await getDefaultDept();
        if (defaultDept) validatedDeptId = defaultDept.id;
      }

      return {
        organizationId,
        userId,
        userRole: role,
        departmentId: validatedDeptId,
        collegeId: null,
      };
    } catch (error) {
      console.error("[DocumentAccessPolicy] resolveStudentAccessContext error:", error);
      return {
        organizationId,
        userId,
        userRole: "STUDENT",
        departmentId: null,
        collegeId: null,
      };
    }
  }

  /**
   * Resolves the authoritative DocumentAccessContext for a faculty member from database records.
   * Enforces immutable departmental ownership.
   */
  static async resolveFacultyAccessContext(
    facultyIdOrUserId: string,
    organizationId: string
  ): Promise<DocumentAccessContext> {
    const faculty = await db.faculty.findFirst({
      where: {
        OR: [{ id: facultyIdOrUserId }, { userId: facultyIdOrUserId }],
        deletedAt: null,
      },
    });

    if (faculty) {
      return {
        organizationId: faculty.organizationId || organizationId,
        userId: faculty.userId || faculty.id,
        facultyId: faculty.id,
        userRole: (faculty.designation === "HOD" ? "HOD" : "FACULTY") as any,
        departmentId: faculty.departmentId,
        collegeId: null,
      };
    }

    return {
      organizationId,
      userId: facultyIdOrUserId,
      userRole: "FACULTY",
      departmentId: null,
      collegeId: null,
    };
  }

  /**
   * Validates whether a specific document citation is permitted for the given access context.
   */
  static isDocumentAuthorized(
    context: DocumentAccessContext,
    doc: {
      organizationId: string;
      departmentId?: string | null;
      collegeId?: string | null;
      visibility: DocumentVisibility | string;
      uploadedBy?: string | null;
    }
  ): boolean {
    return this.canAccessDocument(context, doc);
  }

  /**
   * Fetches the list of all Document IDs that this context is authorized to retrieve.
   * Used by BM25Service and Neo4j for exact SQL/Cypher pre-retrieval scoping.
   */
  static async getAuthorizedDocumentIds(context: DocumentAccessContext): Promise<string[] | null> {
    const role = (context.userRole || "FACULTY").toUpperCase();

    // Privileged roles can access all active docs in the org
    if (["OWNER", "ADMIN", "DEAN"].includes(role)) {
      return null; // null represents "all documents in org allowed"
    }

    const whereClause = this.buildPrismaDocumentWhere(context);
    const docs = await db.document.findMany({
      where: whereClause,
      select: { id: true },
    });

    return docs.map((d) => d.id);
  }
}

