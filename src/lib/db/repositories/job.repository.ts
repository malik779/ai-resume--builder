import type { Prisma, LinkedInJob, JobApplication } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "../client";

export class JobRepository extends BaseRepository<
  LinkedInJob,
  Prisma.LinkedInJobCreateInput,
  Prisma.LinkedInJobUpdateInput
> {
  constructor() {
    super(prisma);
  }

  findById(id: string) {
    return this.db.linkedInJob.findUnique({ where: { id } });
  }

  findByLinkedinId(linkedinId: string) {
    return this.db.linkedInJob.findUnique({ where: { linkedinId } });
  }

  findMany(args?: Prisma.LinkedInJobFindManyArgs) {
    return this.db.linkedInJob.findMany(args);
  }

  findBySearch(jobSearchId: string, minMatch?: number) {
    return this.db.linkedInJob.findMany({
      where: {
        jobSearchId,
        ...(minMatch ? { matchPercentage: { gte: minMatch } } : {}),
      },
      orderBy: [{ matchPercentage: "desc" }, { postedAt: "desc" }],
    });
  }

  create(data: Prisma.LinkedInJobCreateInput) {
    return this.db.linkedInJob.create({ data });
  }

  update(id: string, data: Prisma.LinkedInJobUpdateInput) {
    return this.db.linkedInJob.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.linkedInJob.delete({ where: { id } });
  }

  count(where?: Prisma.LinkedInJobWhereInput) {
    return this.db.linkedInJob.count({ where });
  }

  upsertByLinkedinId(linkedinId: string, data: Prisma.LinkedInJobCreateInput) {
    return this.db.linkedInJob.upsert({
      where: { linkedinId },
      create: data,
      update: { title: data.title, company: data.company, description: data.description, applicantsCount: data.applicantsCount },
    });
  }
}

export class ApplicationRepository extends BaseRepository<
  JobApplication,
  Prisma.JobApplicationCreateInput,
  Prisma.JobApplicationUpdateInput
> {
  constructor() {
    super(prisma);
  }

  findById(id: string) {
    return this.db.jobApplication.findUnique({ where: { id }, include: { job: true, resume: true } });
  }

  findByUser(userId: string) {
    return this.db.jobApplication.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { job: true },
    });
  }

  findMany(args?: Prisma.JobApplicationFindManyArgs) {
    return this.db.jobApplication.findMany(args);
  }

  create(data: Prisma.JobApplicationCreateInput) {
    return this.db.jobApplication.create({ data });
  }

  update(id: string, data: Prisma.JobApplicationUpdateInput) {
    return this.db.jobApplication.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.jobApplication.delete({ where: { id } });
  }

  count(where?: Prisma.JobApplicationWhereInput) {
    return this.db.jobApplication.count({ where });
  }

  // Enterprise: count auto-apply uses this month
  async countAutoApplyThisMonth(userId: string): Promise<number> {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return this.db.jobApplication.count({
      where: { userId, autoApplyStarted: true, createdAt: { gte: start } },
    });
  }
}

export const jobRepository = new JobRepository();
export const applicationRepository = new ApplicationRepository();
