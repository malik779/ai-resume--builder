import type { Prisma, Resume } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "../client";

export type ResumeWithRelations = Prisma.ResumeGetPayload<{
  include: { experiences: true; educations: true; projects: true };
}>;

export class ResumeRepository extends BaseRepository<
  Resume,
  Prisma.ResumeCreateInput,
  Prisma.ResumeUpdateInput
> {
  constructor() {
    super(prisma);
  }

  findById(id: string) {
    return this.db.resume.findUnique({ where: { id } });
  }

  findByIdWithRelations(id: string): Promise<ResumeWithRelations | null> {
    return this.db.resume.findUnique({
      where: { id },
      include: { experiences: { orderBy: { order: "asc" } }, educations: { orderBy: { order: "asc" } }, projects: { orderBy: { order: "asc" } } },
    });
  }

  findByIdAndUser(id: string, userId: string) {
    return this.db.resume.findFirst({ where: { id, userId } });
  }

  findByUser(userId: string) {
    return this.db.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { experiences: true, versions: true } } },
    });
  }

  findMany(args?: Prisma.ResumeFindManyArgs) {
    return this.db.resume.findMany(args);
  }

  create(data: Prisma.ResumeCreateInput) {
    return this.db.resume.create({ data });
  }

  update(id: string, data: Prisma.ResumeUpdateInput) {
    return this.db.resume.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.resume.delete({ where: { id } });
  }

  count(where?: Prisma.ResumeWhereInput) {
    return this.db.resume.count({ where });
  }

  async createVersion(resumeId: string, label?: string) {
    const resume = await this.findByIdWithRelations(resumeId);
    if (!resume) throw new Error("Resume not found");

    const lastVersion = await this.db.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { version: "desc" },
    });

    return this.db.resumeVersion.create({
      data: {
        resumeId,
        version: (lastVersion?.version ?? 0) + 1,
        label,
        snapshot: resume as unknown as Prisma.InputJsonValue,
      },
    });
  }

  listVersions(resumeId: string) {
    return this.db.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { version: "desc" },
    });
  }
}

export const resumeRepository = new ResumeRepository();
