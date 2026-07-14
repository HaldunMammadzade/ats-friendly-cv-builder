"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { CVData } from "@/types/cv";

// Use a clean built-in serif (Times) for a classic, ATS-safe look.
// @react-pdf ships Helvetica, Times-Roman, Courier by default.

const styles = StyleSheet.create({
  page: {
    paddingVertical: 40,
    paddingHorizontal: 50,
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    color: "#1a1a1a",
    lineHeight: 1.5,
  },
  // Header
  name: {
    fontSize: 22,
    fontFamily: "Times-Bold",
    textAlign: "center",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#111",
  },
  title: {
    fontSize: 11,
    textAlign: "center",
    color: "#555",
    marginTop: 4,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  contact: {
    fontSize: 8.8,
    textAlign: "center",
    color: "#666",
    marginTop: 7,
  },
  headerRule: {
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a1a",
    marginTop: 11,
  },
  // Section
  section: {
    marginTop: 13,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#aaa",
    paddingBottom: 3,
    marginBottom: 7,
  },
  // Generic
  bold: { fontFamily: "Times-Bold", color: "#1a1a1a" },
  italic: { fontFamily: "Times-Italic" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dateText: {
    fontSize: 9,
    color: "#666",
    fontFamily: "Times-Italic",
  },
  locationText: {
    fontSize: 9,
    color: "#777",
    marginTop: 1,
  },
  entry: {
    marginBottom: 11,
  },
  // Bullets
  bulletRow: {
    flexDirection: "row",
    marginTop: 3,
  },
  bulletDot: {
    width: 12,
    fontSize: 10.5,
    color: "#444",
  },
  bulletText: {
    flex: 1,
    color: "#2a2a2a",
  },
  techLine: {
    fontSize: 9.5,
    marginTop: 4,
    color: "#444",
  },
  // Skills
  skillRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  skillCat: {
    fontFamily: "Times-Bold",
    color: "#1a1a1a",
    width: 95,
  },
  skillItems: {
    flex: 1,
    color: "#2a2a2a",
  },
  // Languages
  langWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  langItem: {
    marginRight: 22,
    marginBottom: 3,
    color: "#2a2a2a",
  },
  summaryText: {
    color: "#2a2a2a",
    textAlign: "justify",
  },
});

export function CVDocument({ cv }: { cv: CVData }) {
  const { personal, summary, skills, experience, education, projects, languages } =
    cv;

  const contactParts = [
    personal.email,
    personal.phone,
    personal.location,
    personal.website,
    personal.linkedin,
    personal.github,
  ].filter(Boolean);

  const filteredSkills = skills.filter((s) => s.category || s.items);
  const filteredExp = experience.filter((e) => e.role || e.company);
  const filteredProjects = projects.filter((p) => p.name);
  const filteredEdu = education.filter((e) => e.degree || e.school);
  const filteredLangs = languages.filter((l) => l.name);

  return (
    <Document
      title={(personal.fullName || cv.name) + " CV"}
      author={personal.fullName || cv.name}
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View>
          <Text style={styles.name}>{personal.fullName || "Your Name"}</Text>
          {personal.title ? (
            <Text style={styles.title}>{personal.title}</Text>
          ) : null}
          {contactParts.length > 0 ? (
            <Text style={styles.contact}>{contactParts.join("   |   ")}</Text>
          ) : null}
          <View style={styles.headerRule} />
        </View>

        {/* SUMMARY */}
        {summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        {/* SKILLS */}
        {filteredSkills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {filteredSkills.map((s) => (
              <View key={s.id} style={styles.skillRow} wrap={false}>
                <Text style={styles.skillCat}>{s.category}</Text>
                <Text style={styles.skillItems}>{s.items}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* EXPERIENCE */}
        {filteredExp.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {filteredExp.map((exp) => (
              <View key={exp.id} style={styles.entry} wrap={false}>
                <View style={styles.rowBetween}>
                  <Text style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.bold}>{exp.role}</Text>
                    {exp.company ? (
                      <Text>
                        {" \u2014 "}
                        <Text style={styles.italic}>{exp.company}</Text>
                      </Text>
                    ) : null}
                  </Text>
                  <Text style={styles.dateText}>
                    {exp.startDate}
                    {exp.startDate || exp.endDate || exp.current ? " \u2013 " : ""}
                    {exp.current ? "Present" : exp.endDate}
                  </Text>
                </View>
                {exp.location ? (
                  <Text style={styles.locationText}>{exp.location}</Text>
                ) : null}
                {exp.bullets
                  .filter((b) => b.trim())
                  .map((b, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>{"\u2022"}</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                {exp.tech ? (
                  <Text style={styles.techLine}>
                    <Text style={styles.bold}>Tech: </Text>
                    {exp.tech}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* PROJECTS */}
        {filteredProjects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {filteredProjects.map((p) => (
              <View key={p.id} style={{ marginBottom: 8 }} wrap={false}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.bold, { flex: 1, paddingRight: 8 }]}>
                    {p.name}
                  </Text>
                  {p.link ? <Text style={styles.dateText}>{p.link}</Text> : null}
                </View>
                {p.description ? (
                  <Text style={{ marginTop: 2, color: "#2a2a2a" }}>
                    {p.description}
                  </Text>
                ) : null}
                {p.tech ? (
                  <Text style={styles.techLine}>
                    <Text style={styles.bold}>Tech: </Text>
                    {p.tech}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* EDUCATION */}
        {filteredEdu.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {filteredEdu.map((edu) => (
              <View key={edu.id} style={{ marginBottom: 8 }} wrap={false}>
                <View style={styles.rowBetween}>
                  <Text style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.bold}>{edu.degree}</Text>
                    {edu.school ? (
                      <Text>
                        {" \u2014 "}
                        <Text style={styles.italic}>{edu.school}</Text>
                      </Text>
                    ) : null}
                  </Text>
                  <Text style={styles.dateText}>
                    {edu.startDate}
                    {edu.startDate || edu.endDate ? " \u2013 " : ""}
                    {edu.endDate}
                  </Text>
                </View>
                {edu.location ? (
                  <Text style={styles.locationText}>{edu.location}</Text>
                ) : null}
                {edu.details ? (
                  <Text style={{ fontSize: 9.5, marginTop: 2, color: "#2a2a2a" }}>
                    {edu.details}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* LANGUAGES */}
        {filteredLangs.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.langWrap}>
              {filteredLangs.map((l) => (
                <Text key={l.id} style={styles.langItem}>
                  <Text style={styles.bold}>{l.name}</Text>
                  {l.level ? <Text style={{ color: "#555" }}> {"\u2014"} {l.level}</Text> : null}
                </Text>
              ))}
            </View>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
