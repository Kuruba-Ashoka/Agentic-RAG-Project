import { UniversityDataSource } from "../university-data-source";
import { UniversityStudent } from "../models/student";
import { UniversityFinance } from "../models/finance";
import { UniversityFaculty } from "../models/faculty";
import { UniversityCourse, UniversityCourseSection } from "../models/course";

export class DemoDataSource implements UniversityDataSource {
  public readonly mode = "demo";

  private mockStudents: UniversityStudent[] = [
    {
      id: "stu_001",
      universityStudentId: "STU-DEMO-00101",
      name: "Ananya Sharma",
      email: "ananya@demo.edu",
      departmentId: "dept_cs",
      departmentCode: "CSE",
      major: "Computer Science",
      gpa: 3.85,
      academicStatus: "GOOD_STANDING",
      organizationId: "org_demo",
    },
    {
      id: "stu_002",
      universityStudentId: "STU-DEMO-00102",
      name: "Vikram Singh",
      email: "vikram@demo.edu",
      departmentId: "dept_cs",
      departmentCode: "CSE",
      major: "Computer Science",
      gpa: 3.10,
      academicStatus: "GOOD_STANDING",
      organizationId: "org_demo",
    },
    {
      id: "stu_003",
      universityStudentId: "STU-DEMO-00125",
      name: "Rahul Kumar",
      email: "rahul@demo.edu",
      departmentId: "dept_cs",
      departmentCode: "CSE",
      major: "Computer Science",
      gpa: 2.40,
      academicStatus: "GOOD_STANDING",
      organizationId: "org_demo",
    },
    {
      id: "stu_004",
      universityStudentId: "STU-DEMO-00104",
      name: "Priya Patel",
      email: "priya@demo.edu",
      departmentId: "dept_ee",
      departmentCode: "ECE",
      major: "Electrical Engineering",
      gpa: 3.50,
      academicStatus: "GOOD_STANDING",
      organizationId: "org_demo",
    },
    {
      id: "stu_005",
      universityStudentId: "STU-DEMO-00105",
      name: "Karan Mehta",
      email: "karan@demo.edu",
      departmentId: "dept_cs",
      departmentCode: "CSE",
      major: "Computer Science",
      gpa: 1.85,
      academicStatus: "PROBATION",
      organizationId: "org_demo",
    },
  ];

  private mockFaculty: UniversityFaculty[] = [
    {
      id: "fac_001",
      facultyCode: "FAC-CS-001",
      name: "Dr. Arvind Rao",
      email: "arvind@demo.edu",
      departmentId: "dept_cs",
      departmentCode: "CSE",
      title: "Professor & HOD",
      organizationId: "org_demo",
    },
    {
      id: "fac_002",
      facultyCode: "FAC-CS-002",
      name: "Prof. Sneha Verma",
      email: "sneha@demo.edu",
      departmentId: "dept_cs",
      departmentCode: "CSE",
      title: "Associate Professor",
      organizationId: "org_demo",
    },
    {
      id: "fac_003",
      facultyCode: "FAC-EE-001",
      name: "Dr. Rajesh Iyer",
      email: "rajesh@demo.edu",
      departmentId: "dept_ee",
      departmentCode: "ECE",
      title: "Assistant Professor",
      organizationId: "org_demo",
    },
  ];

  public students = {
    findStudentById: async (studentId: string) =>
      this.mockStudents.find((s) => s.id === studentId || s.universityStudentId === studentId) || null,
    findProbationStudents: async () => this.mockStudents.filter((s) => s.academicStatus === "PROBATION" || s.gpa < 2.0),
    listStudents: async (orgId?: string, deptCode?: string) =>
      deptCode ? this.mockStudents.filter((s) => s.departmentCode === deptCode) : this.mockStudents,
  };

  public finance = {
    getStudentBalance: async (studentId: string): Promise<UniversityFinance | null> => {
      const isRahul = studentId === "stu_003" || studentId === "STU-DEMO-00125";
      const isPriya = studentId === "stu_004" || studentId === "STU-DEMO-00104";

      const balanceOutstanding = isRahul ? 5000 : isPriya ? 1200 : 0;
      const status: "PAID" | "PENDING" | "OVERDUE" = balanceOutstanding > 0 ? "PENDING" : "PAID";

      return {
        id: `fin_${studentId}`,
        studentId,
        totalBilled: 12000,
        totalPaid: 12000 - balanceOutstanding,
        balanceOutstanding,
        status,
        organizationId: "org_demo",
      };
    },
    getOutstandingBalances: async (orgId: string, limit: number): Promise<UniversityFinance[]> => {
      const list: UniversityFinance[] = [];
      for (const s of this.mockStudents) {
        const fin = await this.finance.getStudentBalance(s.id);
        if (fin && fin.balanceOutstanding > 0) {
          list.push(fin);
        }
      }
      return list.slice(0, limit);
    },
  };

  public faculty = {
    listFaculty: async (orgId?: string, deptCode?: string): Promise<UniversityFaculty[]> =>
      deptCode ? this.mockFaculty.filter((f) => f.departmentCode === deptCode) : this.mockFaculty,
  };

  public courses = {
    listCourses: async (): Promise<UniversityCourse[]> => [
      {
        id: "crs_cse101",
        code: "CSE101",
        title: "Introduction to Computer Science",
        departmentId: "dept_cs",
        departmentCode: "CSE",
        credits: 4,
        organizationId: "org_demo",
      },
      {
        id: "crs_cse204",
        code: "CSE204",
        title: "Data Structures & Algorithms",
        departmentId: "dept_cs",
        departmentCode: "CSE",
        credits: 4,
        organizationId: "org_demo",
      },
    ],
    getCourseSections: async (): Promise<UniversityCourseSection[]> => [],
  };

  public results = {
    getStudentResults: async () => [],
  };
}
