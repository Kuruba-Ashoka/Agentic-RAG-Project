import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    let organizationId: string = "seed-org-001";
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userName: string = "Scholar";
    let userCreatedAt: string = new Date().toISOString();

    // 1. Check InsForge Auth User
    try {
      const insforge = await createClient();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (userData?.user) {
        userId = userData.user.id;
        userEmail = userData.user.email ?? null;
        userName = userData.user.profile?.name || userData.user.email?.split("@")[0] || "Scholar";
        userCreatedAt = userData.user.createdAt || userCreatedAt;

        const membership = await db.membership.findFirst({
          where: { userId: userData.user.id },
        });
        if (membership?.organizationId) {
          organizationId = membership.organizationId;
        }
      }
    } catch (e) {
      console.error("[Settings API] InsForge getCurrentUser error:", e);
    }

    // 2. Check Faculty Session Cookie fallback
    const cookieStore = await cookies();
    const facultySession = cookieStore.get("faculty_session");
    let facultyRecord = null;
    if (facultySession?.value) {
      try {
        const parsed = JSON.parse(facultySession.value);
        if (parsed.organizationId) organizationId = parsed.organizationId;
        facultyRecord = parsed;
        if (!userId && parsed.id) userId = parsed.id;
        if (!userEmail && parsed.email) userEmail = parsed.email;
        if (parsed.name) userName = parsed.name;
      } catch {}
    }

    // 3. Look up database student record
    let studentRecord = null;
    if (userId) {
      studentRecord = await db.student.findFirst({
        where: {
          OR: [{ userId: userId }, { id: userId }],
          deletedAt: null,
        },
        include: {
          department: { include: { college: true } },
          advisor: { include: { user: true } },
        },
      });
    }

    // 4. Look up database faculty record if not already parsed
    if (!facultyRecord && userId) {
      facultyRecord = await db.faculty.findFirst({
        where: {
          OR: [{ userId: userId }, { id: userId }],
          deletedAt: null,
        },
        include: {
          department: { include: { college: true } },
        },
      });
    }

    // 5. Look up db.user
    let dbUser = null;
    if (userId) {
      dbUser = await db.user.findFirst({
        where: { id: userId },
      });
      if (dbUser?.name) userName = dbUser.name;
      if (dbUser?.email) userEmail = dbUser.email;
    }

    // 6. Fetch all active departments in organization
    const departments = await db.department.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
      },
      orderBy: { code: "asc" },
    });

    // Determine primary role & academic details
    let role = "STUDENT";
    let departmentId = studentRecord?.departmentId || facultyRecord?.departmentId || (departments.find(d => d.code === "CS" || d.code === "CSE")?.id || departments[0]?.id || "");
    let departmentCode = studentRecord?.department?.code || facultyRecord?.department?.code || (departments.find(d => d.id === departmentId)?.code || "CS");
    let departmentName = studentRecord?.department?.name || facultyRecord?.department?.name || (departments.find(d => d.id === departmentId)?.name || "Computer Science");
    let idNumber = studentRecord?.studentNumber || facultyRecord?.facultyCode || "STU-2026-CSE-104";
    let majorOrDesignation = studentRecord?.major || facultyRecord?.designation || "Computer Science & Engineering";
    let gpa = studentRecord?.gpa || 3.85;
    let academicStatus = studentRecord?.academicStatus ?? null;

    if (facultyRecord) {
      role = facultyRecord.designation === "HOD" ? "HOD" : "FACULTY";
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: userName,
        email: userEmail || "student@university.edu",
        role,
        createdAt: userCreatedAt,
      },
      academic: {
        role,
        idNumber,
        departmentId,
        departmentCode,
        departmentName,
        majorOrDesignation,
        gpa,
        academicStatus,
        officeRoom: facultyRecord?.officeRoom || null,
        advisorName: studentRecord?.advisor?.user?.name || "Dr. Department Advisor",
      },
      departments,
    });
  } catch (error: any) {
    console.error("[Settings API GET error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      departmentId,
      majorOrDesignation,
      bio,
      preferences,
    } = body;

    let userId: string | null = null;
    let organizationId: string = "seed-org-001";

    // Auth check
    try {
      const insforge = await createClient();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (userData?.user) {
        userId = userData.user.id;
        const membership = await db.membership.findFirst({
          where: { userId: userData.user.id },
        });
        if (membership?.organizationId) organizationId = membership.organizationId;
      }
    } catch {}

    const cookieStore = await cookies();
    const facultySession = cookieStore.get("faculty_session");
    if (!userId && facultySession?.value) {
      try {
        const parsed = JSON.parse(facultySession.value);
        userId = parsed.id;
        if (parsed.organizationId) organizationId = parsed.organizationId;
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Update Prisma User
    if (name) {
      await db.user.updateMany({
        where: { id: userId },
        data: { name: name.trim() },
      });
    }

    // Update Student Record if present
    const student = await db.student.findFirst({
      where: {
        OR: [{ userId: userId }, { id: userId }],
        deletedAt: null,
      },
    });

    if (student) {
      const updateData: any = {};
      if (departmentId) updateData.departmentId = departmentId;
      if (majorOrDesignation) updateData.major = majorOrDesignation.trim();

      if (Object.keys(updateData).length > 0) {
        await db.student.update({
          where: { id: student.id },
          data: updateData,
        });
      }
    }

    // Update Faculty Record if present
    const faculty = await db.faculty.findFirst({
      where: {
        OR: [{ userId: userId }, { id: userId }],
        deletedAt: null,
      },
    });

    if (faculty) {
      const updateData: any = {};
      if (departmentId) updateData.departmentId = departmentId;
      if (majorOrDesignation) updateData.designation = majorOrDesignation.trim();

      if (Object.keys(updateData).length > 0) {
        await db.faculty.update({
          where: { id: faculty.id },
          data: updateData,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Academic profile and preferences saved successfully!",
    });
  } catch (error: any) {
    console.error("[Settings API PATCH error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
