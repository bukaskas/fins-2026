import { notFound } from "next/navigation";
import { getUserById } from "@/lib/actions/user.actions";
import UserEditFormClient from "./UserEditForm";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || typeof id !== "string") return notFound();

  const user = await getUserById(id);
  if (!user) return notFound();

  return <UserEditFormClient user={user} />;
}
