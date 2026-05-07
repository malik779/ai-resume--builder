import type React from "react";
import type { Resume } from "@/types/resume";
import type { TemplateProps } from "./types";

export const SAMPLE_RESUME: Resume = {
  id: "preview", userId: "", templateId: "preview", title: "Preview",
  summary: "Results-driven software engineer with 7+ years building scalable web applications and distributed systems. Passionate about clean architecture and developer experience.",
  personalInfo: {
    firstName: "Alexandra", lastName: "Chen",
    headline: "Senior Software Engineer",
    email: "alex.chen@email.com", phone: "+1 (555) 012-3456",
    location: "San Francisco, CA", linkedinUrl: "linkedin.com/in/alexchen",
    githubUrl: "github.com/alexchen", portfolioUrl: "", photoUrl: "",
  },
  experiences: [
    {
      id: "e1", title: "Senior Software Engineer", company: "Acme Corp",
      location: "San Francisco, CA", startDate: "2021-03", endDate: "", current: true,
      bullets: [
        "Led migration of monolith to microservices, reducing deploy time by 70%",
        "Mentored 4 junior engineers and introduced team code review standards",
        "Built real-time analytics pipeline processing 2M events/day",
      ],
    },
    {
      id: "e2", title: "Software Engineer", company: "StartupXYZ",
      location: "Remote", startDate: "2018-06", endDate: "2021-02", current: false,
      bullets: [
        "Developed React dashboard used by 50K+ monthly active users",
        "Optimised PostgreSQL queries reducing p99 latency from 800ms to 120ms",
      ],
    },
  ],
  educations: [
    {
      id: "ed1", degree: "B.Sc.", field: "Computer Science",
      institution: "UC Berkeley", startDate: "2014-08", endDate: "2018-05",
      current: false, gpa: "3.8", honors: "Magna Cum Laude",
    },
  ],
  skills: [
    { name: "TypeScript" }, { name: "React" }, { name: "Node.js" },
    { name: "PostgreSQL" }, { name: "AWS" }, { name: "Docker" },
    { name: "GraphQL" }, { name: "Python" },
  ],
  projects: [
    {
      id: "p1", name: "OpenMetrics",
      description: "Open-source observability toolkit for Node.js microservices.",
      techStack: ["TypeScript", "Prometheus", "Grafana"], bullets: [],
      url: "github.com/alexchen/openmetrics",
    },
  ],
  certifications: [
    { name: "AWS Solutions Architect", issuer: "Amazon", date: "2022" },
  ],
  languages: [
    { name: "English", proficiency: "Native" },
    { name: "Mandarin", proficiency: "Fluent" },
  ],
  customSections: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as Resume;

export const PREVIEW_CSS_VARS: React.CSSProperties = {
  "--font-primary":       "Georgia",
  "--font-secondary":     "Arial",
  "--size-h1":            "24pt",
  "--size-h2":            "13pt",
  "--size-body":          "10pt",
  "--size-section":       "11pt",
  "--weight-h1":          "700",
  "--weight-h2":          "700",
  "--weight-body":        "400",
  "--line-height":        "1.15",
  "--margin-top":         "0.45in",
  "--margin-lr":          "0.45in",
  "--gap-sections":       "14pt",
  "--gap-title":          "5pt",
  "--gap-content-blocks": "6pt",
  "--gap-inside":         "2pt",
} as React.CSSProperties;

export const PREVIEW_TEMPLATE_PROPS: Omit<TemplateProps, "resume" | "mainColor"> = {
  dateFormat:      "short",
  headerAlignment: "left",
  skillsLayout:    "inline",
  skillsColumns:   4,
  educationLayout: "stacked",
  educationShowBy: "institution",
  sectionOrder:    ["summary","experience","education","projects","skills","certifications","languages"],
};
