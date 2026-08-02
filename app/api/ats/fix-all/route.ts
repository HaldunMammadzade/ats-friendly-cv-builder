import type { NextRequest } from "next/server";
import { z } from "zod";
import { ok, withAuth } from "@/lib/api/response";
import { parseCV } from "@/lib/cv/migrate";
import { runAtsFixAll } from "@/lib/ats/fix-engine";
import { scoreCV } from "@/lib/ats/score";

const bodySchema = z.object({ data: z.unknown() });

export const POST = withAuth(async (_user, request: NextRequest) => {
  const body = bodySchema.parse(await request.json());
  const cv = parseCV(body.data);
  const result = await runAtsFixAll(cv);
  return ok({ ...result, ats: scoreCV(result.cv) });
});
