// Barrel export — import repositories from one place
export { userRepository } from "./repositories/user.repository";
export { resumeRepository } from "./repositories/resume.repository";
export { subscriptionRepository } from "./repositories/subscription.repository";
export { aiUsageRepository } from "./repositories/ai-usage.repository";
export { jobRepository, applicationRepository } from "./repositories/job.repository";
export { prisma as db } from "./client";
