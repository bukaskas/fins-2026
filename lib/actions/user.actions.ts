'use server'
import { prisma } from "@/db/prisma";
import { SignUpFormData, UserEditFormData } from "../validators";
import bcryptjs from "bcryptjs";

import { Prisma, Role } from "@prisma/client";
import { sendRegistrationEmail } from "@/emails";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_ROLES, STAFF_ROLES, hasRole, requireRole } from "@/lib/auth-guard";
import { issueEmailVerificationForUser } from "@/lib/actions/auth.actions";

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

    // Send an email-verification link (non-blocking; failures are logged).
    await issueEmailVerificationForUser(result.id);

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

export async function getUserById(id: string) {
  await requireRole(ADMIN_ROLES);
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isInstructor: true,
        instructorProfile: {
          select: {
            privateRateCents: true,
            semiPrivateRateCents: true,
            extraPrivateRateCents: true,
            extraSemiPrivateRateCents: true,
            foilRateCents: true,
            kidsRateCents: true,
          },
        },
      },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw new Error("Failed to fetch user");
  }
}

export async function updateUser(id: string, data: UserEditFormData) {
  if (!(await hasRole(ADMIN_ROLES))) {
    return { success: false, message: "Not authorized." };
  }
  try {
    const passwordData =
      data.password && data.password.length > 0
        ? { password: await bcryptjs.hash(data.password, 10) }
        : {};

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: {
          name: data.name || null,
          phone: data.phone || null,
          email: data.email,
          role: data.role,
          isInstructor: data.isInstructor,
          ...passwordData,
        },
        select: { id: true },
      });

      if (data.isInstructor) {
        const rates = data.rates ?? {
          privateRateCents: 0,
          semiPrivateRateCents: 0,
          extraPrivateRateCents: 0,
          extraSemiPrivateRateCents: 0,
          foilRateCents: 0,
          kidsRateCents: 0,
        };
        await tx.instructorProfile.upsert({
          where: { userId: id },
          create: { userId: id, ...rates },
          update: rates,
        });
      }

      return u;
    });

    return { success: true, message: "User updated successfully.", userId: updated.id };
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return { success: false, message: "Email is already used by another account." };
    }

    console.error("Error updating user:", error);
    return { success: false, message: "Failed to update user." };
  }
}

export async function searchUser(query: string) {
  await requireRole(STAFF_ROLES);
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


export async function listInstructors() {
  await requireRole(STAFF_ROLES);
  return prisma.user.findMany({
    where: { OR: [{ role: Role.INSTRUCTOR }, { isInstructor: true }] },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function listAgents() {
  await requireRole(STAFF_ROLES);
  return prisma.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.STAFF] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function createUserAsAdmin(data: {
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  password: string;
  isInstructor?: boolean;
}) {
  if (!(await hasRole(ADMIN_ROLES))) {
    return { success: false, message: "Not authorized." };
  }
  try {
    const hashedPassword = await bcryptjs.hash(data.password, 10);
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name: data.name || null,
          email: data.email,
          phone: data.phone || null,
          role: data.role,
          isInstructor: data.isInstructor ?? false,
          password: hashedPassword,
          // Admin-created accounts are trusted, so skip the verification nag.
          emailVerified: new Date(),
        },
        select: { id: true },
      });
      if (data.isInstructor) {
        await tx.instructorProfile.create({ data: { userId: u.id } });
      }
      return u;
    });
    return { success: true, userId: user.id };
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return { success: false, message: "An account with this email already exists." };
    }
    console.error("Error creating user:", error);
    return { success: false, message: "Failed to create user." };
  }
}

export async function createStudent(formData: FormData) {
  await requireRole(STAFF_ROLES);
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!name) throw new Error("Name is required.");
  if (!email) throw new Error("Email is required.");

  const hashedPassword = await bcryptjs.hash(crypto.randomUUID(), 10);

  const user = await prisma.user.create({
    data: { name, email, phone, password: hashedPassword },
    select: { id: true },
  });

  redirect(`/lessons/new?guestId=${user.id}`);
}

export async function createGuest(data: { name: string; email: string; phone: string | null }) {
  if (!(await hasRole(STAFF_ROLES))) {
    return { success: false as const, message: "Not authorized." };
  }
  try {
    const hashedPassword = await bcryptjs.hash(crypto.randomUUID(), 10);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, phone: data.phone || null, password: hashedPassword },
      select: { id: true, name: true, email: true },
    });
    return { success: true as const, user };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false as const, message: "A guest with this email already exists." };
    }
    console.error("Error creating guest:", error);
    return { success: false as const, message: "Failed to create guest." };
  }
}

export async function deleteUser(id: string) {
  if (!(await hasRole(ADMIN_ROLES))) {
    return { success: false as const, message: "Not authorized." };
  }
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/users");
    return { success: true as const, message: "User deleted." };
  } catch (error: any) {
    if (error.code === "P2025") {
      return { success: false as const, message: "User not found." };
    }
    if (error.code === "P2003") {
      return {
        success: false as const,
        message: "Cannot delete: user has instructor commissions on record.",
      };
    }
    console.error("Error deleting user:", error);
    return { success: false as const, message: "Failed to delete user." };
  }
}

function buildUserWhere(query?: string, role?: Role): Prisma.UserWhereInput | undefined {
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

  const and: Prisma.UserWhereInput[] = [];
  if (orFilters.length) and.push({ OR: orFilters });
  if (role) and.push({ role });

  return and.length ? { AND: and } : undefined;
}

export async function listUsers(query?: string, role?: Role) {
  await requireRole(STAFF_ROLES);
  return prisma.user.findMany({
    where: buildUserWhere(query, role),
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

export async function listUsersForExport(query?: string, role?: Role) {
  await requireRole(ADMIN_ROLES);
  return prisma.user.findMany({
    where: buildUserWhere(query, role),
    select: {
      name: true,
      email: true,
      phone: true,
      role: true,
    },
    orderBy: [{ name: "asc" }],
  });
}

