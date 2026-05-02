"use client";

import { useResumeStore } from "@/stores/resume.store";
import { cn } from "@/lib/utils/cn";
import { Mail, Phone, MapPin, Linkedin, Github, Globe } from "lucide-react";

interface ResumePreviewProps {
  watermark?: boolean;
}

// Live preview — renders the resume in the browser using the current store state.
// This mirrors the PDF output so what you see is what you export.
export function ResumePreview({ watermark = false }: ResumePreviewProps) {
  const { resume } = useResumeStore();

  if (!resume) return (
    <div className="flex h-full items-center justify-center text-sm text-gray-400">
      Loading preview...
    </div>
  );

  const info = resume.personalInfo;
  const fullName = [info.firstName, info.lastName].filter(Boolean).join(" ") || "Your Name";

  return (
    <div className={cn("relative bg-white", watermark && "watermark")}>
      {/* A4 ratio container */}
      <div className="mx-auto max-w-[794px] min-h-[1123px] p-12 font-['Helvetica_Neue',_sans-serif] text-[10pt] text-gray-800 shadow-lg">

        {/* Header */}
        <header className="mb-6 border-b border-gray-200 pb-5">
          <h1 className="text-[26pt] font-bold text-gray-900 leading-none">{fullName}</h1>
          {info.headline && (
            <p className="mt-1 text-[11pt] text-gray-500">{info.headline}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9pt] text-gray-500">
            {info.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{info.email}</span>}
            {info.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{info.phone}</span>}
            {info.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{info.location}</span>}
            {info.linkedinUrl && <span className="flex items-center gap-1"><Linkedin className="h-3 w-3" />{info.linkedinUrl.replace("https://linkedin.com/in/", "")}</span>}
            {info.githubUrl && <span className="flex items-center gap-1"><Github className="h-3 w-3" />{info.githubUrl.replace("https://github.com/", "")}</span>}
            {info.portfolioUrl && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{info.portfolioUrl}</span>}
          </div>
        </header>

        {/* Summary */}
        {resume.summary && (
          <Section title="Professional Summary">
            <p className="leading-relaxed text-gray-700">{resume.summary}</p>
          </Section>
        )}

        {/* Experience */}
        {resume.experiences.length > 0 && (
          <Section title="Experience">
            <div className="space-y-5">
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-bold text-gray-900">{exp.title}</span>
                      {exp.company && <span className="text-gray-600"> — {exp.company}</span>}
                    </div>
                    <span className="text-[9pt] text-gray-400 whitespace-nowrap ml-4">
                      {exp.startDate} – {exp.current ? "Present" : (exp.endDate ?? "")}
                    </span>
                  </div>
                  {exp.location && <p className="text-[9pt] text-gray-400 mb-1">{exp.location}</p>}
                  {exp.bullets.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {exp.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                          <span className="leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Education */}
        {resume.educations.length > 0 && (
          <Section title="Education">
            <div className="space-y-3">
              {resume.educations.map((edu) => (
                <div key={edu.id} className="flex items-baseline justify-between">
                  <div>
                    <span className="font-bold text-gray-900">{edu.degree}</span>
                    {edu.field && <span className="text-gray-600"> in {edu.field}</span>}
                    <span className="text-gray-600"> — {edu.institution}</span>
                    {edu.honors && <p className="text-[9pt] text-gray-400">{edu.honors}</p>}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-[9pt] text-gray-400">{edu.startDate} – {edu.current ? "Present" : (edu.endDate ?? "")}</p>
                    {edu.gpa && <p className="text-[9pt] text-gray-400">GPA: {edu.gpa}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <Section title="Projects">
            <div className="space-y-3">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-900">{proj.name}</span>
                    {proj.techStack.length > 0 && (
                      <span className="text-[9pt] text-gray-400">({proj.techStack.join(", ")})</span>
                    )}
                  </div>
                  {proj.description && <p className="text-gray-600">{proj.description}</p>}
                  {proj.bullets.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {proj.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                          <span className="leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {resume.skills.map((skill) => (
                <span key={skill.name} className="text-gray-700">{skill.name}</span>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-[10pt] font-bold uppercase tracking-widest text-blue-700 border-b border-blue-100 pb-1">
        {title}
      </h2>
      {children}
    </section>
  );
}
