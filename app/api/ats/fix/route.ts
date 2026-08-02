import type { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok, withAuth } from "@/lib/api/response";
import { parseCV } from "@/lib/cv/migrate";
import { runAtsFix } from "@/lib/ats/fix-engine";
import type { AtsCheck, CheckCategory } from "@/lib/ats/score";
import { scoreCV } from "@/lib/ats/score";

const bodySchema = z.object({
  data: z.unknown(),
  check: z.object({
    id: z.string(),
    category: z.enum([
      "contact",
      "structure",
      "content",
      "keywords",
      "formatting",
      "length",
    ] as const satisfies readonly CheckCategory[]),
    label: z.string(),
    status: z.enum(["pass", "warn", "fail"]),
    score: z.number(),
    weight: z.number(),
    message: z.string(),
    fix: z.string().optional(),
    items: z.array(z.string()).optional(),
  }),
});

export const POST = withAuth(async (_user, request: NextRequest) => {
  const body = bodySchema.parse(await request.json());
  const cv = parseCV(body.data);
  const result = await runAtsFix(cv, body.check as AtsCheck);

  return ok({
    ...result,
    ats: scoreCV(result.cv),
  });
});
