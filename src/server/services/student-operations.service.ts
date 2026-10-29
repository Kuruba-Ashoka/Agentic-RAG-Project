import { db } from "@/server/db/prisma";
import { AcademicDecisionEngine } from "@/ai/decision/academic-decision-engine";

export class StudentOperationsService {
  public static async getStudentFullProfile(identifier: string, organizationId: string) {
    try {
      const student = await db.student.findFirst({
        where: {
          organizationId,
          OR: [
            { id: identifier },
            { studentNumber: identifier },
            { user: { email: { contains: identifier, mode: "insensitive" } } },
            { user: { name: { contains: identifier, mode: "insensitive" } } },
          ],
        },
        include: {
          user: true,
          department: true,
          advisor: {
            include: { user: true },
          },
          internalMarks: true,
          semesterResults: {
            orderBy: { createdAt: "desc" },
          },
          hostelRecord: true,
          scholarshipRecord: true,
          parentInfo: true,
          financialAccounts: true,
          enrolments: {
            include: {
              courseSection: {
                include: {
                  course: true,
                },
              },
            },
          },
        },
      });

      return student;
    } catch (error) {
      console.error("[StudentOperationsService] Error fetching student profile:", error);
      return null;
    }
  }

  public static async getAllProbationStudents(organizationId: string) {
    try {
      return await db.student.findMany({
        where: {
          organizationId,
          academicStatus: "Academic Probation",
        },
        include: {
          user: true,
          department: true,
          scholarshipRecord: true,
          semesterResults: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    } catch (error) {
      console.error("[StudentOperationsService] Error fetching probation students:", error);
      return [];
    }
  }

  /**
   * Performs a deterministic degree audit for a specific student.
   */
  public static async auditStudentDegree(identifier: string, organizationId: string) {
    const student = await this.getStudentFullProfile(identifier, organizationId);
    if (!student) return null;

    const enrolments = (student.enrolments || []).map((e: any) => ({
      courseCode: e.courseSection?.course?.code || "UNKNOWN",
      credits: e.courseSection?.course?.credits || 3,
      grade: e.grade,
      status: e.status,
      isCore: true,
    }));

    const latestResult = student.semesterResults?.[0];
    const cgpa = latestResult?.cgpa || student.gpa || 0.0;
    const backlogs = latestResult?.backlogsCount || 0;

    return AcademicDecisionEngine.auditDegreeCredits(
      student.id,
      student.studentNumber,
      enrolments,
      cgpa,
      backlogs
    );
  }

  /**
   * Returns students filtered by department with full profiles.
   */
  public static async getStudentsByDepartment(organizationId: string, departmentCode: string) {
    return db.student.findMany({
      where: {
        organizationId,
        deletedAt: null,
        department: { code: departmentCode.toUpperCase() },
      },
      include: {
        user: true,
        department: true,
        internalMarks: true,
        semesterResults: { orderBy: { createdAt: "desc" } },
        financialAccounts: true,
      },
    });
  }
}
