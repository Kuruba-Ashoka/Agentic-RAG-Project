import { NextResponse } from "next/server";
import { createClient } from "@/utils/insforge/server";
import { db } from "@/server/db/prisma";
import { ConversationService } from "@/server/services/conversation.service";
import { syncUserToDatabase } from "@/server/actions/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let memberships = await db.membership.findMany({
      where: { userId: user.id },
      include: { organization: { include: { _count: { select: { documents: true } } } } },
    });

    if (memberships.length === 0) {
      await syncUserToDatabase();
      memberships = await db.membership.findMany({
        where: { userId: user.id },
        include: { organization: { include: { _count: { select: { documents: true } } } } },
      });
    }

    if (memberships.length === 0) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    // Check all authorized organizations for the user, prioritizing seed-org-001 / document orgs
    const preferred =
      memberships.find(
        (m) => m.organizationId === "seed-org-001" || (m.organization?._count?.documents ?? 0) > 0
      ) || memberships[0];

    let conversation = await ConversationService.getConversation(id, preferred.organizationId);
    if (!conversation) {
      for (const m of memberships) {
        if (m.organizationId !== preferred.organizationId) {
          conversation = await ConversationService.getConversation(id, m.organizationId);
          if (conversation) break;
        }
      }
    }

    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ conversation });
  } catch (error: any) {
    console.error("GET /api/conversations/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const insforge = await createClient();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let memberships = await db.membership.findMany({
      where: { userId: user.id },
    });

    if (memberships.length === 0) {
      await syncUserToDatabase();
      memberships = await db.membership.findMany({
        where: { userId: user.id },
      });
    }

    if (memberships.length === 0) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    let deleted = false;
    for (const m of memberships) {
      const conv = await ConversationService.getConversation(id, m.organizationId);
      if (conv) {
        await ConversationService.deleteConversation(id, m.organizationId);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/conversations/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
