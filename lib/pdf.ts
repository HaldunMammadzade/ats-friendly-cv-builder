"use client";

import { pdf } from "@react-pdf/renderer";
import { CVDocument } from "@/components/cv/CVDocument";
import { CVData } from "@/types/cv";
import { createElement } from "react";

export async function downloadCVPdf(cv: CVData) {
  const safeName = (cv.personal.fullName || cv.name)
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  // Build the PDF blob from the React-PDF document
  const blob = await pdf(createElement(CVDocument, { cv })).toBlob();

  // Trigger a real file download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = (safeName || "CV") + "_CV.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
