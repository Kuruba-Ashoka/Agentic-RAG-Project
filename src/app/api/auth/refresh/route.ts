import { createRefreshAuthRouter } from "@insforge/sdk/ssr";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_INSFORGE_URL = "https://3g428aji.ap-southeast.insforge.app";
const DEFAULT_INSFORGE_ANON_KEY =
  "anon_a02244bc085b5c7fbe0c8d30a535a015d76c1bd236a3c65deef304e60273e113";

let insforgePost: any = null;
try {
  const router = createRefreshAuthRouter({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || DEFAULT_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || DEFAULT_INSFORGE_ANON_KEY,
  });
  insforgePost = router.POST;
} catch {}

export async function POST(req: Request) {
  try {
    if (insforgePost) {
      const res = await insforgePost(req);
      // Suppress 401 from bubbling to console if no active session
      if (res && res.status === 401) {
        return NextResponse.json({ authenticated: false }, { status: 200 });
      }
      return res;
    }
  } catch {}
  return NextResponse.json({ authenticated: false }, { status: 200 });
}
