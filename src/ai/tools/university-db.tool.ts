import { z } from "zod";
import { db } from "@/server/db/prisma";
import { StudentRepository } from "@/server/repositories/student.repository";
import { FacultyRepository } from "@/server/repositories/faculty.repository";
import { CourseRepository } from "@/server/repositories/course.repository";
import { FinancialRepository } from "@/server/repositories/financial.repository";
import { StudentOperationsService } from "@/server/services/student-operations.service";
import { AcademicAnalyticsRepository } from "@/server/repositories/academic-analytics.repository";
import { AcademicDecisionEngine } from "@/ai/decision/academic-decision-engine";

export const UniversityDatabaseToolSchema = z.object({
  operation: z.enum([
    "degree_audit",
    "prerequisite_check",
    "probation_students",
    "financial_ledger",
    "course_catalog",
    "student_list",
    "exam_results",
    "course_performance",
    "department_analytics",
    "semester_results",
  ]),
  organizationId: z.string().min(1, "Organization ID is required"),
  gpaThreshold: z.number().optional().default(2.0),
  limit: z.number().optional().default(10),
  departmentCode: z.string().optional(),
  examinationId: z.string().optional(),
  studentId: z.string().optional(),
  targetCourseCode: z.string().optional(),
});

export type UniversityDatabaseToolInput = z.infer<typeof UniversityDatabaseToolSchema>;

export class UniversityDatabaseTool {
  static readonly toolName = "university_database_query";
  static readonly description =
    "Queries structured relational data for university operations: student academic standing, degree audits, course catalogs, and academic analytics.";
  static readonly schema = UniversityDatabaseToolSchema;

  static async execute(input: UniversityDatabaseToolInput) {
    const validated = UniversityDatabaseToolSchema.parse(input);
    const { operation, organizationId, gpaThreshold, limit, departmentCode, studentId } = validated;

    try {
      switch (operation) {
        case "degree_audit": {
          if (!studentId) {
            return {
              success: false,
              operation,
              error: "studentId is required for degree_audit operation",
            };
          }
          const audit = await StudentOperationsService.auditStudentDegree(studentId, organizationId);
          return {
            success: true,
            operation,
            records: audit ? [audit] : [],
          };
        }

        case "prerequisite_check": {
          const target = validated.targetCourseCode || "CS401";
          if (!studentId) {
            return {
              success: false,
              operation,
              error: "studentId is required for prerequisite_check operation",
            };
          }
          const student = await StudentOperationsService.getStudentFullProfile(studentId, organizationId);
          const completedMap = new Map<string, string>();
          for (const e of student?.enrolments || []) {
            const code = e.courseSection?.course?.code;
            if (code && e.grade) {
              completedMap.set(code.toUpperCase(), e.grade);
            }
          }
          const prereqs = target.toUpperCase() === "CS401" ? ["CS201", "CS301"] : ["CS101"];
          const result = AcademicDecisionEngine.verifyPrerequisites(studentId, target, prereqs, completedMap);
          return {
            success: true,
            operation,
            records: [result],
          };
        }

        case "exam_results": {
          const results = await db.semesterResult.findMany({
            where: {
              student: { organizationId },
              ...(studentId ? { studentId } : {}),
            },
            include: {
              student: { include: { user: true, department: true } },
            },
            orderBy: { createdAt: "desc" },
            take: limit || 20,
          });

          return {
            success: true,
            operation,
            records: results.map((r) => ({
              id: r.id,
              studentName: r.student.user?.name || "Student",
              studentNumber: r.student.studentNumber,
              term: r.term,
              sgpa: r.sgpa,
              cgpa: r.cgpa,
              backlogsCount: r.backlogsCount,
              totalCredits: r.totalCredits,
            })),
          };
        }

        case "probation_students": {
          const records = await StudentRepository.findProbationStudents(organizationId, gpaThreshold);
          return {
            success: true,
            operation,
            records: records.map((s) => ({
              studentId: s.id,
              name: s.user?.name || "Student",
              email: s.user?.email || "N/A",
              gpa: s.gpa,
              department: s.department.code,
              academicStatus: s.academicStatus,
            })),
          };
        }

        case "financial_ledger": {
          const topBalances = await FinancialRepository.findOutstandingBalances(organizationId, limit);
          const summary = await FinancialRepository.getFinancialSummary(organizationId);
          return {
            success: true,
            operation,
            summary,
            records: topBalances.map((b) => ({
              studentName: b.student.user?.name || "Student",
              balanceOutstanding: b.balanceOutstanding,
              totalBilled: b.totalBilled,
              status: b.status,
            })),
          };
        }

        case "course_catalog": {
          const courses = await CourseRepository.findByOrganization(organizationId);
          return {
            success: true,
            operation,
            records: courses.map((c) => ({
              code: c.code,
              title: c.title,
              credits: c.credits,
              department: c.department.code,
              sectionsCount: c.sections.length,
            })),
          };
        }

        case "course_performance": {
          const records = await AcademicAnalyticsRepository.getCoursePerformance(organizationId);
          return {
            success: true,
            operation,
            records,
          };
        }

        case "department_analytics": {
          const enrollmentStats = await AcademicAnalyticsRepository.getDepartmentEnrollmentStats(organizationId);
          const attendanceOverview = await AcademicAnalyticsRepository.getAttendanceOverview(organizationId);
          return {
            success: true,
            operation,
            records: { enrollmentStats, attendanceOverview },
          };
        }

        case "semester_results": {
          const records = await AcademicAnalyticsRepository.getSemesterResultsSummary(organizationId);
          return {
            success: true,
            operation,
            records,
          };
        }

        case "student_list":
        default: {
          const students = await StudentRepository.findByOrganization(organizationId, limit);
          return {
            success: true,
            operation,
            records: students.map((s) => ({
              studentNumber: s.studentNumber,
              major: s.major,
              gpa: s.gpa,
              department: s.department.code,
            })),
          };
        }
      }
    } catch (error: any) {
      console.error(`[UniversityDatabaseTool] Execution error for operation '${operation}':`, error);
      return {
        success: false,
        operation,
        error: error.message || "Database query execution failed",
        records: [],
      };
    }
  }
}
