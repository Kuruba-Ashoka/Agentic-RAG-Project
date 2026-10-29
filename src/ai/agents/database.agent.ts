import { GraphState } from "../graph/state";
import { StudentRepository } from "@/server/repositories/student.repository";
import { FacultyRepository } from "@/server/repositories/faculty.repository";
import { CourseRepository } from "@/server/repositories/course.repository";
import { FinancialRepository } from "@/server/repositories/financial.repository";
import { StudentOperationsService } from "@/server/services/student-operations.service";
import { StudentRiskPredictor } from "@/ai/decision/student-risk-predictor";
import { StudentRecommender } from "@/ai/decision/student-recommender";
import { StageTimer } from "@/ai/instrumentation/stage-timer";
import { getMessageText } from "@/lib/utils";
import { AcademicAnalyticsRepository } from "@/server/repositories/academic-analytics.repository";

/**
 * Database Agent Node: Connects directly to Smart University Data Repositories
 * & Student Operations Intelligence Subsystem.
 */
export async function databaseAgent(state: typeof GraphState.State) {
  const stageStart = StageTimer.start("databaseNode");
  const cacheHit = false;
  let errorOccurred = false;

  try {
    const { organizationId, messages, plan } = state;
    const latestMessage = messages[messages.length - 1];

    if (!organizationId || !latestMessage) {
      const { durationMs } = StageTimer.end("databaseNode", stageStart, {
        organizationId: state.organizationId,
        userId: state.userId,
        cacheHit,
      });
      return { databaseContext: [], timings: { databaseNode: durationMs } };
    }

    let queryText = getMessageText(latestMessage).toLowerCase();
    if (plan && plan.subTasks && plan.subTasks[plan.currentStepIndex]) {
      queryText = plan.subTasks[plan.currentStepIndex].query.toLowerCase();
    }

    console.log(`[DatabaseAgent] Executing University Data Repository query for: "${queryText}"`);

    const recordsPayload: Array<{ toolName: string; records: any }> = [];

    let queryMatched = false;

    // a) Exam eligibility detection
    if (/\b(exam|eligib|ineligib|hall ticket|exam registration)\b/i.test(queryText)) {
      const ineligibleStudents = await StudentOperationsService.getAllProbationStudents(organizationId);
      recordsPayload.push({
        toolName: "ProbationStudentsQuery",
        records: ineligibleStudents.map((s: any) => ({
          studentId: s.studentId || s.id || s.studentNumber,
          name: s.name || s.user?.name,
          academicStatus: (s as any).academicStatus,

        })),
      });
      queryMatched = true;
    }
    // b) Course performance detection
    else if (/\b(course.*(?:fail|performance|success|pass rate)|failure rate|highest fail)\b/i.test(queryText)) {
      const performance = await AcademicAnalyticsRepository.getCoursePerformance(organizationId);
      performance.sort((a: any, b: any) => b.failureRate - a.failureRate);
      recordsPayload.push({
        toolName: "CoursePerformanceQuery",
        records: performance,
      });
      queryMatched = true;
    }
    // c) Department analytics detection
    else if (/\b(department.*(?:analytic|stat|overview|enrollment)|enrollment.*stat)\b/i.test(queryText)) {
      const stats = await AcademicAnalyticsRepository.getDepartmentEnrollmentStats(organizationId);
      recordsPayload.push({
        toolName: "DepartmentAnalyticsQuery",
        records: stats,
      });
      queryMatched = true;
    }
    // d) Attendance overview detection
    else if (/\b(attendance.*(?:overview|summary|report|department)|who.*below.*(?:75|threshold|attendance))\b/i.test(queryText)) {
      const overview = await AcademicAnalyticsRepository.getAttendanceOverview(organizationId);
      recordsPayload.push({
        toolName: "AttendanceOverviewQuery",
        records: overview,
      });
      queryMatched = true;
    }
    // e) Semester results detection
    else if (/\b(semester.*result|pass rate|backlog.*count|gpa.*distribution)\b/i.test(queryText)) {
      const summary = await AcademicAnalyticsRepository.getSemesterResultsSummary(organizationId);
      recordsPayload.push({
        toolName: "SemesterResultsQuery",
        records: summary,
      });
      queryMatched = true;
    }
    // f) Department-filtered student detection
    else if (/\b(cs|cse|it|ece|ee|me|ce|bba|mba|math|phys|chem)\b/i.test(queryText) && /\b(student|backlogs?)\b/i.test(queryText)) {
      const deptMatch = queryText.match(/\b(cs|cse|it|ece|ee|me|ce|bba|mba|math|phys|chem)\b/i);
      const deptCode = deptMatch ? deptMatch[1].toUpperCase() : "";
      const students = await StudentOperationsService.getStudentsByDepartment(organizationId, deptCode);
      recordsPayload.push({
        toolName: "StudentsByDepartmentQuery",
        records: students.map((s: any) => ({
          ...s,
          riskAssessment: StudentRiskPredictor.predictRisk(s)
        }))
      });
      queryMatched = true;
    }

    if (!queryMatched) {
    // Query 1: Student Operations Intelligence & Specific Student Lookup
    const studentMatch = queryText.match(/\b(alice|bob|carol|dan|eva|frank|stu\d{4})\b/i);
    if (studentMatch || queryText.includes("risk") || queryText.includes("attendance") || queryText.includes("recommend")) {
      const targetIdentifier = studentMatch ? studentMatch[1] : "alice";
      const studentProfile = await StudentOperationsService.getStudentFullProfile(targetIdentifier, organizationId);
      
      if (studentProfile) {
        const riskAssessment = StudentRiskPredictor.predictRisk(studentProfile);
        const recommendations = StudentRecommender.recommendActions(riskAssessment);

        recordsPayload.push({
          toolName: "StudentOperationsIntelligenceQuery",
          records: {
            profile: {
              studentNumber: studentProfile.studentNumber,
              name: studentProfile.user?.name,
              email: studentProfile.user?.email,
              major: studentProfile.major,
              gpa: studentProfile.gpa,
              academicStatus: studentProfile.academicStatus,
              department: studentProfile.department.code,
              advisor: studentProfile.advisor?.user?.name || "Unassigned",
              hostel: studentProfile.hostelRecord ? `${studentProfile.hostelRecord.hostelName} ${studentProfile.hostelRecord.roomNumber}` : "Day Scholar",
              scholarship: studentProfile.scholarshipRecord?.scholarshipName || "None",
            },
            riskAssessment,
            recommendations,
          },
        });
      }
    }

    // Query 2: Academic Status & Probation Roster
    if (queryText.includes("probation") || queryText.includes("gpa") || queryText.includes("failing") || queryText.includes("student")) {
      const probationStudents = await StudentRepository.findProbationStudents(organizationId, 2.0);
      recordsPayload.push({
        toolName: "AcademicProbationQuery",
        records: probationStudents.map((s) => ({
          studentId: s.id,
          name: s.user?.name || "Student",
          email: s.user?.email || "N/A",
          gpa: s.gpa,
          department: s.department.code,
          academicStatus: s.academicStatus,
        })),
      });
    }

    // Query 3: Financial Accounts & Tuition Ledgers
    if (queryText.includes("tuition") || queryText.includes("balance") || queryText.includes("unpaid") || queryText.includes("financial") || queryText.includes("billing")) {
      const topBalances = await FinancialRepository.findOutstandingBalances(organizationId, 10);
      const summary = await FinancialRepository.getFinancialSummary(organizationId);

      recordsPayload.push({
        toolName: "FinancialLedgerQuery",
        records: {
          summary,
          topOutstandingAccounts: topBalances.map((b) => ({
            studentName: b.student.user?.name || "Student",
            balanceOutstanding: b.balanceOutstanding,
            totalBilled: b.totalBilled,
            status: b.status,
          })),
        },
      });
    }

    // Query 4: Faculty Workload
    if (queryText.includes("faculty") || queryText.includes("professor") || queryText.includes("teach") || queryText.includes("workload")) {
      const loads = await FacultyRepository.findTeachingLoads(organizationId);
      recordsPayload.push({
        toolName: "FacultyWorkloadQuery",
        records: loads,
      });
    }

    // Default fallback
    if (recordsPayload.length === 0) {
      const students = await StudentRepository.findByOrganization(organizationId, 5);
      recordsPayload.push({
        toolName: "UniversityOverviewQuery",
        records: students.map((s) => ({
          studentNumber: s.studentNumber,
          major: s.major,
          gpa: s.gpa,
        })),
      });
    }
    } // End of if (!queryMatched)

    const { durationMs } = StageTimer.end("databaseNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    });
    return { databaseContext: recordsPayload, timings: { databaseNode: durationMs } };
  } catch (error) {
    errorOccurred = true;
    console.error("[DatabaseAgent] University Database Query failed:", error);
    const { durationMs } = StageTimer.end("databaseNode", stageStart, {
      organizationId: state.organizationId,
      userId: state.userId,
      cacheHit,
    }, true);
    return { databaseContext: [], timings: { databaseNode: durationMs } };
  }
}
