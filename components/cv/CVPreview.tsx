"use client";

import { CSSProperties, memo } from "react";
import type { CVData } from "@/types/cv";
import { buildDocument, type Block, type DocSection } from "@/lib/cv/blocks";
import { resolveTheme, type ResolvedTheme } from "@/lib/cv/templates";

/**
 * On-screen A4 rendering. Sizes are in pt and mm so what you see matches the
 * exported PDF, which uses the same theme values.
 */

interface Props {
  cv: CVData;
  /** Renders page-break guides at multiples of the paper height. */
  showPageGuides?: boolean;
}

function SectionHeading({
  text,
  theme,
}: {
  text: string;
  theme: ResolvedTheme;
}) {
  const { tokens, size, color, space } = theme;

  const style: CSSProperties = {
    fontFamily: theme.fonts.css.heading,
    fontSize: `${size.heading}pt`,
    fontWeight: 700,
    letterSpacing: `${tokens.headingLetterSpacing}px`,
    textTransform: tokens.headingUppercase ? "uppercase" : "none",
    color: tokens.accentOn === "none" ? color.text : color.accent,
    marginBottom: `${space.afterHeading}pt`,
    paddingBottom: tokens.rule === "none" ? 0 : `${space.afterHeading * 0.5}pt`,
    borderBottom:
      tokens.rule === "none"
        ? "none"
        : `${tokens.rule === "full" ? 1 : 0.6}px solid ${color.rule}`,
  };

  return <h2 style={style}>{text}</h2>;
}

function EntryBlock({
  block,
  theme,
}: {
  block: Extract<Block, { kind: "entry" }>;
  theme: ResolvedTheme;
}) {
  const { size, color, space, tokens } = theme;

  return (
    <div style={{ marginBottom: `${space.entry}pt`, breakInside: "avoid" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "8pt",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: `${size.body}pt` }}>
            {block.title}
          </span>
          {block.subtitle && (
            <span style={{ fontSize: `${size.body}pt`, color: color.muted }}>
              {block.title ? " \u2014 " : ""}
              {block.subtitle}
            </span>
          )}
        </div>
        {(block.meta || block.metaSub) && (
          <div
            style={{
              textAlign: "right",
              flexShrink: 0,
              fontSize: `${size.meta}pt`,
              color: color.muted,
              whiteSpace: "nowrap",
            }}
          >
            <div>{block.meta}</div>
            {block.metaSub && (
              <div style={{ fontSize: `${size.small}pt` }}>{block.metaSub}</div>
            )}
          </div>
        )}
      </div>

      {block.description && (
        <p
          style={{
            fontSize: `${size.body}pt`,
            marginTop: `${space.bullet}pt`,
            color: color.text,
          }}
        >
          {block.description}
        </p>
      )}

      {block.bullets.length > 0 && (
        <ul style={{ marginTop: `${space.bullet * 1.5}pt`, listStyle: "none" }}>
          {block.bullets.map((bullet, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: "5pt",
                fontSize: `${size.body}pt`,
                marginBottom: `${space.bullet}pt`,
              }}
            >
              <span style={{ flexShrink: 0 }}>{tokens.bulletChar}</span>
              <span style={{ flex: 1 }}>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      {block.footnote && (
        <p
          style={{
            fontSize: `${size.small}pt`,
            color: color.muted,
            marginTop: `${space.bullet * 1.5}pt`,
          }}
        >
          {block.footnote}
        </p>
      )}
    </div>
  );
}

function BlockView({ block, theme }: { block: Block; theme: ResolvedTheme }) {
  const { size, space, tokens } = theme;

  switch (block.kind) {
    case "paragraph":
      return (
        <p style={{ fontSize: `${size.body}pt`, textAlign: "justify" }}>
          {block.text}
        </p>
      );

    case "inline":
      return <p style={{ fontSize: `${size.body}pt` }}>{block.text}</p>;

    case "labelled":
      return (
        <p
          style={{
            fontSize: `${size.body}pt`,
            marginBottom: `${space.bullet * 1.6}pt`,
          }}
        >
          {block.label && (
            <span style={{ fontWeight: 700 }}>{block.label}: </span>
          )}
          <span>{block.value}</span>
        </p>
      );

    case "bullets":
      return (
        <ul style={{ listStyle: "none" }}>
          {block.items.map((item, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: "5pt",
                fontSize: `${size.body}pt`,
                marginBottom: `${space.bullet}pt`,
              }}
            >
              <span>{tokens.bulletChar}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "entry":
      return <EntryBlock block={block} theme={theme} />;

    default:
      return null;
  }
}

function SectionView({
  section,
  theme,
}: {
  section: DocSection;
  theme: ResolvedTheme;
}) {
  return (
    <section style={{ marginBottom: `${theme.space.section}pt` }}>
      <SectionHeading text={section.heading} theme={theme} />
      {section.blocks.map((block, i) => (
        <BlockView key={i} block={block} theme={theme} />
      ))}
    </section>
  );
}

function CVPreviewImpl({ cv, showPageGuides = true }: Props) {
  const doc = buildDocument(cv);
  const theme = resolveTheme(cv.design);
  const { tokens, size, color, space, page } = theme;

  const isEmpty = !doc.header.name && doc.sections.length === 0;

  return (
    <div
      className="cv-page"
      data-cv-root
      style={{
        width: `${page.widthMm}mm`,
        minHeight: `${page.heightMm}mm`,
        padding: `${page.marginMm}mm`,
        fontFamily: theme.fonts.css.body,
        fontSize: `${size.body}pt`,
        lineHeight: theme.lineHeight,
        color: color.text,
        background: "#ffffff",
        position: "relative",
      }}
    >
      {showPageGuides && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent calc(${page.heightMm}mm - 1px), rgba(220,38,38,0.35) calc(${page.heightMm}mm - 1px), rgba(220,38,38,0.35) ${page.heightMm}mm)`,
          }}
        />
      )}

      <header
        style={{
          textAlign: tokens.headerAlign,
          marginBottom: `${space.section}pt`,
        }}
      >
        <h1
          style={{
            fontFamily: theme.fonts.css.heading,
            fontSize: `${size.name}pt`,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: tokens.nameUppercase ? "1px" : "-0.2px",
            textTransform: tokens.nameUppercase ? "uppercase" : "none",
            color:
              tokens.accentOn === "name-and-heading" ? color.accent : color.text,
          }}
        >
          {doc.header.name || "Your Name"}
        </h1>

        {doc.header.title && (
          <p
            style={{
              fontSize: `${size.title}pt`,
              color: color.muted,
              marginTop: `${space.bullet * 2}pt`,
            }}
          >
            {doc.header.title}
          </p>
        )}

        {doc.header.contacts.length > 0 && (
          <p
            style={{
              fontSize: `${size.contact}pt`,
              color: color.muted,
              marginTop: `${space.bullet * 2.5}pt`,
              lineHeight: 1.5,
            }}
          >
            {doc.header.contacts.join("  |  ")}
          </p>
        )}
      </header>

      {isEmpty ? (
        <p style={{ color: "#9ca3af", fontSize: `${size.body}pt` }}>
          Start filling in the editor and your CV will appear here.
        </p>
      ) : (
        doc.sections.map((section) => (
          <SectionView key={section.id} section={section} theme={theme} />
        ))
      )}
    </div>
  );
}

const CVPreview = memo(CVPreviewImpl);
export default CVPreview;
