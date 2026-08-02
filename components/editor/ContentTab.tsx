"use client";

import { Wand2 } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { TextArea, TextInput, SelectInput } from "@/components/ui/Field";
import ChipInput from "@/components/ui/ChipInput";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Primitives";
import {
  AddEntryButton,
  BulletEditor,
  EntryCard,
  SectionShell,
  SortableGroup,
} from "./parts";
import {
  emptyCertification,
  emptyEducation,
  emptyExperience,
  emptyLanguage,
  emptyProject,
  emptySkillGroup,
} from "@/lib/cv/defaults";
import { EMPLOYMENT_TYPES, LANGUAGE_LEVELS } from "@/types/cv";
import { uid } from "@/lib/uid";
import { formatRange } from "@/lib/cv/format";

const SKILL_SUGGESTIONS: Record<string, string[]> = {
  Languages: ["TypeScript", "Python", "Go", "Java", "SQL"],
  Frontend: ["React", "Next.js", "Tailwind CSS", "Redux", "Vue.js"],
  Backend: ["Node.js", "PostgreSQL", "Redis", "GraphQL", "REST"],
  "Cloud & DevOps": ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
};

export default function ContentTab() {
  const cv = useEditorStore((s) => s.cv);
  const mutate = useEditorStore((s) => s.mutate);

  return (
    <div className="space-y-3">
      {/* ------------------------------------------------------------ */}
      <SectionShell
        title="Contact details"
        description="Every field here is read by the parser before anything else. A missing email or an unparseable phone number is the most common automatic rejection."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Full name"
            value={cv.personal.fullName}
            onChange={(e) =>
              mutate((d) => {
                d.personal.fullName = e.target.value;
              })
            }
            placeholder="Haldun Mammadzada"
          />
          <TextInput
            label="Job title"
            value={cv.personal.title}
            onChange={(e) =>
              mutate((d) => {
                d.personal.title = e.target.value;
              })
            }
            placeholder="Senior Software Engineer"
            hint="Match the posting's exact wording."
          />
          <TextInput
            label="Email"
            type="email"
            value={cv.personal.email}
            onChange={(e) =>
              mutate((d) => {
                d.personal.email = e.target.value;
              })
            }
            placeholder="you@example.com"
          />
          <TextInput
            label="Phone"
            value={cv.personal.phone}
            onChange={(e) =>
              mutate((d) => {
                d.personal.phone = e.target.value;
              })
            }
            placeholder="+994 50 000 00 00"
          />
          <TextInput
            label="Location"
            value={cv.personal.location}
            onChange={(e) =>
              mutate((d) => {
                d.personal.location = e.target.value;
              })
            }
            placeholder="Baku, Azerbaijan (Remote)"
            hint="Add your time zone for remote roles."
          />
          <TextInput
            label="LinkedIn"
            value={cv.personal.linkedin}
            onChange={(e) =>
              mutate((d) => {
                d.personal.linkedin = e.target.value;
              })
            }
            placeholder="linkedin.com/in/yourname"
          />
          <TextInput
            label="GitHub"
            value={cv.personal.github}
            onChange={(e) =>
              mutate((d) => {
                d.personal.github = e.target.value;
              })
            }
            placeholder="github.com/yourname"
          />
          <TextInput
            label="Website"
            value={cv.personal.website}
            onChange={(e) =>
              mutate((d) => {
                d.personal.website = e.target.value;
              })
            }
            placeholder="yourdomain.com"
          />
        </div>
      </SectionShell>

      {/* ------------------------------------------------------------ */}
      <SummarySection />

      {/* ------------------------------------------------------------ */}
      <SectionShell
        title="Skills"
        count={cv.skills.reduce((n, g) => n + g.items.length, 0)}
        description="Group by type and list the concrete nouns: languages, frameworks, platforms, tools. Keyword scanners match nouns, not adjectives."
      >
        <SortableGroup
          items={cv.skills}
          onReorder={(next) =>
            mutate((d) => {
              d.skills = next;
            })
          }
        >
          {cv.skills.map((group, index) => (
            <EntryCard
              key={group.id}
              id={group.id}
              title={group.category || "Untitled group"}
              subtitle={
                group.items.length
                  ? group.items.slice(0, 5).join(", ") +
                    (group.items.length > 5 ? `, +${group.items.length - 5}` : "")
                  : "No skills yet"
              }
              defaultOpen={index === 0}
              onRemove={() =>
                mutate((d) => {
                  d.skills.splice(index, 1);
                })
              }
            >
              <TextInput
                label="Group name"
                value={group.category}
                onChange={(e) =>
                  mutate((d) => {
                    d.skills[index].category = e.target.value;
                  })
                }
                placeholder="Backend"
              />
              <ChipInput
                label="Skills"
                value={group.items}
                onChange={(next) =>
                  mutate((d) => {
                    d.skills[index].items = next;
                  })
                }
                suggestions={SKILL_SUGGESTIONS[group.category] ?? []}
                hint="Press Enter or comma after each one. Pasting a comma-separated list works too."
              />
            </EntryCard>
          ))}
        </SortableGroup>

        <AddEntryButton
          label="Add skill group"
          onClick={() =>
            mutate((d) => {
              d.skills.push(emptySkillGroup(""));
            })
          }
        />
      </SectionShell>

      {/* ------------------------------------------------------------ */}
      <SectionShell
        title="Work experience"
        count={cv.experience.length}
        description="Newest first. Three to six achievement bullets for recent roles, two or three for older ones."
      >
        <SortableGroup
          items={cv.experience}
          onReorder={(next) =>
            mutate((d) => {
              d.experience = next;
            })
          }
        >
          {cv.experience.map((entry, index) => (
            <EntryCard
              key={entry.id}
              id={entry.id}
              title={entry.role || "New role"}
              subtitle={[
                entry.company,
                formatRange(entry.startDate, entry.endDate, entry.current),
              ]
                .filter(Boolean)
                .join(" · ")}
              defaultOpen={index === 0}
              warning={
                entry.bullets.filter((b) => b.trim()).length < 3
                  ? "Fewer than three achievement bullets"
                  : undefined
              }
              onRemove={() =>
                mutate((d) => {
                  d.experience.splice(index, 1);
                })
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Job title"
                  value={entry.role}
                  onChange={(e) =>
                    mutate((d) => {
                      d.experience[index].role = e.target.value;
                    })
                  }
                  placeholder="Senior Software Engineer"
                />
                <TextInput
                  label="Company"
                  value={entry.company}
                  onChange={(e) =>
                    mutate((d) => {
                      d.experience[index].company = e.target.value;
                    })
                  }
                  placeholder="Acme Technologies"
                />
                <TextInput
                  label="Location"
                  value={entry.location}
                  onChange={(e) =>
                    mutate((d) => {
                      d.experience[index].location = e.target.value;
                    })
                  }
                  placeholder="Remote"
                />
                <SelectInput
                  label="Employment type"
                  value={entry.employmentType}
                  onChange={(e) =>
                    mutate((d) => {
                      d.experience[index].employmentType = e.target
                        .value as typeof entry.employmentType;
                    })
                  }
                  options={EMPLOYMENT_TYPES.map((t) => ({
                    value: t,
                    label: t || "Not specified",
                  }))}
                />
                <TextInput
                  label="Start"
                  type="month"
                  value={entry.startDate}
                  onChange={(e) =>
                    mutate((d) => {
                      d.experience[index].startDate = e.target.value;
                    })
                  }
                />
                <TextInput
                  label="End"
                  type="month"
                  value={entry.endDate}
                  disabled={entry.current}
                  onChange={(e) =>
                    mutate((d) => {
                      d.experience[index].endDate = e.target.value;
                    })
                  }
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-700">
                <input
                  type="checkbox"
                  checked={entry.current}
                  onChange={(e) =>
                    mutate((d) => {
                      d.experience[index].current = e.target.checked;
                      if (e.target.checked) d.experience[index].endDate = "";
                    })
                  }
                  className="h-3.5 w-3.5 rounded border-ink-300 accent-ink-900"
                />
                I currently work here
              </label>

              <BulletEditor
                bullets={entry.bullets}
                onChange={(next) =>
                  mutate((d) => {
                    d.experience[index].bullets = next;
                  })
                }
              />

              <ChipInput
                label="Tools used"
                value={entry.tech}
                onChange={(next) =>
                  mutate((d) => {
                    d.experience[index].tech = next;
                  })
                }
                hint="Ties each keyword to a dated role, which is what recency-weighted scanners look for."
              />
            </EntryCard>
          ))}
        </SortableGroup>

        <AddEntryButton
          label="Add role"
          onClick={() =>
            mutate((d) => {
              d.experience.push(emptyExperience());
            })
          }
        />
      </SectionShell>

      {/* ------------------------------------------------------------ */}
      <SectionShell
        title="Projects"
        count={cv.projects.length}
        defaultOpen={false}
        description="Most valuable when you are changing field or early in your career — it is where you prove skills your job history doesn't cover yet."
      >
        <SortableGroup
          items={cv.projects}
          onReorder={(next) =>
            mutate((d) => {
              d.projects = next;
            })
          }
        >
          {cv.projects.map((entry, index) => (
            <EntryCard
              key={entry.id}
              id={entry.id}
              title={entry.name || "New project"}
              subtitle={entry.tech.slice(0, 4).join(", ")}
              onRemove={() =>
                mutate((d) => {
                  d.projects.splice(index, 1);
                })
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Name"
                  value={entry.name}
                  onChange={(e) =>
                    mutate((d) => {
                      d.projects[index].name = e.target.value;
                    })
                  }
                  placeholder="OpenResume Analyzer"
                />
                <TextInput
                  label="Your role"
                  value={entry.role}
                  onChange={(e) =>
                    mutate((d) => {
                      d.projects[index].role = e.target.value;
                    })
                  }
                  placeholder="Creator"
                />
                <TextInput
                  label="Link"
                  value={entry.link}
                  onChange={(e) =>
                    mutate((d) => {
                      d.projects[index].link = e.target.value;
                    })
                  }
                  placeholder="github.com/yourname/project"
                />
                <TextInput
                  label="Start"
                  type="month"
                  value={entry.startDate}
                  onChange={(e) =>
                    mutate((d) => {
                      d.projects[index].startDate = e.target.value;
                    })
                  }
                />
              </div>

              <TextArea
                label="One-line description"
                value={entry.description}
                onChange={(e) =>
                  mutate((d) => {
                    d.projects[index].description = e.target.value;
                  })
                }
                rows={2}
                placeholder="Open-source tool that scores resumes against job descriptions."
              />

              <BulletEditor
                bullets={entry.bullets.length ? entry.bullets : [""]}
                onChange={(next) =>
                  mutate((d) => {
                    d.projects[index].bullets = next;
                  })
                }
                placeholder="Used by 1,200+ developers with 340 GitHub stars in six months"
              />

              <ChipInput
                label="Tech used"
                value={entry.tech}
                onChange={(next) =>
                  mutate((d) => {
                    d.projects[index].tech = next;
                  })
                }
              />
            </EntryCard>
          ))}
        </SortableGroup>

        <AddEntryButton
          label="Add project"
          onClick={() =>
            mutate((d) => {
              d.projects.push(emptyProject());
            })
          }
        />
      </SectionShell>

      {/* ------------------------------------------------------------ */}
      <SectionShell
        title="Education"
        count={cv.education.length}
        defaultOpen={false}
      >
        <SortableGroup
          items={cv.education}
          onReorder={(next) =>
            mutate((d) => {
              d.education = next;
            })
          }
        >
          {cv.education.map((entry, index) => (
            <EntryCard
              key={entry.id}
              id={entry.id}
              title={entry.degree || "New qualification"}
              subtitle={entry.school}
              onRemove={() =>
                mutate((d) => {
                  d.education.splice(index, 1);
                })
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Degree"
                  value={entry.degree}
                  onChange={(e) =>
                    mutate((d) => {
                      d.education[index].degree = e.target.value;
                    })
                  }
                  placeholder="Bachelor of Science"
                />
                <TextInput
                  label="Field of study"
                  value={entry.field}
                  onChange={(e) =>
                    mutate((d) => {
                      d.education[index].field = e.target.value;
                    })
                  }
                  placeholder="Computer Science"
                />
                <TextInput
                  label="Institution"
                  value={entry.school}
                  onChange={(e) =>
                    mutate((d) => {
                      d.education[index].school = e.target.value;
                    })
                  }
                  placeholder="Baku State University"
                />
                <TextInput
                  label="Location"
                  value={entry.location}
                  onChange={(e) =>
                    mutate((d) => {
                      d.education[index].location = e.target.value;
                    })
                  }
                  placeholder="Baku, Azerbaijan"
                />
                <TextInput
                  label="Start"
                  type="month"
                  value={entry.startDate}
                  onChange={(e) =>
                    mutate((d) => {
                      d.education[index].startDate = e.target.value;
                    })
                  }
                />
                <TextInput
                  label="End"
                  type="month"
                  value={entry.endDate}
                  onChange={(e) =>
                    mutate((d) => {
                      d.education[index].endDate = e.target.value;
                    })
                  }
                />
              </div>

              <TextArea
                label="Notes"
                value={entry.details}
                onChange={(e) =>
                  mutate((d) => {
                    d.education[index].details = e.target.value;
                  })
                }
                rows={2}
                placeholder="Thesis, honours, relevant coursework — leave blank if you have work experience."
              />
            </EntryCard>
          ))}
        </SortableGroup>

        <AddEntryButton
          label="Add education"
          onClick={() =>
            mutate((d) => {
              d.education.push(emptyEducation());
            })
          }
        />
      </SectionShell>

      {/* ------------------------------------------------------------ */}
      <SectionShell
        title="Certifications"
        count={cv.certifications.length}
        defaultOpen={false}
        description="Name them exactly as the issuer does — scanners match the official string, not an abbreviation."
      >
        <SortableGroup
          items={cv.certifications}
          onReorder={(next) =>
            mutate((d) => {
              d.certifications = next;
            })
          }
        >
          {cv.certifications.map((entry, index) => (
            <EntryCard
              key={entry.id}
              id={entry.id}
              title={entry.name || "New certification"}
              subtitle={entry.issuer}
              onRemove={() =>
                mutate((d) => {
                  d.certifications.splice(index, 1);
                })
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Name"
                  value={entry.name}
                  onChange={(e) =>
                    mutate((d) => {
                      d.certifications[index].name = e.target.value;
                    })
                  }
                  placeholder="AWS Certified Solutions Architect – Associate"
                />
                <TextInput
                  label="Issuer"
                  value={entry.issuer}
                  onChange={(e) =>
                    mutate((d) => {
                      d.certifications[index].issuer = e.target.value;
                    })
                  }
                  placeholder="Amazon Web Services"
                />
                <TextInput
                  label="Issued"
                  type="month"
                  value={entry.issueDate}
                  onChange={(e) =>
                    mutate((d) => {
                      d.certifications[index].issueDate = e.target.value;
                    })
                  }
                />
                <TextInput
                  label="Expires"
                  type="month"
                  value={entry.expiryDate}
                  onChange={(e) =>
                    mutate((d) => {
                      d.certifications[index].expiryDate = e.target.value;
                    })
                  }
                />
              </div>
            </EntryCard>
          ))}
        </SortableGroup>

        <AddEntryButton
          label="Add certification"
          onClick={() =>
            mutate((d) => {
              d.certifications.push(emptyCertification());
            })
          }
        />
      </SectionShell>

      {/* ------------------------------------------------------------ */}
      <SectionShell
        title="Languages"
        count={cv.languages.length}
        defaultOpen={false}
        description="CEFR levels read as precise. For remote roles, English proficiency is often a hard filter."
      >
        <div className="space-y-2">
          {cv.languages.map((entry, index) => (
            <div key={entry.id} className="flex items-end gap-2">
              <TextInput
                wrapperClassName="flex-1"
                label={index === 0 ? "Language" : undefined}
                value={entry.name}
                onChange={(e) =>
                  mutate((d) => {
                    d.languages[index].name = e.target.value;
                  })
                }
                placeholder="English"
              />
              <SelectInput
                wrapperClassName="w-28"
                label={index === 0 ? "Level" : undefined}
                value={entry.level}
                onChange={(e) =>
                  mutate((d) => {
                    d.languages[index].level = e.target
                      .value as typeof entry.level;
                  })
                }
                options={LANGUAGE_LEVELS.map((l) => ({ value: l, label: l }))}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  mutate((d) => {
                    d.languages.splice(index, 1);
                  })
                }
                aria-label="Remove language"
              >
                ×
              </Button>
            </div>
          ))}
        </div>

        <AddEntryButton
          label="Add language"
          onClick={() =>
            mutate((d) => {
              d.languages.push(emptyLanguage());
            })
          }
        />
      </SectionShell>

      {/* ------------------------------------------------------------ */}
      <SectionShell
        title="Awards"
        count={cv.awards.length}
        defaultOpen={false}
      >
        <SortableGroup
          items={cv.awards}
          onReorder={(next) =>
            mutate((d) => {
              d.awards = next;
            })
          }
        >
          {cv.awards.map((entry, index) => (
            <EntryCard
              key={entry.id}
              id={entry.id}
              title={entry.title || "New award"}
              subtitle={entry.issuer}
              onRemove={() =>
                mutate((d) => {
                  d.awards.splice(index, 1);
                })
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Title"
                  value={entry.title}
                  onChange={(e) =>
                    mutate((d) => {
                      d.awards[index].title = e.target.value;
                    })
                  }
                />
                <TextInput
                  label="Issuer"
                  value={entry.issuer}
                  onChange={(e) =>
                    mutate((d) => {
                      d.awards[index].issuer = e.target.value;
                    })
                  }
                />
              </div>
              <TextArea
                label="Description"
                rows={2}
                value={entry.description}
                onChange={(e) =>
                  mutate((d) => {
                    d.awards[index].description = e.target.value;
                  })
                }
              />
            </EntryCard>
          ))}
        </SortableGroup>

        <AddEntryButton
          label="Add award"
          onClick={() =>
            mutate((d) => {
              d.awards.push({
                id: uid(),
                title: "",
                issuer: "",
                date: "",
                description: "",
              });
            })
          }
        />
      </SectionShell>
    </div>
  );
}

/** Split out because it owns the live word-count feedback. */
function SummarySection() {
  const summary = useEditorStore((s) => s.cv.summary);
  const targetRole = useEditorStore((s) => s.cv.meta.targetRole);
  const personalTitle = useEditorStore((s) => s.cv.personal.title);
  const mutate = useEditorStore((s) => s.mutate);

  const wordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0;
  const inRange = wordCount >= 40 && wordCount <= 90;

  const scaffold = () => {
    const role = personalTitle || targetRole || "[your role]";
    mutate((d) => {
      d.summary =
        `${role} with [X] years of experience in [domain]. ` +
        `[Strongest measurable result — what changed, and by how much]. ` +
        `[Second proof point, ideally a different skill]. ` +
        `Looking for [type of role] where I can [what you want to own].`;
    });
  };

  return (
    <SectionShell
      title="Professional summary"
      description="Three or four sentences. This is the only part a human reliably reads in full, and it is where a scanner picks up your headline keywords."
      headerRight={
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
            inRange
              ? "bg-pass/10 text-pass"
              : wordCount
                ? "bg-warn/10 text-warn"
                : "bg-ink-100 text-ink-500"
          }`}
        >
          {wordCount} words
        </span>
      }
    >
      <TextArea
        value={summary}
        onChange={(e) =>
          mutate((d) => {
            d.summary = e.target.value;
          })
        }
        rows={5}
        placeholder="Senior software engineer with 6+ years building production web applications with TypeScript and Node.js…"
        hint="Target 40–90 words. Lead with seniority and domain, then your single strongest number."
        action={
          !summary && (
            <button
              type="button"
              onClick={scaffold}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:underline"
            >
              <Wand2 className="h-3 w-3" />
              Insert scaffold
            </button>
          )
        }
      />

      {wordCount > 0 && !inRange && (
        <div className="mt-2">
          <Badge tone="warn">
            {wordCount < 40
              ? "Too short to carry your keywords"
              : "Too long — a recruiter will skip to the bullets"}
          </Badge>
        </div>
      )}
    </SectionShell>
  );
}
