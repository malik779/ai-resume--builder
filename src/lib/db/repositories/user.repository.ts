import type { Prisma, User } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "../client";

type UserWithSubscription = Prisma.UserGetPayload<{ include: { subscription: true } }>;

export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor() {
    super(prisma);
  }

  findById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  findWithSubscription(id: string): Promise<UserWithSubscription | null> {
    return this.db.user.findUnique({
      where: { id },
      include: { subscription: true },
    });
  }

  findMany(args?: Prisma.UserFindManyArgs) {
    return this.db.user.findMany(args);
  }

  create(data: Prisma.UserCreateInput) {
    return this.db.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.db.user.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.user.delete({ where: { id } });
  }

  count(where?: Prisma.UserWhereInput) {
    return this.db.user.count({ where });
  }
}

export const userRepository = new UserRepository();
