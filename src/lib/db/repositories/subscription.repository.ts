import type { Prisma, Subscription, SubscriptionTier } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "../client";

export class SubscriptionRepository extends BaseRepository<
  Subscription,
  Prisma.SubscriptionCreateInput,
  Prisma.SubscriptionUpdateInput
> {
  constructor() {
    super(prisma);
  }

  findById(id: string) {
    return this.db.subscription.findUnique({ where: { id } });
  }

  findByUserId(userId: string) {
    return this.db.subscription.findUnique({ where: { userId } });
  }

  findByStripeCustomerId(stripeCustomerId: string) {
    return this.db.subscription.findUnique({ where: { stripeCustomerId } });
  }

  findByStripeSubscriptionId(stripeSubscriptionId: string) {
    return this.db.subscription.findUnique({ where: { stripeSubscriptionId } });
  }

  findMany(args?: Prisma.SubscriptionFindManyArgs) {
    return this.db.subscription.findMany(args);
  }

  create(data: Prisma.SubscriptionCreateInput) {
    return this.db.subscription.create({ data });
  }

  update(id: string, data: Prisma.SubscriptionUpdateInput) {
    return this.db.subscription.update({ where: { id }, data });
  }

  updateByUserId(userId: string, data: Prisma.SubscriptionUpdateInput) {
    return this.db.subscription.update({ where: { userId }, data });
  }

  updateByStripeSubscriptionId(stripeSubscriptionId: string, data: Prisma.SubscriptionUpdateInput) {
    return this.db.subscription.update({ where: { stripeSubscriptionId }, data });
  }

  upsertForUser(userId: string, data: Omit<Prisma.SubscriptionCreateInput, "user">) {
    return this.db.subscription.upsert({
      where: { userId },
      create: { ...data, user: { connect: { id: userId } } },
      update: data,
    });
  }

  delete(id: string) {
    return this.db.subscription.delete({ where: { id } });
  }

  count(where?: Prisma.SubscriptionWhereInput) {
    return this.db.subscription.count({ where });
  }

  countByTier(tier: SubscriptionTier) {
    return this.db.subscription.count({ where: { tier } });
  }
}

export const subscriptionRepository = new SubscriptionRepository();
