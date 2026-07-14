"use client";

import { CVData } from "@/types/cv";

interface Props {
  cv: CVData;
  forPrint?: boolean;
}

export default function CVPreview({ cv, forPrint = false }: Props) {
  const {
    personal,
    summary,
    skills,
    experience,
    education,
    projects,
    languages,
  } = cv;

  const contactParts = [
    personal.email,
    personal.phone,
    personal.location,
    personal.website,
    personal.linkedin,
    personal.github,
  ].filter(Boolean);

  return (
    <div id={forPrint ? "cv-print" : undefined}>
      <div className="cv-page">
        {/* ===== HEADER ===== */}
        <header className="cv-section" style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "22pt",
              fontWeight: 700,
              letterSpacing: "2px",
              lineHeight: 1.1,
              margin: 0,
              textTransform: "uppercase",
              color: "#111",
            }}
          >
            {personal.fullName || "Your Name"}
          </h1>

          {personal.title && (
            <p
              style={{
                fontSize: "11pt",
                color: "#555",
                margin: "5px 0 0",
                letterSpacing: "1px",
                textTransform: "uppercase",
                fontWeight: 400,
              }}
            >
              {personal.title}
            </p>
          )}

          {contactParts.length > 0 && (
            <p
              style={{
                fontSize: "8.8pt",
                color: "#666",
                margin: "9px 0 0",
                lineHeight: 1.6,
                letterSpacing: "0.2px",
              }}
            >
              {contactParts.join("   |   ")}
            </p>
          )}

          <div
            style={{
              borderBottom: "2px solid #1a1a1a",
              marginTop: "13px",
            }}
          />
        </header>

        {/* ===== SUMMARY ===== */}
        {summary && (
          <Section title="Summary">
            <p style={{ margin: 0, textAlign: "justify", color: "#2a2a2a" }}>
              {summary}
            </p>
          </Section>
        )}

        {/* ===== SKILLS ===== */}
        {skills.some((s) => s.category || s.items) && (
          <Section title="Skills">
            <table
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <tbody>
                {skills
                  .filter((s) => s.category || s.items)
                  .map((s) => (
                    <tr key={s.id} className="cv-entry">
                      <td
                        style={{
                          fontWeight: 700,
                          verticalAlign: "top",
                          whiteSpace: "nowrap",
                          paddingRight: "12px",
                          paddingBottom: "4px",
                          width: "1%",
                          color: "#1a1a1a",
                        }}
                      >
                        {s.category}
                      </td>
                      <td
                        style={{
                          verticalAlign: "top",
                          paddingBottom: "4px",
                          color: "#2a2a2a",
                        }}
                      >
                        {s.items}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* ===== EXPERIENCE ===== */}
        {experience.some((e) => e.role || e.company) && (
          <Section title="Work Experience">
            {experience
              .filter((e) => e.role || e.company)
              .map((exp) => (
                <div
                  key={exp.id}
                  className="cv-entry"
                  style={{ marginBottom: "12px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "12px",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#1a1a1a" }}>
                      {exp.role}
                      {exp.company && (
                        <span style={{ fontWeight: 400 }}>
                          {" \u2014 "}
                          <span style={{ fontStyle: "italic" }}>
                            {exp.company}
                          </span>
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "9pt",
                        color: "#666",
                        whiteSpace: "nowrap",
                        fontStyle: "italic",
                      }}
                    >
                      {exp.startDate}
                      {(exp.startDate || exp.endDate || exp.current) &&
                        " \u2013 "}
                      {exp.current ? "Present" : exp.endDate}
                    </div>
                  </div>

                  {exp.location && (
                    <div
                      style={{
                        fontSize: "9pt",
                        color: "#777",
                        marginTop: "1px",
                      }}
                    >
                      {exp.location}
                    </div>
                  )}

                  {exp.bullets.filter((b) => b.trim()).length > 0 && (
                    <ul
                      style={{
                        margin: "6px 0 0",
                        paddingLeft: "0",
                        listStyle: "none",
                      }}
                    >
                      {exp.bullets
                        .filter((b) => b.trim())
                        .map((b, i) => (
                          <li
                            key={i}
                            style={{
                              position: "relative",
                              paddingLeft: "15px",
                              marginBottom: "3.5px",
                              color: "#2a2a2a",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: "3px",
                                top: "0",
                                color: "#444",
                              }}
                            >
                              {"\u2022"}
                            </span>
                            {b}
                          </li>
                        ))}
                    </ul>
                  )}

                  {exp.tech && (
                    <div
                      style={{
                        fontSize: "9.5pt",
                        marginTop: "5px",
                        color: "#444",
                      }}
                    >
                      <span style={{ fontWeight: 700, color: "#1a1a1a" }}>
                        Tech:
                      </span>{" "}
                      {exp.tech}
                    </div>
                  )}
                </div>
              ))}
          </Section>
        )}

        {/* ===== PROJECTS ===== */}
        {projects.some((p) => p.name) && (
          <Section title="Projects">
            {projects
              .filter((p) => p.name)
              .map((p) => (
                <div
                  key={p.id}
                  className="cv-entry"
                  style={{ marginBottom: "9px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "#1a1a1a" }}>
                      {p.name}
                    </span>
                    {p.link && (
                      <span
                        style={{
                          fontSize: "9pt",
                          color: "#666",
                          whiteSpace: "nowrap",
                          fontStyle: "italic",
                        }}
                      >
                        {p.link}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p style={{ margin: "2px 0 0", color: "#2a2a2a" }}>
                      {p.description}
                    </p>
                  )}
                  {p.tech && (
                    <div
                      style={{
                        fontSize: "9.5pt",
                        marginTop: "2px",
                        color: "#444",
                      }}
                    >
                      <span style={{ fontWeight: 700, color: "#1a1a1a" }}>
                        Tech:
                      </span>{" "}
                      {p.tech}
                    </div>
                  )}
                </div>
              ))}
          </Section>
        )}

        {/* ===== EDUCATION ===== */}
        {education.some((e) => e.degree || e.school) && (
          <Section title="Education">
            {education
              .filter((e) => e.degree || e.school)
              .map((edu) => (
                <div
                  key={edu.id}
                  className="cv-entry"
                  style={{ marginBottom: "8px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "12px",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#1a1a1a" }}>
                      {edu.degree}
                      {edu.school && (
                        <span style={{ fontWeight: 400 }}>
                          {" \u2014 "}
                          <span style={{ fontStyle: "italic" }}>
                            {edu.school}
                          </span>
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "9pt",
                        color: "#666",
                        whiteSpace: "nowrap",
                        fontStyle: "italic",
                      }}
                    >
                      {edu.startDate}
                      {(edu.startDate || edu.endDate) && " \u2013 "}
                      {edu.endDate}
                    </div>
                  </div>
                  {edu.location && (
                    <div
                      style={{
                        fontSize: "9pt",
                        color: "#777",
                      }}
                    >
                      {edu.location}
                    </div>
                  )}
                  {edu.details && (
                    <div
                      style={{
                        fontSize: "9.5pt",
                        marginTop: "2px",
                        color: "#2a2a2a",
                      }}
                    >
                      {edu.details}
                    </div>
                  )}
                </div>
              ))}
          </Section>
        )}

        {/* ===== LANGUAGES ===== */}
        {languages.some((l) => l.name) && (
          <Section title="Languages">
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: "5px 26px" }}
            >
              {languages
                .filter((l) => l.name)
                .map((l) => (
                  <div key={l.id} style={{ color: "#2a2a2a" }}>
                    <span style={{ fontWeight: 700, color: "#1a1a1a" }}>
                      {l.name}
                    </span>
                    {l.level && (
                      <span style={{ color: "#555" }}> {"\u2014"} {l.level}</span>
                    )}
                  </div>
                ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cv-section" style={{ marginTop: "15px" }}>
      <h2
        style={{
          fontSize: "10.5pt",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          borderBottom: "1px solid #aaa",
          paddingBottom: "3px",
          marginBottom: "8px",
          color: "#111",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
