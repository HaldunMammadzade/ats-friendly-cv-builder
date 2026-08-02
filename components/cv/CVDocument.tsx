import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { CVData } from "@/types/cv";
import { APP_NAME } from "@/lib/brand";
import { buildDocument, type Block, type DocSection } from "@/lib/cv/blocks";
import { MM_TO_PT, resolveTheme, type ResolvedTheme } from "@/lib/cv/templates";

/**
 * PDF rendering. Uses only the PDF base-14 fonts so the output contains real,
 * extractable text with no embedded font subsetting — the single biggest factor
 * in whether an ATS reads a resume correctly.
 *
 * Kept in lockstep with CVPreview by sharing buildDocument() and resolveTheme().
 */

// Word breaking is off across the whole document. Left on, react-pdf splits
// long tokens with a hyphen — "github.com/your-name", "Type-Script" — and a
// keyword broken in half is a keyword the scanner will not match.
Font.registerHyphenationCallback((word) => [word]);

const bold = (font: string) =>
  font === "Times-Roman" ? "Times-Bold" : "Helvetica-Bold";

function createStyles(theme: ResolvedTheme) {
  const { size, color, space, tokens, fonts } = theme;

  return StyleSheet.create({
    page: {
      paddingTop: theme.page.marginMm * MM_TO_PT,
      paddingBottom: theme.page.marginMm * MM_TO_PT,
      paddingHorizontal: theme.page.marginMm * MM_TO_PT,
      fontFamily: fonts.pdf.body,
      fontSize: size.body,
      lineHeight: theme.lineHeight,
      color: color.text,
    },
    header: {
      marginBottom: space.section,
      textAlign: tokens.headerAlign,
    },
    name: {
      fontFamily: bold(fonts.pdf.heading),
      fontSize: size.name,
      // An explicit line height is required here: without it the name's line
      // box collapses towards the body line height and the job title below
      // overlaps its descenders, which also merges the two into one line for
      // anything extracting text from the PDF.
      lineHeight: 1.2,
      letterSpacing: tokens.nameUppercase ? 1 : -0.2,
      color:
        tokens.accentOn === "name-and-heading" ? color.accent : color.text,
    },
    title: {
      fontSize: size.title,
      lineHeight: 1.25,
      color: color.muted,
      marginTop: space.bullet * 2,
    },
    contacts: {
      fontSize: size.contact,
      color: color.muted,
      marginTop: space.bullet * 2.5,
      lineHeight: 1.5,
    },
    section: { marginBottom: space.section },
    heading: {
      fontFamily: bold(fonts.pdf.heading),
      fontSize: size.heading,
      lineHeight: 1.25,
      letterSpacing: tokens.headingLetterSpacing,
      color: tokens.accentOn === "none" ? color.text : color.accent,
      marginBottom: space.afterHeading,
      paddingBottom: tokens.rule === "none" ? 0 : space.afterHeading * 0.5,
      borderBottomWidth: tokens.rule === "none" ? 0 : tokens.rule === "full" ? 1 : 0.6,
      borderBottomColor: color.rule,
      borderBottomStyle: "solid",
    },
    paragraph: { fontSize: size.body },
    entry: { marginBottom: space.entry },
    entryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    entryLeft: { flex: 1, paddingRight: 8 },
    entryTitle: { fontFamily: bold(fonts.pdf.body), fontSize: size.body },
    entrySubtitle: { fontSize: size.body, color: color.muted },
    entryRight: { textAlign: "right", fontSize: size.meta, color: color.muted },
    entryRightSub: { fontSize: size.small, color: color.muted },
    description: { fontSize: size.body, marginTop: space.bullet },
    bulletRow: {
      flexDirection: "row",
      marginTop: space.bullet,
      paddingRight: 2,
    },
    bulletChar: { width: 9, fontSize: size.body },
    bulletText: { flex: 1, fontSize: size.body },
    footnote: {
      fontSize: size.small,
      color: color.muted,
      marginTop: space.bullet * 1.5,
    },
    labelled: { fontSize: size.body, marginBottom: space.bullet * 1.6 },
    label: { fontFamily: bold(fonts.pdf.body) },
  });
}

type Styles = ReturnType<typeof createStyles>;

function EntryView({
  block,
  styles,
  bulletChar,
}: {
  block: Extract<Block, { kind: "entry" }>;
  styles: Styles;
  bulletChar: string;
}) {
  return (
    <View style={styles.entry} wrap={false}>
      <View style={styles.entryRow}>
        <View style={styles.entryLeft}>
          <Text>
            <Text style={styles.entryTitle}>{block.title}</Text>
            {block.subtitle ? (
              <Text style={styles.entrySubtitle}>
                {block.title ? " \u2014 " : ""}
                {block.subtitle}
              </Text>
            ) : null}
          </Text>
        </View>
        {(block.meta || block.metaSub) && (
          <View>
            {block.meta ? (
              <Text style={styles.entryRight}>{block.meta}</Text>
            ) : null}
            {block.metaSub ? (
              <Text style={styles.entryRightSub}>{block.metaSub}</Text>
            ) : null}
          </View>
        )}
      </View>

      {block.description ? (
        <Text style={styles.description}>{block.description}</Text>
      ) : null}

      {block.bullets.map((bullet, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletChar}>{bulletChar}</Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}

      {block.footnote ? (
        <Text style={styles.footnote}>{block.footnote}</Text>
      ) : null}
    </View>
  );
}

function BlockView({
  block,
  styles,
  bulletChar,
}: {
  block: Block;
  styles: Styles;
  bulletChar: string;
}) {
  switch (block.kind) {
    case "paragraph":
    case "inline":
      return <Text style={styles.paragraph}>{block.text}</Text>;

    case "labelled":
      return (
        <Text style={styles.labelled}>
          {block.label ? (
            <Text style={styles.label}>{block.label}: </Text>
          ) : null}
          <Text>{block.value}</Text>
        </Text>
      );

    case "bullets":
      return (
        <View>
          {block.items.map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletChar}>{bulletChar}</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      );

    case "entry":
      return (
        <EntryView block={block} styles={styles} bulletChar={bulletChar} />
      );

    default:
      return null;
  }
}

function SectionView({
  section,
  styles,
  bulletChar,
  uppercase,
}: {
  section: DocSection;
  styles: Styles;
  bulletChar: string;
  uppercase: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>
        {uppercase ? section.heading.toUpperCase() : section.heading}
      </Text>
      {section.blocks.map((block, i) => (
        <BlockView
          key={i}
          block={block}
          styles={styles}
          bulletChar={bulletChar}
        />
      ))}
    </View>
  );
}

export default function CVDocument({ cv }: { cv: CVData }) {
  const doc = buildDocument(cv);
  const theme = resolveTheme(cv.design);
  const styles = createStyles(theme);
  const { tokens } = theme;

  return (
    <Document
      title={`${cv.personal.fullName || cv.name} — CV`}
      author={cv.personal.fullName || undefined}
      subject={cv.personal.title || undefined}
      keywords={cv.skills.flatMap((g) => g.items).join(", ")}
      creator={APP_NAME}
      producer={APP_NAME}
    >
      <Page size={cv.design.paperSize === "a4" ? "A4" : "LETTER"} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>
            {tokens.nameUppercase
              ? (doc.header.name || "Your Name").toUpperCase()
              : doc.header.name || "Your Name"}
          </Text>
          {doc.header.title ? (
            <Text style={styles.title}>{doc.header.title}</Text>
          ) : null}
          {doc.header.contacts.length ? (
            <Text style={styles.contacts}>
              {doc.header.contacts.join("  |  ")}
            </Text>
          ) : null}
        </View>

        {doc.sections.map((section) => (
          <SectionView
            key={section.id}
            section={section}
            styles={styles}
            bulletChar={tokens.bulletChar}
            uppercase={tokens.headingUppercase}
          />
        ))}
      </Page>
    </Document>
  );
}
