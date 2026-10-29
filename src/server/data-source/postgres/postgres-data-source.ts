import { db } from "@/server/db/prisma";
import { UniversityDataSource } from "../university-data-source";
import { UniversityStudent, StudentAcademicStatus } from "../models/student";
import { UniversityFinance } from "../models/finance";
import { UniversityFaculty } from "../models/faculty";
import { UniversityCourse, UniversityCourseSection } from "../models/course";
import { UniversityResult } from "../models/result";

export class PostgresDataSource implements UniversityDataSource {
  public readonly mode = "postgres";

  public students = {
    findStudentById: async (studentId: string, organizationId: string): Promise<UniversityStudent | null> => {
      const student = await db.student.findFirst({
        where: {
          organizationId,
          deletedAt: null,
          OR: [{ id: studentId }, { studentNumber: studentId }],
        },
        include: { user: true, department: true },
      });

      if (!student) return null;

      let status: StudentAcademicStatus = "GOOD_STANDING";
      if (student.academicStatus === "Academic Probation") status = "PROBATION";
      else if (student.academicStatus === "Suspended") status = "SUSPENDED";

      return {
        id: student.id,
        universityStudentId: student.studentNumber,
        name: student.user?.name || `Student ${student.studentNumber}`,
        email: student.user?.email || "",
        departmentId: student.departmentId,
        departmentCode: student.department?.code || "GEN",
        major: student.major,
        gpa: student.gpa,
        academicStatus: status,
        advisorId: student.advisorId || undefined,
        organizationId: student.organizationId,
      };
    },

    findProbationStudents: async (organizationId: string, gpaThreshold: number): Promise<UniversityStudent[]> => {
      const list = await db.student.findMany({
        where: {
          organizationId,
          deletedAt: null,
          OR: [{ gpa: { lt: gpaThreshold } }, { academicStatus: "Academic Probation" }],
        },
        include: { user: true, department: true },
      });

      return list.map((student) => ({
        id: student.id,
        universityStudentId: student.studentNumber,
        name: student.user?.name || `Student ${student.studentNumber}`,
        email: student.user?.email || "",
        departmentId: student.departmentId,
        departmentCode: student.department?.code || "GEN",
        major: student.major,
        gpa: student.gpa,
        academicStatus: "PROBATION" as StudentAcademicStatus,
        advisorId: student.advisorId || undefined,
        organizationId: student.organizationId,
      }));
    },

    listStudents: async (organizationId: string, departmentCode?: string): Promise<UniversityStudent[]> => {
      const list = await db.student.findMany({
        where: {
          organizationId,
          deletedAt: null,
          ...(departmentCode ? { department: { code: departmentCode } } : {}),
        },
        include: { user: true, department: true },
      });

      return list.map((student) => ({
        id: student.id,
        universityStudentId: student.studentNumber,
        name: student.user?.name || `Student ${student.studentNumber}`,
        email: student.user?.email || "",
        departmentId: student.departmentId,
        departmentCode: student.department?.code || "GEN",
        major: student.major,
        gpa: student.gpa,
        academicStatus: (student.academicStatus === "Academic Probation" ? "PROBATION" : "GOOD_STANDING") as StudentAcademicStatus,
        advisorId: student.advisorId || undefined,
        organizationId: student.organizationId,
      }));
    },
  };

  public finance = {
    getStudentBalance: async (studentId: string, organizationId: string): Promise<UniversityFinance | null> => {
      const fin = await db.financialAccount.findFirst({
        where: {
          organizationId,
          OR: [{ studentId }, { student: { studentNumber: studentId } }],
        },
      });

      if (!fin) return null;

      let status: "PAID" | "PENDING" | "OVERDUE" = "PAID";
      if (fin.status === "Overdue") status = "OVERDUE";
      else if (fin.status === "Pending" || fin.balanceOutstanding > 0) status = "PENDING";

      return {
        id: fin.id,
        studentId: fin.studentId,
        totalBilled: fin.totalBilled,
        totalPaid: fin.totalPaid,
        balanceOutstanding: fin.balanceOutstanding,
        status,
        organizationId: fin.organizationId,
      };
    },

    getOutstandingBalances: async (organizationId: string, limit: number): Promise<UniversityFinance[]> => {
      const list = await db.financialAccount.findMany({
        where: { organizationId, balanceOutstanding: { gt: 0 } },
        take: limit,
      });

      return list.map((fin) => ({
        id: fin.id,
        studentId: fin.studentId,
        totalBilled: fin.totalBilled,
        totalPaid: fin.totalPaid,
        balanceOutstanding: fin.balanceOutstanding,
        status: "PENDING",
        organizationId: fin.organizationId,
      }));
    },
  };

  public faculty = {
    listFaculty: async (organizationId: string, departmentCode?: string): Promise<UniversityFaculty[]> => {
      const list = await db.faculty.findMany({
        where: {
          organizationId,
          deletedAt: null,
          ...(departmentCode ? { department: { code: departmentCode } } : {}),
        },
        include: { user: true, department: true },
      });

      return list.map((f) => ({
        id: f.id,
        name: f.user?.name || f.facultyCode || "Faculty Member",
        email: f.user?.email || "",
        departmentId: f.departmentId,
        departmentCode: f.department?.code || "GEN",
        title: f.title || "Faculty",
        officeRoom: f.officeRoom || undefined,
        organizationId: f.organizationId,
      }));
    },
  };

  public courses = {
    listCourses: async (organizationId: string, departmentCode?: string): Promise<UniversityCourse[]> => {
      const list = await db.course.findMany({
        where: {
          organizationId,
          deletedAt: null,
          ...(departmentCode ? { department: { code: departmentCode } } : {}),
        },
        include: { department: true },
      });

      return list.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        credits: c.credits,
        departmentId: c.departmentId,
        departmentCode: c.department?.code || "GEN",
        organizationId: c.organizationId,
      }));
    },

    getCourseSections: async (organizationId: string): Promise<UniversityCourseSection[]> => {
      const list = await db.courseSection.findMany({
        where: { organizationId, deletedAt: null },
      });

      return list.map((cs) => ({
        id: cs.id,
        courseId: cs.courseId,
        sectionCode: cs.sectionCode,
        term: cs.term,
        facultyId: cs.facultyId || undefined,
        room: cs.room || undefined,
        capacity: cs.capacity,
        organizationId: cs.organizationId,
      }));
    },
  };

  public results = {
    getStudentResults: async (studentId: string, organizationId: string): Promise<UniversityResult[]> => {
      const list = await db.semesterResult.findMany({
        where: {
          organizationId,
          OR: [{ studentId }, { student: { studentNumber: studentId } }],
        },
      });

      return list.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        term: r.term,
        sgpa: r.sgpa,
        cgpa: r.cgpa,
        backlogsCount: r.backlogsCount,
        totalCredits: r.totalCredits,
        organizationId: r.organizationId,
      }));
    },
  };
}
