import { db } from "@/server/db/prisma";

export type DocumentCategoryType =
  | "LECTURE_NOTES"
  | "SYLLABUS"
  | "LAB_MANUAL"
  | "EXAM_PAPER"
  | "CIRCULAR"
  | "GENERAL_ACADEMIC";

export interface CategoryMetadata {
  category: DocumentCategoryType;
  label: string;
  shortLabel: string;
  badgeClass: string;
  iconName: string;
  description: string;
}

export interface FacultyAttribution {
  id: string;
  name: string;
  title?: string | null;
  designation?: string | null;
  departmentCode?: string | null;
  departmentName?: string | null;
  email?: string | null;
  formattedAttribution: string;
}

export interface EnrolledCourseSummary {
  id: string;
  code: string;
  title: string;
}

export interface CourseRelevance {
  isRelevant: boolean;
  matchedCode?: string;
  matchedCourseName?: string;
}

export const CATEGORY_DEFINITIONS: Record<DocumentCategoryType, CategoryMetadata> = {
  LECTURE_NOTES: {
    category: "LECTURE_NOTES",
    label: "Lecture Notes & Slides",
    shortLabel: "Notes",
    iconName: "BookOpen",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    description: "Course lectures, slide presentations, handouts, and chapter summaries",
  },
  SYLLABUS: {
    category: "SYLLABUS",
    label: "Syllabus & Curriculum",
    shortLabel: "Syllabus",
    iconName: "GraduationCap",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    description: "Official course curriculum, syllabus structure, and academic regulations",
  },
  LAB_MANUAL: {
    category: "LAB_MANUAL",
    label: "Lab Manual & Practicals",
    shortLabel: "Lab Manual",
    iconName: "FlaskConical",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    description: "Practical experiment guides, code workbench exercises, and viva material",
  },
  EXAM_PAPER: {
    category: "EXAM_PAPER",
    label: "Exam Papers & PYQs",
    shortLabel: "Exams & PYQ",
    iconName: "FileQuestion",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    description: "Previous year question papers, mid-term tests, model questions, and answer keys",
  },
  CIRCULAR: {
    category: "CIRCULAR",
    label: "Official Circular & Notice",
    shortLabel: "Circular",
    iconName: "Bell",
    badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    description: "Administrative announcements, academic calendars, timetables, and university notices",
  },
  GENERAL_ACADEMIC: {
    category: "GENERAL_ACADEMIC",
    label: "Academic Resource",
    shortLabel: "Resource",
    iconName: "FileText",
    badgeClass: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    description: "General reference texts, project reports, and supplementary department materials",
  },
};

/**
 * Detects document category using academic heuristic patterns on filename and knowledge base title.
 */
export function detectDocumentCategory(
  fileName: string,
  kbName?: string | null
): CategoryMetadata {
  // Replace underscores, hyphens, dots, and separators with spaces so regex word boundaries (\b) match cleanly
  const normalized = `${fileName} ${kbName || ""}`
    .replace(/[._\-–—/\\()[\]{}]/g, " ")
    .toLowerCase();

  // 1. Syllabus & Curriculum patterns (highest specificity for regulatory documents)
  if (
    /\b(syllabus|curriculum|course[\s_-]?structure|regulations?|scheme|r20|r23|r19|r18|course[\s_-]?outline|academic[\s_-]?plan)\b/i.test(
      normalized
    )
  ) {
    return CATEGORY_DEFINITIONS.SYLLABUS;
  }

  // 2. Lab Manuals & Experiments
  if (
    /\b(lab[\s_-]?manual|practical|experiment[s]?|laboratory|workbench|lab[\s_-]?guide|viva[\s_-]?voce|viva[\s_-]?questions|code[\s_-]?manual|observation[\s_-]?book)\b/i.test(
      normalized
    )
  ) {
    return CATEGORY_DEFINITIONS.LAB_MANUAL;
  }

  // 3. Circulars, Notices, Schedules & Announcements (evaluated before exams so exam timetables/notices are classified as circulars)
  if (
    /\b(circular|notice|notification|announcement|schedule|time[\s_-]?table|academic[\s_-]?calendar|fee[\s_-]?structure|holiday|postponement|hall[\s_-]?ticket|admit[\s_-]?card)\b/i.test(
      normalized
    )
  ) {
    return CATEGORY_DEFINITIONS.CIRCULAR;
  }

  // 4. Exam Papers, Mid-Terms & PYQs
  if (
    /\b(exam|examination|question[\s_-]?paper|pyq|previous[\s_-]?year|model[\s_-]?paper|sample[\s_-]?paper|mid[\s_-]?term|mid[\s_-]?[12]|end[\s_-]?sem|quiz|test[\s_-]?paper|assignment|assessment|solution[\s_-]?key)\b/i.test(
      normalized
    )
  ) {
    return CATEGORY_DEFINITIONS.EXAM_PAPER;
  }

  // 5. Lecture Notes & Presentations
  if (
    /\b(lecture|notes|unit[\s_-]?[1-5]|module[\s_-]?[1-5]|slide[s]?|presentation|ppt[x]?|chapter[\s_-]?[0-9]+|handout|study[\s_-]?material|class[\s_-]?notes|tutorial)\b/i.test(
      normalized
    )
  ) {
    return CATEGORY_DEFINITIONS.LECTURE_NOTES;
  }

  // 6. Sensible fallback for unclassified documents
  return CATEGORY_DEFINITIONS.GENERAL_ACADEMIC;
}

/**
 * Checks if a document belongs to one of the student's actively enrolled courses.
 */
export function matchCourseRelevance(
  fileName: string,
  kbName: string | null | undefined,
  enrolledCourses: EnrolledCourseSummary[]
): CourseRelevance {
  if (!enrolledCourses || enrolledCourses.length === 0) {
    return { isRelevant: false };
  }

  const combined = `${fileName} ${kbName || ""}`.toLowerCase();

  for (const course of enrolledCourses) {
    // 1. Check exact course code e.g. "CS301", "CS 301", "CS-301"
    const cleanCode = course.code.trim().toLowerCase();
    const spacedCode = cleanCode.replace(/([a-z]+)(\d+)/, "$1 $2");
    const hyphenCode = cleanCode.replace(/([a-z]+)(\d+)/, "$1-$2");

    if (
      combined.includes(cleanCode) ||
      combined.includes(spacedCode) ||
      combined.includes(hyphenCode)
    ) {
      return {
        isRelevant: true,
        matchedCode: course.code,
        matchedCourseName: course.title,
      };
    }

    // 2. Check course title tokens (ignoring stop words) if course title is substantial
    const courseTokens = course.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 3 && !["introduction", "fundamentals", "engineering", "science", "applied", "advanced"].includes(t));

    if (courseTokens.length >= 2) {
      const matchAllTokens = courseTokens.every((token) => combined.includes(token));
      if (matchAllTokens) {
        return {
          isRelevant: true,
          matchedCode: course.code,
          matchedCourseName: course.title,
        };
      }
    }
  }

  return { isRelevant: false };
}

/**
 * Resolves faculty attribution for a collection of uploader IDs.
 * Correctly handles both Faculty.id and User.id references without ambiguous joins.
 */
export async function resolveFacultyAttributions(
  uploaderIds: Array<string | null | undefined>
): Promise<Map<string, FacultyAttribution>> {
  const result = new Map<string, FacultyAttribution>();
  const cleanIds = Array.from(new Set(uploaderIds.filter((id): id is string => Boolean(id && id.trim()))));

  if (cleanIds.length === 0) {
    return result;
  }

  try {
    // 1. Look up Faculty records where ID matches OR linked userId matches
    const faculties = await db.faculty.findMany({
      where: {
        OR: [{ id: { in: cleanIds } }, { userId: { in: cleanIds } }],
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    const matchedFacultyIds = new Set<string>();
    const matchedUserIds = new Set<string>();

    for (const faculty of faculties) {
      const name = faculty.user?.name || faculty.title || "Academic Faculty";
      const titlePrefix = faculty.title && !name.startsWith(faculty.title) ? `${faculty.title} ` : "";
      const deptCode = faculty.department?.code;
      const designation = faculty.designation || "Faculty Member";

      const formattedAttribution = deptCode
        ? `${titlePrefix}${name} • ${designation} (${deptCode})`
        : `${titlePrefix}${name} • ${designation}`;

      const attribution: FacultyAttribution = {
        id: faculty.id,
        name: `${titlePrefix}${name}`.trim(),
        title: faculty.title,
        designation: faculty.designation,
        departmentCode: faculty.department?.code,
        departmentName: faculty.department?.name,
        email: faculty.user?.email,
        formattedAttribution,
      };

      // Map to both faculty.id and faculty.userId for infallible O(1) lookup
      result.set(faculty.id, attribution);
      matchedFacultyIds.add(faculty.id);

      if (faculty.userId) {
        result.set(faculty.userId, attribution);
        matchedUserIds.add(faculty.userId);
      }
    }

    // 2. For any remaining IDs not in Faculty table, check the User table
    const remainingIds = cleanIds.filter(
      (id) => !matchedFacultyIds.has(id) && !matchedUserIds.has(id)
    );

    if (remainingIds.length > 0) {
      const users = await db.user.findMany({
        where: { id: { in: remainingIds }, deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          memberships: { select: { role: true } },
        },
      });

      for (const user of users) {
        const userRole = user.memberships[0]?.role || "MEMBER";
        const attribution: FacultyAttribution = {
          id: user.id,
          name: user.name || "Academic Contributor",
          email: user.email,
          designation: userRole === "ADMIN" || userRole === "OWNER" ? "University Administration" : "Academic Staff",
          formattedAttribution: `${user.name || "Academic Contributor"} • ${userRole}`,
        };
        result.set(user.id, attribution);
      }
    }
  } catch (err) {
    console.warn("[resolveFacultyAttributions] Error resolving faculty attribution:", err);
  }

  // Provide fallback for any IDs that still couldn't be resolved
  for (const id of cleanIds) {
    if (!result.has(id)) {
      result.set(id, {
        id,
        name: "Academic Faculty",
        designation: "Faculty Member",
        formattedAttribution: "Academic Faculty • Department Repository",
      });
    }
  }

  return result;
}
