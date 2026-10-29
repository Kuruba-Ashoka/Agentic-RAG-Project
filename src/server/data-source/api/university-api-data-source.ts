import { UniversityDataSource } from "../university-data-source";
import { UniversityStudent } from "../models/student";
import { UniversityFinance } from "../models/finance";

export class ApiDataSource implements UniversityDataSource {
  public readonly mode = "api";

  public students = {
    findStudentById: async (studentId: string, organizationId: string): Promise<UniversityStudent | null> => {
      return {
        id: studentId,
        universityStudentId: `SIS_${studentId.substring(0, 6)}`,
        name: "External SIS Student",
        email: "sis.user@university.edu",
        departmentId: "dept_external",
        departmentCode: "SIS",
        major: "Software Engineering",
        gpa: 3.50,
        academicStatus: "GOOD_STANDING",
        organizationId,
      };
    },
    findProbationStudents: async (): Promise<UniversityStudent[]> => [],
    listStudents: async (): Promise<UniversityStudent[]> => [],
  };

  public finance = {
    getStudentBalance: async (studentId: string, organizationId: string): Promise<UniversityFinance | null> => ({
      id: `fin_api_${studentId}`,
      studentId,
      totalBilled: 15000,
      totalPaid: 15000,
      balanceOutstanding: 0,
      status: "PAID",
      organizationId,
    }),
    getOutstandingBalances: async () => [],
  };

  public faculty = { listFaculty: async () => [] };
  public courses = { listCourses: async () => [], getCourseSections: async () => [] };
  public results = { getStudentResults: async () => [] };
}
