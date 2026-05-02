import type { AiOperation, Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "../client";
import type { AiUsageLog } from "@prisma/client";

export interface AiUsageStats {
  totalOperations: number;
  totalCostUsd: number;
  totalTokens: number;
  byOperation: Record<string, number>;
}

export class AiUsageRepository extends BaseRepository<
  AiUsageLog,
  Prisma.AiUsageLogCreateInput,
  Prisma.AiUsageLogUpdateInput
> {
  constructor() {
    super(prisma);
  }

  findById(id: string) {
    return this.db.aiUsageLog.findUnique({ where: { id } });
  }

  findMany(args?: Prisma.AiUsageLogFindManyArgs) {
    return this.db.aiUsageLog.findMany(args);
  }

  create(data: Prisma.AiUsageLogCreateInput) {
    return this.db.aiUsageLog.create({ data });
  }

  update(id: string, data: Prisma.AiUsageLogUpdateInput) {
    return this.db.aiUsageLog.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.aiUsageLog.delete({ where: { id } });
  }

  count(where?: Prisma.AiUsageLogWhereInput) {
    return this.db.aiUsageLog.count({ where });
  }

  // Count AI operations in the current billing period for a user
  async countThisMonth(userId: string, operation?: AiOperation): Promise<number> {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    return this.db.aiUsageLog.count({
      where: {
        userId,
        ...(operation ? { operation } : {}),
        createdAt: { gte: start },
        success: true,
      },
    });
  }

  // Free tier: 3 total AI uses lifetime
  async countLifetime(userId: string): Promise<number> {
    return this.db.aiUsageLog.count({ where: { userId, success: true } });
  }

  async getStats(userId: string, since?: Date): Promise<AiUsageStats> {
    const where: Prisma.AiUsageLogWhereInput = {
      userId,
      success: true,
      ...(since ? { createdAt: { gte: since } } : {}),
    };

    const [logs, total] = await Promise.all([
      this.db.aiUsageLog.findMany({ where, select: { operation: true, costUsd: true, promptTokens: true, outputTokens: true } }),
      this.db.aiUsageLog.count({ where }),
    ]);

    const byOperation: Record<string, number> = {};
    let totalCostUsd = 0;
    let totalTokens = 0;

    for (const log of logs) {
      byOperation[log.operation] = (byOperation[log.operation] ?? 0) + 1;
      totalCostUsd += log.costUsd;
      totalTokens += log.promptTokens + log.outputTokens;
    }

    return { totalOperations: total, totalCostUsd, totalTokens, byOperation };
  }
}

export const aiUsageRepository = new AiUsageRepository();
