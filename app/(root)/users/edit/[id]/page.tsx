import { notFound } from "next/navigation";
import { getUserById } from "@/lib/actions/user.actions";
import { ADMIN_ROLES, requireRolePage } from "@/lib/auth-guard";
import UserEditFormClient from "./UserEditForm";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRolePage(ADMIN_ROLES);
  const { id } = await params;

  if (!id || typeof id !== "string") return notFound();

  const user = await getUserById(id);
  if (!user) return notFound();

  return <UserEditFormClient user={user} />;
}
