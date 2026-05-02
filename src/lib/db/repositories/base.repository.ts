import type { PrismaClient } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Generic repository interface — the contract every concrete repo must satisfy.
// Switching databases means swapping the Prisma datasource, not this interface.
// ─────────────────────────────────────────────────────────────────────────────

export interface IBaseRepository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>;
  findMany(args?: object): Promise<T[]>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<T>;
  count(where?: object): Promise<number>;
}

export abstract class BaseRepository<T, CreateInput, UpdateInput>
  implements IBaseRepository<T, CreateInput, UpdateInput>
{
  constructor(protected readonly db: PrismaClient) {}

  abstract findById(id: string): Promise<T | null>;
  abstract findMany(args?: object): Promise<T[]>;
  abstract create(data: CreateInput): Promise<T>;
  abstract update(id: string, data: UpdateInput): Promise<T>;
  abstract delete(id: string): Promise<T>;
  abstract count(where?: object): Promise<number>;
}
