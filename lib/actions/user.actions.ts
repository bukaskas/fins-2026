'use server'
import { prisma } from "@/db/prisma";
import { signUpFormSchema, SignUpFormData } from "../validators";
import bcryptjs from "bcryptjs";


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