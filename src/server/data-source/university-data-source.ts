import { UniversityStudent } from "./models/student";
import { UniversityFaculty } from "./models/faculty";
import { UniversityCourse, UniversityCourseSection } from "./models/course";
import { UniversityFinance } from "./models/finance";
import { UniversityResult } from "./models/result";

export interface StudentDataRepository {
  findStudentById(studentId: string, organizationId: string): Promise<UniversityStudent | null>;
  findProbationStudents(organizationId: string, gpaThreshold: number): Promise<UniversityStudent[]>;
  listStudents(organizationId: string, departmentCode?: string): Promise<UniversityStudent[]>;
}

export interface FinanceDataRepository {
  getStudentBalance(studentId: string, organizationId: string): Promise<UniversityFinance | null>;
  getOutstandingBalances(organizationId: string, limit: number): Promise<UniversityFinance[]>;
}

export interface FacultyDataRepository {
  listFaculty(organizationId: string, departmentCode?: string): Promise<UniversityFaculty[]>;
}

export interface CourseDataRepository {
  listCourses(organizationId: string, departmentCode?: string): Promise<UniversityCourse[]>;
  getCourseSections(organizationId: string): Promise<UniversityCourseSection[]>;
}

export interface ResultsDataRepository {
  getStudentResults(studentId: string, organizationId: string): Promise<UniversityResult[]>;
}

export interface UniversityDataSource {
  readonly mode: "demo" | "postgres" | "api";
  students: StudentDataRepository;
  finance: FinanceDataRepository;
  faculty: FacultyDataRepository;
  courses: CourseDataRepository;
  results: ResultsDataRepository;
}
