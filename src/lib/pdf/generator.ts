import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import type { ResumeWithRelations } from "@/lib/db/repositories/resume.repository";

// ─────────────────────────────────────────────────────────────────────────────
// PDF generation delegates to @react-pdf/renderer (via a React component).
// We import it lazily to keep the API route bundle lean and avoid SSR issues.
// DOCX generation uses the pure-Node `docx` library.
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePDF(resume: ResumeWithRelations): Promise<Buffer> {
  // Dynamic import keeps React PDF out of server startup cost
  const { renderToBuffer, Document: PDFDocument, Page, View, Text, StyleSheet } = await import("@react-pdf/renderer");
  const React = await import("react");

  const personalInfo = resume.personalInfo as Record<string, string>;
  const skills = (resume.skills as unknown as Array<{ name: string }>) ?? [];

  const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a" },
    header: { marginBottom: 16 },
    name: { fontSize: 22, fontWeight: "bold", marginBottom: 2 },
    headline: { fontSize: 11, color: "#4B5563", marginBottom: 4 },
    contact: { fontSize: 9, color: "#6B7280", marginBottom: 8 },
    divider: { borderBottomWidth: 1, borderBottomColor: "#E5E7EB", marginBottom: 10 },
    sectionTitle: { fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, color: "#1D4ED8", marginBottom: 6, marginTop: 10 },
    expHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
    expCompany: { fontWeight: "bold", fontSize: 10 },
    expDate: { fontSize: 9, color: "#6B7280" },
    bullet: { marginLeft: 10, marginBottom: 2, lineHeight: 1.4 },
    skillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
    skillPill: { backgroundColor: "#EFF6FF", color: "#1D4ED8", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, marginRight: 4, marginBottom: 4 },
  });

  const fullName = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(" ") || "Your Name";
  const contactLine = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedinUrl].filter(Boolean).join(" · ");

  const doc = React.createElement(PDFDocument, null,
    React.createElement(Page, { size: "A4", style: styles.page },
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.name }, fullName),
        personalInfo.headline && React.createElement(Text, { style: styles.headline }, personalInfo.headline),
        React.createElement(Text, { style: styles.contact }, contactLine),
      ),
      React.createElement(View, { style: styles.divider }),

      resume.summary && React.createElement(View, null,
        React.createElement(Text, { style: styles.sectionTitle }, "Professional Summary"),
        React.createElement(Text, { style: { marginBottom: 8, lineHeight: 1.5 } }, resume.summary),
      ),

      resume.experiences.length > 0 && React.createElement(View, null,
        React.createElement(Text, { style: styles.sectionTitle }, "Experience"),
        ...resume.experiences.map((exp) =>
          React.createElement(View, { key: exp.id, style: { marginBottom: 8 } },
            React.createElement(View, { style: styles.expHeader },
              React.createElement(Text, { style: styles.expCompany }, `${exp.title} — ${exp.company}`),
              React.createElement(Text, { style: styles.expDate }, `${exp.startDate} – ${exp.current ? "Present" : (exp.endDate ?? "")}`),
            ),
            ...(exp.bullets as string[]).map((b, i) =>
              React.createElement(Text, { key: i, style: styles.bullet }, `• ${b}`)
            ),
          )
        ),
      ),

      resume.educations.length > 0 && React.createElement(View, null,
        React.createElement(Text, { style: styles.sectionTitle }, "Education"),
        ...resume.educations.map((edu) =>
          React.createElement(View, { key: edu.id, style: { marginBottom: 6 } },
            React.createElement(View, { style: styles.expHeader },
              React.createElement(Text, { style: styles.expCompany }, `${edu.degree}${edu.field ? ` in ${edu.field}` : ""} — ${edu.institution}`),
              React.createElement(Text, { style: styles.expDate }, `${edu.startDate} – ${edu.current ? "Present" : (edu.endDate ?? "")}`),
            ),
          )
        ),
      ),

      skills.length > 0 && React.createElement(View, null,
        React.createElement(Text, { style: styles.sectionTitle }, "Skills"),
        React.createElement(View, { style: styles.skillGrid },
          ...skills.map((s, i) =>
            React.createElement(Text, { key: i, style: styles.skillPill }, s.name)
          ),
        ),
      ),
    )
  );

  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}

export async function generateDOCX(resume: ResumeWithRelations): Promise<Buffer> {
  const personalInfo = resume.personalInfo as Record<string, string>;
  const fullName = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(" ") || "Your Name";

  const children: Paragraph[] = [
    new Paragraph({
      text: fullName,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(" | "), size: 20, color: "555555" }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  if (resume.summary) {
    children.push(new Paragraph({ text: "PROFESSIONAL SUMMARY", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: resume.summary }));
    children.push(new Paragraph({ text: "" }));
  }

  if (resume.experiences.length > 0) {
    children.push(new Paragraph({ text: "EXPERIENCE", heading: HeadingLevel.HEADING_2 }));
    for (const exp of resume.experiences) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${exp.title} — ${exp.company}`, bold: true }),
          new TextRun({ text: `\t${exp.startDate} – ${exp.current ? "Present" : (exp.endDate ?? "")}`, color: "666666" }),
        ],
      }));
      for (const bullet of exp.bullets as string[]) {
        children.push(new Paragraph({ text: `• ${bullet}`, indent: { left: 360 } }));
      }
      children.push(new Paragraph({ text: "" }));
    }
  }

  if (resume.educations.length > 0) {
    children.push(new Paragraph({ text: "EDUCATION", heading: HeadingLevel.HEADING_2 }));
    for (const edu of resume.educations) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ""} — ${edu.institution}`, bold: true }),
        ],
      }));
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
