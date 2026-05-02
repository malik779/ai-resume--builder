import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Demo user for local development
  const user = await db.user.upsert({
    where: { email: "demo@resumeaipro.com" },
    update: {},
    create: {
      email: "demo@resumeaipro.com",
      name: "Demo User",
      subscription: {
        create: {
          tier: "PRO",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Sample resume
  const resume = await db.resume.upsert({
    where: { id: "seed-resume-1" },
    update: {},
    create: {
      id: "seed-resume-1",
      userId: user.id,
      title: "Senior Software Engineer",
      templateId: "modern",
      summary: "Results-driven software engineer with 8+ years building scalable distributed systems at high-growth startups. Led teams of 4-8 engineers, shipped products used by 2M+ users, and reduced infrastructure costs by 40%.",
      personalInfo: {
        firstName: "Demo",
        lastName: "User",
        email: "demo@resumeaipro.com",
        phone: "+1 (555) 000-0000",
        location: "San Francisco, CA",
        linkedinUrl: "https://linkedin.com/in/demouser",
        githubUrl: "https://github.com/demouser",
        headline: "Senior Software Engineer | Distributed Systems | React | Go",
      },
      skills: [
        { name: "TypeScript", category: "technical" },
        { name: "React", category: "technical" },
        { name: "Go", category: "technical" },
        { name: "PostgreSQL", category: "technical" },
        { name: "Kubernetes", category: "technical" },
        { name: "AWS", category: "technical" },
      ],
      experiences: {
        create: [
          {
            company: "TechCorp Inc.",
            title: "Senior Software Engineer",
            location: "San Francisco, CA",
            startDate: "Jan 2021",
            current: true,
            bullets: [
              "Led architecture of microservices platform serving 2M+ daily active users, achieving 99.97% uptime",
              "Reduced API response time by 60% through Redis caching layer and query optimization",
              "Mentored 4 junior engineers, establishing code review practices that cut bug rate by 35%",
            ],
            order: 0,
          },
          {
            company: "StartupXYZ",
            title: "Software Engineer",
            location: "New York, NY",
            startDate: "Mar 2018",
            endDate: "Dec 2020",
            current: false,
            bullets: [
              "Built real-time data pipeline processing 10M events/day using Kafka and Go",
              "Shipped React dashboard used by 500+ enterprise customers",
            ],
            order: 1,
          },
        ],
      },
    },
  });

  console.log(`✅ Seeded user: ${user.email}`);
  console.log(`✅ Seeded resume: ${resume.title}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
