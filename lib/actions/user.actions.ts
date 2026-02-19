'use server'
import { prisma } from "@/db/prisma";
import { SignUpFormData } from "../validators";
import bcryptjs from "bcryptjs";

import { Prisma, Role } from "@prisma/client";
import { sendRegistrationEmail } from "@/emails";

// ...existing code...


export async function createUser(data: SignUpFormData) {
  try {
    const hashedPassword = await bcryptjs.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name || null,
          phone: data.phone || null,
        },
      });

      // Optional for credentials provider, but you can keep it:
      await tx.account.create({
        data: {
          userId: user.id,
          type: "credentials",
          provider: "credentials",
          providerAccountId: user.email, // or user.id
        },
      });

      return user;
    });
    let emailSent = false;
    try {
      console.log("[createUser] sending registration email to:", result.email);
      await sendRegistrationEmail(result.email, result.name || "");
      emailSent = true;
      console.log("[createUser] registration email sent");
    } catch (emailError) {
      console.error("[createUser] registration email failed:", emailError);
    }

    return {
      success: true,
      message: "Account created successfully!",
      userId: result.id,
    };
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return {
        success: false,
        message: "An account with this email already exists.",
      };
    }

    console.error("Error creating user:", error);
    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function verifyPassword(plainPassword: string, hashedPassword: string) {
  return await bcryptjs.compare(plainPassword, hashedPassword);
}

export async function searchUser(query: string) {
  const q = query.trim();
  if (!q) return [];

  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
    orderBy: [{ name: "asc" }],
    take: 25,
  });
}


export async function listUsers(query?: string) {
  const q = (query ?? "").trim();
  const qUpper = q.toUpperCase();

  const orFilters: Prisma.UserWhereInput[] = q
    ? [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ]
    : [];

  if (q && Object.values(Role).includes(qUpper as Role)) {
    orFilters.push({ role: { equals: qUpper as Role } });
  }

  return prisma.user.findMany({
    where: orFilters.length ? { OR: orFilters } : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });
}

