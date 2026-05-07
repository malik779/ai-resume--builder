import type { ChatMessage, ChatRole, ChatSession, Prisma } from "@prisma/client";
import prisma from "../client";

export type ChatSessionWithMessages = Prisma.ChatSessionGetPayload<{
  include: { messages: true };
}>;

export class ChatRepository {
  constructor(private readonly db = prisma) {}

  findSession(id: string): Promise<ChatSession | null> {
    return this.db.chatSession.findUnique({ where: { id } });
  }

  findSessionAndUser(id: string, userId: string): Promise<ChatSession | null> {
    return this.db.chatSession.findFirst({ where: { id, userId } });
  }

  findSessionWithMessages(
    id: string,
    userId: string,
  ): Promise<ChatSessionWithMessages | null> {
    return this.db.chatSession.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  listForUser(userId: string, limit = 20): Promise<ChatSession[]> {
    return this.db.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  }

  // Idempotent: if a session row with this id already exists for this user,
  // returns it; otherwise creates a new one. The id is client-supplied (UUID).
  async upsertSession(input: {
    id: string;
    userId: string;
    resumeId?: string;
    title?: string;
  }): Promise<ChatSession> {
    return this.db.chatSession.upsert({
      where: { id: input.id },
      update: { updatedAt: new Date() },
      create: {
        id: input.id,
        userId: input.userId,
        resumeId: input.resumeId,
        title: input.title,
      },
    });
  }

  appendMessage(input: {
    sessionId: string;
    role: ChatRole;
    content: string;
    toolCalls?: Prisma.InputJsonValue;
  }): Promise<ChatMessage> {
    return this.db.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          sessionId: input.sessionId,
          role: input.role,
          content: input.content,
          toolCalls: input.toolCalls,
        },
      });
      await tx.chatSession.update({
        where: { id: input.sessionId },
        data: { updatedAt: new Date() },
      });
      return message;
    });
  }

  recentMessages(sessionId: string, limit = 20): Promise<ChatMessage[]> {
    return this.db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }).then((rows) => rows.reverse());
  }
}

export const chatRepository = new ChatRepository();
