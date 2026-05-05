import { auth } from "@/lib/auth/config";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, email: true, name: true, image: true },
  });

  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  return user;
}

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  return user?.role === "ADMIN" ? session : null;
}

