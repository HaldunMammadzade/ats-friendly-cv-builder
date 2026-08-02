import type { NextRequest } from "next/server";
import { z } from "zod";
import { notFound, withAuth } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { getResume } from "@/lib/api/resumes";
import { parseCV } from "@/lib/cv/migrate";
import { buildDocx } from "@/lib/export/docx";
import { fileSlug } from "@/lib/cv/format";

const bodySchema = z
  .object({
    resumeId: z.uuid().optional(),
    data: z.unknown().optional(),
  })
  .refine((v) => v.resumeId || v.data, {
    message: "Provide either resumeId or data.",
  });

/** DOCX generation depends on Node Buffer APIs, so it runs server-side. */
export const POST = withAuth(async (user, request: NextRequest) => {
  const body = bodySchema.parse(await request.json());

  let cv;
  if (body.resumeId) {
    const supabase = await createClient();
    const resume = await getResume(supabase, user.id, body.resumeId);
    if (!resume) return notFound("CV");
    cv = resume.data;
  } else {
    cv = parseCV(body.data);
  }

  const buffer = await buildDocx(cv);
  const filename = `${fileSlug(cv.personal.fullName || cv.name)}_CV.docx`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
});
