import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
  convertMillimetersToTwip,
} from "docx";
import type { CVData } from "@/types/cv";
import { APP_NAME } from "@/lib/brand";
import { buildDocument, type Block } from "@/lib/cv/blocks";
import { PAPER_MM, resolveTheme } from "@/lib/cv/templates";

/**
 * DOCX export.
 *
 * Some applicant tracking systems (notably older Taleo and iCIMS installs)
 * extract .docx far more reliably than PDF. The layout deliberately avoids
 * tables, text boxes, headers and footers — all of which those parsers drop.
 * Right-aligned dates use a tab stop rather than a table for the same reason.
 */

/** docx sizes are in half-points. */
const hp = (pt: number) => Math.round(pt * 2);
/** Spacing is in twentieths of a point. */
const tw = (pt: number) => Math.round(pt * 20);

const BULLET_REF = "cv-bullets";

export async function buildDocx(cv: CVData): Promise<Buffer> {
  const doc = buildDocument(cv);
  const theme = resolveTheme(cv.design);
  const { size, space, color, fonts } = theme;
  const paper = PAPER_MM[cv.design.paperSize];

  const accent = theme.tokens.accentOn === "none" ? "111827" : hex(color.accent);
  const muted = hex(color.muted);
  const text = hex(color.text);

  const rightTab = {
    type: TabStopType.RIGHT,
    position: convertMillimetersToTwip(paper.w - cv.design.margin * 2),
  } as const;

  const children: Paragraph[] = [];

  // --- Header ---------------------------------------------------------------
  children.push(
    new Paragraph({
      alignment:
        theme.tokens.headerAlign === "center"
          ? AlignmentType.CENTER
          : AlignmentType.LEFT,
      spacing: { after: tw(space.bullet * 2) },
      children: [
        new TextRun({
          text: theme.tokens.nameUppercase
            ? (doc.header.name || "Your Name").toUpperCase()
            : doc.header.name || "Your Name",
          bold: true,
          size: hp(size.name),
          font: fonts.docx.heading,
          color: theme.tokens.accentOn === "name-and-heading" ? accent : text,
        }),
      ],
    })
  );

  if (doc.header.title) {
    children.push(
      new Paragraph({
        alignment:
          theme.tokens.headerAlign === "center"
            ? AlignmentType.CENTER
            : AlignmentType.LEFT,
        spacing: { after: tw(space.bullet * 2) },
        children: [
          new TextRun({
            text: doc.header.title,
            size: hp(size.title),
            font: fonts.docx.body,
            color: muted,
          }),
        ],
      })
    );
  }

  if (doc.header.contacts.length) {
    children.push(
      new Paragraph({
        alignment:
          theme.tokens.headerAlign === "center"
            ? AlignmentType.CENTER
            : AlignmentType.LEFT,
        spacing: { after: tw(space.section) },
        children: [
          new TextRun({
            text: doc.header.contacts.join("  |  "),
            size: hp(size.contact),
            font: fonts.docx.body,
            color: muted,
          }),
        ],
      })
    );
  }

  // --- Sections -------------------------------------------------------------
  for (const section of doc.sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: tw(space.section * 0.6), after: tw(space.afterHeading) },
        border: {
          bottom:
            theme.tokens.rule === "none"
              ? undefined
              : {
                  color: hex(color.rule),
                  style: BorderStyle.SINGLE,
                  size: theme.tokens.rule === "full" ? 8 : 4,
                  space: 2,
                },
        },
        children: [
          new TextRun({
            text: theme.tokens.headingUppercase
              ? section.heading.toUpperCase()
              : section.heading,
            bold: true,
            size: hp(size.heading),
            font: fonts.docx.heading,
            color: accent,
          }),
        ],
      })
    );

    for (const block of section.blocks) {
      children.push(...renderBlock(block));
    }
  }

  function renderBlock(block: Block): Paragraph[] {
    const out: Paragraph[] = [];

    const body = (content: string, opts: { after?: number } = {}) =>
      new Paragraph({
        spacing: { after: tw(opts.after ?? space.bullet) },
        children: [
          new TextRun({
            text: content,
            size: hp(size.body),
            font: fonts.docx.body,
            color: text,
          }),
        ],
      });

    switch (block.kind) {
      case "paragraph":
      case "inline":
        out.push(body(block.text, { after: space.entry }));
        break;

      case "labelled":
        out.push(
          new Paragraph({
            spacing: { after: tw(space.bullet * 1.6) },
            children: [
              new TextRun({
                text: block.label ? `${block.label}: ` : "",
                bold: true,
                size: hp(size.body),
                font: fonts.docx.body,
                color: text,
              }),
              new TextRun({
                text: block.value,
                size: hp(size.body),
                font: fonts.docx.body,
                color: text,
              }),
            ],
          })
        );
        break;

      case "bullets":
        for (const item of block.items) out.push(bullet(item));
        break;

      case "entry": {
        out.push(
          new Paragraph({
            tabStops: [rightTab],
            spacing: { after: tw(space.bullet * 0.5) },
            children: [
              new TextRun({
                text: block.title,
                bold: true,
                size: hp(size.body),
                font: fonts.docx.body,
                color: text,
              }),
              ...(block.subtitle
                ? [
                    new TextRun({
                      text: `${block.title ? " \u2014 " : ""}${block.subtitle}`,
                      size: hp(size.body),
                      font: fonts.docx.body,
                      color: muted,
                    }),
                  ]
                : []),
              ...(block.meta
                ? [
                    new TextRun({ text: "\t" }),
                    new TextRun({
                      text: block.meta,
                      size: hp(size.meta),
                      font: fonts.docx.body,
                      color: muted,
                    }),
                  ]
                : []),
            ],
          })
        );

        if (block.metaSub) {
          out.push(
            new Paragraph({
              tabStops: [rightTab],
              spacing: { after: tw(space.bullet * 0.5) },
              children: [
                new TextRun({ text: "\t" }),
                new TextRun({
                  text: block.metaSub,
                  size: hp(size.small),
                  font: fonts.docx.body,
                  color: muted,
                }),
              ],
            })
          );
        }

        if (block.description) out.push(body(block.description));
        for (const b of block.bullets) out.push(bullet(b));

        if (block.footnote) {
          out.push(
            new Paragraph({
              spacing: { after: tw(space.entry) },
              children: [
                new TextRun({
                  text: block.footnote,
                  italics: true,
                  size: hp(size.small),
                  font: fonts.docx.body,
                  color: muted,
                }),
              ],
            })
          );
        } else {
          out.push(new Paragraph({ spacing: { after: tw(space.entry * 0.4) } }));
        }
        break;
      }
    }

    return out;
  }

  function bullet(content: string): Paragraph {
    return new Paragraph({
      numbering: { reference: BULLET_REF, level: 0 },
      spacing: { after: tw(space.bullet) },
      children: [
        new TextRun({
          text: content,
          size: hp(size.body),
          font: fonts.docx.body,
          color: text,
        }),
      ],
    });
  }

  const document = new Document({
    creator: APP_NAME,
    title: `${cv.personal.fullName || cv.name} — CV`,
    description: cv.personal.title || "",
    styles: {
      default: {
        document: {
          run: { font: fonts.docx.body, size: hp(size.body), color: text },
          paragraph: {
            spacing: { line: Math.round(theme.lineHeight * 240) },
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: BULLET_REF,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: tw(12), hanging: tw(10) },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(paper.w),
              height: convertMillimetersToTwip(paper.h),
            },
            margin: {
              top: convertMillimetersToTwip(cv.design.margin),
              right: convertMillimetersToTwip(cv.design.margin),
              bottom: convertMillimetersToTwip(cv.design.margin),
              left: convertMillimetersToTwip(cv.design.margin),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}

/** "#111827" -> "111827"; docx rejects the leading hash. */
function hex(color: string): string {
  return color.replace("#", "").toUpperCase();
}
