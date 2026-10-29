import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check optional faculty session
    const cookieStore = await cookies();
    const facultyCookie = cookieStore.get("faculty_session");
    let isFaculty = false;
    if (facultyCookie?.value) {
      try {
        isFaculty = Boolean(JSON.parse(facultyCookie.value));
      } catch {}
    }

    // Check optional insforge user
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;

    // Allow student access for institutional/department documents
    const doc = await db.document.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: { select: { id: true, code: true, name: true } },
        college: { select: { id: true, code: true, name: true } },
        knowledgeBase: { select: { id: true, name: true } },
        chunks: {
          where: { deletedAt: null },
          take: 20,
          orderBy: { chunkIndex: "asc" },
          select: { content: true, chunkIndex: true, pageNumber: true },
        },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Enforce DocumentAccessPolicy authorization before allowing download
    const { DocumentAccessPolicy } = await import("@/server/services/document-access-policy");
    let accessContext: any;
    if (isFaculty && facultyCookie?.value) {
      const facultyParsed = JSON.parse(facultyCookie.value);
      accessContext = {
        organizationId: facultyParsed.organizationId || doc.organizationId,
        userId: facultyParsed.userId || facultyParsed.id,
        facultyId: facultyParsed.id,
        userRole: (facultyParsed.role || "FACULTY").toUpperCase(),
        departmentId: facultyParsed.departmentId,
        collegeId: facultyParsed.collegeId,
      };
    } else if (user) {
      const membership = await db.membership.findFirst({
        where: { userId: user.id, organizationId: doc.organizationId, deletedAt: null },
        select: { role: true },
      });
      const role = (membership?.role || "STUDENT").toUpperCase();

      if (["OWNER", "ADMIN", "DEAN"].includes(role)) {
        accessContext = {
          organizationId: doc.organizationId,
          userId: user.id,
          userRole: role,
        };
      } else {
        accessContext = await DocumentAccessPolicy.resolveStudentAccessContext(
          user.id,
          doc.organizationId
        );
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = DocumentAccessPolicy.canAccessDocument(accessContext, {
      organizationId: doc.organizationId,
      collegeId: doc.collegeId,
      departmentId: doc.departmentId,
      visibility: doc.visibility,
      uploadedBy: doc.uploadedBy,
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to download this document" },
        { status: 403 }
      );
    }

    let pdfBuffer: Uint8Array | null = null;

    // 1. Try to download from InsForge Storage if storagePath exists
    if (doc.storagePath) {
      try {
        const { data, error } = await insforge.storage
          .from("documents")
          .download(doc.storagePath);

        if (data && !error) {
          pdfBuffer = new Uint8Array(await data.arrayBuffer());
        }
      } catch (storageErr) {
        console.warn("[Download Route] Storage download fallback:", storageErr);
      }
    }

    // 2. Fallback: Generate a clean, official formatted university PDF if binary is not stored remotely
    if (!pdfBuffer) {
      const pdfDoc = await PDFDocument.create();
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
      const { width, height } = page.getSize();

      // University Header Banner
      page.drawRectangle({
        x: 0,
        y: height - 90,
        width,
        height: 90,
        color: rgb(0.12, 0.16, 0.38), // Indigo navy
      });

      page.drawText("ANANTHA LAKSHMI INSTITUTE OF TECHNOLOGY & SCIENCES", {
        x: 40,
        y: height - 40,
        size: 13,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawText("ALITS NexusIQ Cognitive Knowledge Repository • Official Document", {
        x: 40,
        y: height - 60,
        size: 9,
        font: fontRegular,
        color: rgb(0.8, 0.85, 1),
      });

      // Metadata section
      let currentY = height - 125;
      page.drawText(`Document Title: ${doc.fileName}`, {
        x: 40,
        y: currentY,
        size: 14,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.15),
      });

      currentY -= 22;
      const deptText = doc.department
        ? `Department: ${doc.department.name} (${doc.department.code})`
        : "Department: University-Wide Academic Document";
      page.drawText(deptText, {
        x: 40,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.35),
      });

      currentY -= 18;
      const visibilityText = `Visibility: ${doc.visibility || "DEPARTMENT"} • Upload Date: ${new Date(doc.createdAt).toLocaleDateString()}`;
      page.drawText(visibilityText, {
        x: 40,
        y: currentY,
        size: 9,
        font: fontRegular,
        color: rgb(0.4, 0.4, 0.45),
      });

      currentY -= 25;
      page.drawLine({
        start: { x: 40, y: currentY },
        end: { x: width - 40, y: currentY },
        thickness: 1,
        color: rgb(0.85, 0.85, 0.9),
      });

      currentY -= 30;
      page.drawText("Document Notes & Syllabus Content:", {
        x: 40,
        y: currentY,
        size: 11,
        font: fontBold,
        color: rgb(0.15, 0.15, 0.2),
      });

      currentY -= 20;

      // Render excerpt chunks
      if (doc.chunks && doc.chunks.length > 0) {
        for (const chunk of doc.chunks.slice(0, 5)) {
          if (currentY < 120) break;

          page.drawText(`[Section / Unit ${chunk.chunkIndex + 1}]`, {
            x: 40,
            y: currentY,
            size: 9,
            font: fontBold,
            color: rgb(0.25, 0.35, 0.8),
          });
          currentY -= 15;

          // Simple word wrap
          const textSnippet = chunk.content.replace(/\s+/g, " ").trim().slice(0, 320);
          const words = textSnippet.split(" ");
          let line = "";
          for (const word of words) {
            if ((line + " " + word).length > 85) {
              page.drawText(line, {
                x: 40,
                y: currentY,
                size: 8.5,
                font: fontRegular,
                color: rgb(0.2, 0.2, 0.2),
              });
              currentY -= 13;
              line = word;
            } else {
              line = line ? line + " " + word : word;
            }
          }
          if (line) {
            page.drawText(line, {
              x: 40,
              y: currentY,
              size: 8.5,
              font: fontRegular,
              color: rgb(0.2, 0.2, 0.2),
            });
            currentY -= 18;
          }
        }
      } else {
        page.drawText("Institutional syllabus, lecture reference materials, and examination regulations.", {
          x: 40,
          y: currentY,
          size: 9,
          font: fontRegular,
          color: rgb(0.3, 0.3, 0.3),
        });
      }

      // Footer
      page.drawText("Downloaded from ALITS NexusIQ Student Portal • Autonomous Institution • Affiliated to JNTUA", {
        x: 40,
        y: 40,
        size: 8,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.55),
      });

      const pdfBytes = await pdfDoc.save();
      pdfBuffer = pdfBytes;
    }

    const safeFileName = doc.fileName.endsWith(".pdf") ? doc.fileName : `${doc.fileName}.pdf`;

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeFileName)}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("[GET /api/documents/[id]/download] Error:", error);
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 });
  }
}
