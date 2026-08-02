import type { NextRequest } from "next/server";
import { fail, ok, withAuth } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { insertResume } from "@/lib/api/resumes";
import {
  UnsupportedFileError,
  extractText,
} from "@/lib/import/extract-text";
import { parseResumeText } from "@/lib/import/resume-parser";
import { scoreCV } from "@/lib/ats/score";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Accepts a PDF, DOCX or TXT resume and returns a best-effort structured CV.
 * With `save=true` the result is persisted immediately so the user lands
 * straight in the editor.
 */
export const POST = withAuth(async (user, request: NextRequest) => {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return fail("Attach a file under the \"file\" field.", 400, "no_file");
  }
  if (file.size === 0) {
    return fail("That file is empty.", 400, "empty_file");
  }
  if (file.size > MAX_BYTES) {
    return fail("Files must be under 8 MB.", 413, "file_too_large");
  }

  let extracted;
  try {
    extracted = await extractText(file);
  } catch (error) {
    if (error instanceof UnsupportedFileError) {
      return fail(error.message, 415, "unsupported_type");
    }
    throw error;
  }

  const result = parseResumeText(
    extracted.text,
    file.name.replace(/\.[^.]+$/, "")
  );

  if (extracted.source === "pdf" && extracted.text.trim().length < 120) {
    result.warnings.unshift(
      "This PDF contains almost no selectable text, which usually means it is a scan. An ATS would not be able to read it either — rebuild it here instead."
    );
  }

  const shouldSave = form.get("save") === "true";
  if (!shouldSave) {
    return ok({
      cv: result.cv,
      confidence: result.confidence,
      warnings: result.warnings,
      ats: scoreCV(result.cv),
    });
  }

  const supabase = await createClient();
  const resume = await insertResume(supabase, user.id, result.cv, result.cv.name);

  return ok(
    {
      resume,
      confidence: result.confidence,
      warnings: result.warnings,
      ats: scoreCV(resume.data),
    },
    201
  );
});
