import "server-only";

export interface ExtractedText {
  text: string;
  source: "pdf" | "docx" | "txt";
  /** PDF only; used to warn when a scanned document yields no text. */
  pageCount?: number;
}

export class UnsupportedFileError extends Error {
  constructor(mime: string) {
    super(
      `Unsupported file type "${mime}". Upload a PDF, DOCX or plain text file.`
    );
    this.name = "UnsupportedFileError";
  }
}

const PDF_TYPES = ["application/pdf"];
const DOCX_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const TEXT_TYPES = ["text/plain", "text/markdown"];

/** Pulls plain text out of an uploaded resume. */
export async function extractText(file: File): Promise<ExtractedText> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || guessMime(file.name);

  if (PDF_TYPES.includes(mime)) {
    // Imported lazily; unpdf pulls in a large pdf.js build.
    const { extractText: extractPdfText, getDocumentProxy } = await import(
      "unpdf"
    );
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text, totalPages } = await extractPdfText(pdf, { mergePages: true });
    return {
      text: Array.isArray(text) ? text.join("\n") : text,
      source: "pdf",
      pageCount: totalPages,
    };
  }

  if (DOCX_TYPES.includes(mime)) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return { text: value, source: "docx" };
  }

  if (TEXT_TYPES.includes(mime)) {
    return { text: buffer.toString("utf8"), source: "txt" };
  }

  throw new UnsupportedFileError(mime || "unknown");
}

function guessMime(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "pdf") return PDF_TYPES[0];
  if (ext === "docx") return DOCX_TYPES[0];
  if (ext === "txt" || ext === "md") return "text/plain";
  return "";
}
