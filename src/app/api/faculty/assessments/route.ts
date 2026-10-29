import { NextRequest, NextResponse } from "next/server";
import { FacultyService } from "@/server/services/faculty.service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get("facultyId") || undefined;
    const syllabus = await FacultyService.getSyllabusProgress(facultyId);

    return NextResponse.json({
      success: true,
      courses: syllabus.courses,
      assessmentTypes: ["Mid-Term I", "Mid-Term II", "End-Term Model", "Lab Practical Viva"],
      regulation: "R23 Autonomous Academic Regulations",
      provenance: {
        source: "PostgreSQL Database Engine",
        datasetId: "live-sis-v1",
        mode: "Live Faculty Operations",
        isDemo: false,
      },
    });
  } catch (error: any) {
    console.error("[API faculty assessments GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load assessment metadata" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      courseCode = "CSE401",
      courseTitle = "Advanced Agentic AI & Distributed Neural Systems",
      assessmentType = "Mid-Term I",
      unitsIncluded = [1, 2, 3],
    } = body;

    const paper = FacultyService.synthesizeExamPaper({
      courseCode,
      courseTitle,
      assessmentType,
      unitsIncluded,
    });

    return NextResponse.json({
      success: true,
      paper,
    });
  } catch (error: any) {
    console.error("[API faculty assessments POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to synthesize exam paper" },
      { status: 500 }
    );
  }
}
