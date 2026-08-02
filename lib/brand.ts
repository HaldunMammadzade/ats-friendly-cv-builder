export const APP_NAME = "Folio";
export const APP_TAGLINE = "Your career, ATS-ready";
export const APP_DESCRIPTION =
  "Folio helps you build a resume that clears applicant tracking systems and still reads well to a recruiter. Live ATS scoring, job-description matching, cover letters, and PDF or DOCX export.";
export const APP_FOOTER = `${APP_NAME} — ATS-ready resume tooling. Gets you past the filter and onto the shortlist.`;

export function pageTitle(segment: string): string {
  return `${segment} · ${APP_NAME}`;
}

export const defaultMetadataTitle = `${APP_NAME} — ${APP_TAGLINE}`;
